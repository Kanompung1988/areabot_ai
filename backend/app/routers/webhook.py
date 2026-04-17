"""
Webhook endpoints for LINE and Facebook Messenger.
#5  - RAG context injection before AI response
#6  - Rich Messages (LINE Flex + Facebook Buttons)
#9  - Human Handoff detection and routing
#16 - Redis caching for bot config lookups
Vision - รับรูปภาพจากลูกค้า ส่งให้ GPT-4.1-mini วิเคราะห์ด้วย Vision
"""
import base64
import hashlib
import hmac
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
import httpx

from app.database import get_db
from app import models
from app.config import get_settings
from app.services.openai_service import chat_with_openai, chat_with_openai_vision, DEFAULT_MODEL
from app.services.rag_service import retrieve_context
from app.services.redis_service import get_cached_bot_config, cache_bot_config, invalidate_bot_cache
from app.services.intent_classifier import classify_intent
from app.services.pii_service import mask_pii
from app.services.claude_service import inject_runtime_guardrails

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/webhook", tags=["Webhooks"])
limiter = Limiter(key_func=get_remote_address)


# ── LINE ──────────────────────────────────────────────
@router.post("/line/{bot_id}")
@limiter.limit(settings.RATE_LIMIT_WEBHOOK)
async def line_webhook(bot_id: str, request: Request, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.is_active == True
    ).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    body_bytes = await request.body()
    body_text = body_bytes.decode("utf-8")

    # Verify LINE signature
    if bot.line_channel_secret:
        signature = request.headers.get("X-Line-Signature", "")
        expected = hmac.new(
            bot.line_channel_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256,
        ).digest()
        expected_b64 = base64.b64encode(expected).decode("utf-8")
        if not hmac.compare_digest(signature, expected_b64):
            raise HTTPException(status_code=400, detail="Invalid signature")

    data = json.loads(body_text)
    events = data.get("events", [])

    for event in events:
        if event.get("type") != "message":
            continue

        msg = event.get("message", {})
        reply_token = event["replyToken"]
        source = event.get("source", {})
        line_user_id = source.get("userId", "unknown")
        convo = _get_or_create_convo(bot.id, models.PlatformEnum.LINE, line_user_id, db)
        model = bot.model_name or DEFAULT_MODEL

        # ── รูปภาพ (Vision) ──────────────────────────────
        if msg.get("type") == "image":
            if not bot.line_channel_access_token:
                continue
            try:
                image_base64, image_mime = await _download_line_image(
                    msg["id"], bot.line_channel_access_token
                )
                history = _get_history(convo.id, db)
                db.add(models.Message(
                    conversation_id=convo.id, role="user", content="[ส่งรูปภาพ]"
                ))

                system_prompt = bot.system_prompt or ""
                reply_text, tokens = await chat_with_openai_vision(
                    system_prompt=system_prompt,
                    messages=history + [{"role": "user", "content": "ช่วยดูรูปนี้ให้หน่อยนะคะ"}],
                    image_base64=image_base64,
                    image_mime=image_mime,
                    model=model,
                    api_key=bot.openai_api_key,
                )

                db.add(models.Message(
                    conversation_id=convo.id, role="assistant",
                    content=reply_text, tokens_used=tokens, model_used=model,
                ))
                db.query(models.Bot).filter(models.Bot.id == bot.id).update(
                    {"total_messages": models.Bot.total_messages + 2}
                )
                db.commit()
                await _line_reply(bot.line_channel_access_token, reply_token, reply_text)
            except Exception as e:
                logger.warning(f"LINE vision processing failed: {e}")
            continue

        # ── ข้อความปกติ ──────────────────────────────────
        if msg.get("type") != "text":
            continue

        user_text = msg["text"]

        # Human handoff check (#9)
        if _check_handoff(bot, convo, user_text, db):
            if bot.line_channel_access_token:
                await _line_reply(
                    bot.line_channel_access_token, reply_token,
                    "กำลังส่งต่อให้เจ้าหน้าที่ กรุณารอสักครู่ครับ"
                )
            continue

        if convo.is_handoff:
            db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))
            db.commit()
            continue

        history = _get_history(convo.id, db)
        history.append({"role": "user", "content": user_text})
        db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))

        # RAG context injection (#5) — skipped for DIRECT intents to save latency/cost
        system_prompt = inject_runtime_guardrails(
            bot.system_prompt or "", bot.business_type or ""
        )
        try:
            intent = await classify_intent(user_text)
            if intent == "RETRIEVE":
                rag_context = await retrieve_context(bot.id, user_text, db)
                if rag_context:
                    system_prompt += f"\n\nข้อมูลอ้างอิงจากฐานความรู้:\n{rag_context}"
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")

        # PII masking — ซ่อนเบอร์โทร/อีเมลก่อนส่ง LLM (PDPA compliance)
        safe_history = [
            {"role": m["role"], "content": mask_pii(m["content"])}
            for m in history
        ]
        safe_history[-1]["content"] = mask_pii(user_text)

        reply_text, tokens = await chat_with_openai(
            system_prompt=system_prompt,
            messages=safe_history,
            model=model,
            api_key=bot.openai_api_key,
        )

        # Rich message detection (#6)
        rich_content = _detect_rich_content(reply_text)

        db.add(models.Message(
            conversation_id=convo.id, role="assistant",
            content=reply_text, tokens_used=tokens, model_used=model,
            message_type=rich_content["type"] if rich_content else "text",
            rich_content=rich_content,
        ))
        db.query(models.Bot).filter(models.Bot.id == bot.id).update(
            {"total_messages": models.Bot.total_messages + 2}
        )
        db.commit()

        if bot.line_channel_access_token:
            if rich_content and rich_content.get("type") == "flex":
                await _line_flex_reply(
                    bot.line_channel_access_token, reply_token, reply_text, rich_content
                )
            else:
                await _line_reply(bot.line_channel_access_token, reply_token, reply_text)

    return {"status": "ok"}


async def _download_line_image(message_id: str, token: str) -> tuple[str, str]:
    """Download image from LINE API. Returns (base64_string, mime_type)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api-data.line.me/v2/bot/message/{message_id}/content",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return base64.b64encode(response.content).decode("utf-8"), content_type


async def _line_reply(token: str, reply_token: str, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.line.me/v2/bot/message/reply",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"replyToken": reply_token, "messages": [{"type": "text", "text": text}]},
            timeout=10,
        )


async def _line_flex_reply(token: str, reply_token: str, alt_text: str, rich_content: dict):
    """Send LINE Flex Message (#6)."""
    flex_msg = {
        "type": "flex",
        "altText": alt_text[:400],
        "contents": rich_content.get("flex_body", {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [{"type": "text", "text": alt_text, "wrap": True}]
            }
        })
    }
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.line.me/v2/bot/message/reply",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"replyToken": reply_token, "messages": [flex_msg]},
            timeout=10,
        )


# ── Facebook ──────────────────────────────────────────
@router.get("/facebook/{bot_id}")
async def fb_verify(bot_id: str, request: Request, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404)
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == (bot.fb_verify_token or "areabot"):
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/facebook/{bot_id}")
@limiter.limit(settings.RATE_LIMIT_WEBHOOK)
async def fb_webhook(bot_id: str, request: Request, db: Session = Depends(get_db)):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.is_active == True
    ).first()
    if not bot:
        raise HTTPException(status_code=404)

    body_bytes = await request.body()

    # Verify X-Hub-Signature-256 (#security)
    if bot.fb_app_secret:
        sig_header = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            bot.fb_app_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected):
            raise HTTPException(status_code=400, detail="Invalid Facebook signature")

    data = json.loads(body_bytes)
    if data.get("object") != "page":
        return {"status": "ignored"}

    for entry in data.get("entry", []):
        for messaging in entry.get("messaging", []):
            sender_id = messaging.get("sender", {}).get("id")
            msg = messaging.get("message", {})
            model = bot.model_name or DEFAULT_MODEL

            # ── รูปภาพ Facebook (Vision) ──────────────────
            image_url = next(
                (
                    a.get("payload", {}).get("url")
                    for a in msg.get("attachments", [])
                    if a.get("type") == "image"
                ),
                None,
            )
            if image_url:
                convo = _get_or_create_convo(
                    bot.id, models.PlatformEnum.FACEBOOK, sender_id, db
                )
                try:
                    image_base64, image_mime = await _download_image_from_url(image_url)
                    history = _get_history(convo.id, db)
                    db.add(models.Message(
                        conversation_id=convo.id, role="user", content="[ส่งรูปภาพ]"
                    ))

                    system_prompt = bot.system_prompt or ""
                    reply_text, tokens = await chat_with_openai_vision(
                        system_prompt=system_prompt,
                        messages=history + [{"role": "user", "content": "ช่วยดูรูปนี้ให้หน่อยนะคะ"}],
                        image_base64=image_base64,
                        image_mime=image_mime,
                        model=model,
                    )

                    db.add(models.Message(
                        conversation_id=convo.id, role="assistant",
                        content=reply_text, tokens_used=tokens, model_used=model,
                    ))
                    db.query(models.Bot).filter(models.Bot.id == bot.id).update(
                        {"total_messages": models.Bot.total_messages + 2}
                    )
                    db.commit()
                    if bot.fb_page_token:
                        await _fb_send(bot.fb_page_token, sender_id, reply_text)
                except Exception as e:
                    logger.warning(f"Facebook vision processing failed: {e}")
                continue

            # ── ข้อความปกติ ──────────────────────────────
            if not msg.get("text"):
                continue

            user_text = msg["text"]
            convo = _get_or_create_convo(
                bot.id, models.PlatformEnum.FACEBOOK, sender_id, db
            )

            # Human handoff check (#9)
            if _check_handoff(bot, convo, user_text, db):
                if bot.fb_page_token:
                    await _fb_send(
                        bot.fb_page_token, sender_id,
                        "กำลังส่งต่อให้เจ้าหน้าที่ กรุณารอสักครู่ครับ"
                    )
                continue

            if convo.is_handoff:
                db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))
                db.commit()
                continue

            history = _get_history(convo.id, db)
            history.append({"role": "user", "content": user_text})
            db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))

            # RAG context (#5) — skipped for DIRECT intents
            system_prompt = inject_runtime_guardrails(
                bot.system_prompt or "", bot.business_type or ""
            )
            try:
                intent = await classify_intent(user_text)
                if intent == "RETRIEVE":
                    rag_context = await retrieve_context(bot.id, user_text, db)
                    if rag_context:
                        system_prompt += f"\n\nข้อมูลอ้างอิงจากฐานความรู้:\n{rag_context}"
            except Exception as e:
                logger.warning(f"RAG retrieval failed: {e}")

            # PII masking (PDPA compliance)
            safe_history = [
                {"role": m["role"], "content": mask_pii(m["content"])}
                for m in history
            ]
            safe_history[-1]["content"] = mask_pii(user_text)

            reply_text, tokens = await chat_with_openai(
                system_prompt=system_prompt,
                messages=safe_history,
                model=model,
            )

            rich_content = _detect_rich_content(reply_text)

            db.add(models.Message(
                conversation_id=convo.id, role="assistant",
                content=reply_text, tokens_used=tokens, model_used=model,
                message_type=rich_content["type"] if rich_content else "text",
                rich_content=rich_content,
            ))
            db.query(models.Bot).filter(models.Bot.id == bot.id).update(
                {"total_messages": models.Bot.total_messages + 2}
            )
            db.commit()

            if bot.fb_page_token:
                if rich_content and rich_content.get("type") == "buttons":
                    await _fb_send_buttons(bot.fb_page_token, sender_id, reply_text, rich_content)
                else:
                    await _fb_send(bot.fb_page_token, sender_id, reply_text)

    return {"status": "ok"}


# ── Instagram ─────────────────────────────────────────
@router.get("/instagram/{bot_id}")
async def ig_verify(bot_id: str, request: Request, db: Session = Depends(get_db)):
    """Webhook verification สำหรับ Instagram (Meta Graph API)."""
    bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404)
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == (bot.instagram_verify_token or "areabot"):
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/instagram/{bot_id}")
@limiter.limit(settings.RATE_LIMIT_WEBHOOK)
async def ig_webhook(bot_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Instagram DM webhook (Meta Graph API).
    object = "instagram" — รับ DM ทั้งข้อความและรูปภาพ
    """
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.is_active == True
    ).first()
    if not bot:
        raise HTTPException(status_code=404)

    body_bytes = await request.body()

    # Verify X-Hub-Signature-256 using App Secret (same as FB)
    if bot.fb_app_secret:
        sig_header = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            bot.fb_app_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig_header, expected):
            raise HTTPException(status_code=400, detail="Invalid Instagram signature")

    data = json.loads(body_bytes)
    if data.get("object") != "instagram":
        return {"status": "ignored"}

    for entry in data.get("entry", []):
        for messaging in entry.get("messaging", []):
            sender_id = messaging.get("sender", {}).get("id")
            msg = messaging.get("message", {})
            model = bot.model_name or DEFAULT_MODEL

            # ── รูปภาพ Instagram (Vision) ─────────────────
            image_url = next(
                (
                    a.get("payload", {}).get("url")
                    for a in msg.get("attachments", [])
                    if a.get("type") == "image"
                ),
                None,
            )
            if image_url:
                convo = _get_or_create_convo(
                    bot.id, models.PlatformEnum.INSTAGRAM, sender_id, db
                )
                try:
                    image_base64, image_mime = await _download_image_from_url(image_url)
                    history = _get_history(convo.id, db)
                    db.add(models.Message(
                        conversation_id=convo.id, role="user", content="[ส่งรูปภาพ]"
                    ))

                    system_prompt = bot.system_prompt or ""
                    reply_text, tokens = await chat_with_openai_vision(
                        system_prompt=system_prompt,
                        messages=history + [{"role": "user", "content": "ช่วยดูรูปนี้ให้หน่อยนะคะ"}],
                        image_base64=image_base64,
                        image_mime=image_mime,
                        model=model,
                        api_key=bot.openai_api_key,
                    )

                    db.add(models.Message(
                        conversation_id=convo.id, role="assistant",
                        content=reply_text, tokens_used=tokens, model_used=model,
                    ))
                    db.query(models.Bot).filter(models.Bot.id == bot.id).update(
                        {"total_messages": models.Bot.total_messages + 2}
                    )
                    db.commit()
                    if bot.instagram_access_token:
                        await _ig_send(bot.instagram_access_token, sender_id, reply_text)
                except Exception as e:
                    logger.warning(f"Instagram vision processing failed: {e}")
                continue

            # ── ข้อความปกติ ──────────────────────────────
            if not msg.get("text"):
                continue

            user_text = msg["text"]
            convo = _get_or_create_convo(
                bot.id, models.PlatformEnum.INSTAGRAM, sender_id, db
            )

            # Human handoff check (#9)
            if _check_handoff(bot, convo, user_text, db):
                if bot.instagram_access_token:
                    await _ig_send(
                        bot.instagram_access_token, sender_id,
                        "กำลังส่งต่อให้เจ้าหน้าที่ กรุณารอสักครู่ครับ"
                    )
                continue

            if convo.is_handoff:
                db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))
                db.commit()
                continue

            history = _get_history(convo.id, db)
            history.append({"role": "user", "content": user_text})
            db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))

            # RAG context (#5) — skipped for DIRECT intents
            system_prompt = inject_runtime_guardrails(
                bot.system_prompt or "", bot.business_type or ""
            )
            try:
                intent = await classify_intent(user_text)
                if intent == "RETRIEVE":
                    rag_context = await retrieve_context(bot.id, user_text, db)
                    if rag_context:
                        system_prompt += f"\n\nข้อมูลอ้างอิงจากฐานความรู้:\n{rag_context}"
            except Exception as e:
                logger.warning(f"RAG retrieval failed: {e}")

            # PII masking (PDPA compliance)
            safe_history = [
                {"role": m["role"], "content": mask_pii(m["content"])}
                for m in history
            ]
            safe_history[-1]["content"] = mask_pii(user_text)

            reply_text, tokens = await chat_with_openai(
                system_prompt=system_prompt,
                messages=safe_history,
                model=model,
                api_key=bot.openai_api_key,
            )

            db.add(models.Message(
                conversation_id=convo.id, role="assistant",
                content=reply_text, tokens_used=tokens, model_used=model,
            ))
            db.query(models.Bot).filter(models.Bot.id == bot.id).update(
                {"total_messages": models.Bot.total_messages + 2}
            )
            db.commit()

            if bot.instagram_access_token:
                await _ig_send(bot.instagram_access_token, sender_id, reply_text)

    return {"status": "ok"}


async def _ig_send(access_token: str, recipient_id: str, text: str):
    """ส่ง DM กลับผ่าน Instagram Messaging API (Meta Graph API v18)."""
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://graph.facebook.com/v18.0/me/messages?access_token={access_token}",
            json={
                "recipient": {"id": recipient_id},
                "message": {"text": text},
                "messaging_type": "RESPONSE",
            },
            timeout=10,
        )


async def _download_image_from_url(url: str) -> tuple[str, str]:
    """Download image from URL. Returns (base64_string, mime_type)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30, follow_redirects=True)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return base64.b64encode(response.content).decode("utf-8"), content_type


async def _fb_send(page_token: str, recipient_id: str, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://graph.facebook.com/v18.0/me/messages?access_token={page_token}",
            json={"recipient": {"id": recipient_id}, "message": {"text": text}},
            timeout=10,
        )


async def _fb_send_buttons(page_token: str, recipient_id: str, text: str, rich_content: dict):
    """Send Facebook buttons message (#6)."""
    buttons = rich_content.get("buttons", [])[:3]
    payload = {
        "recipient": {"id": recipient_id},
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": text[:640],
                    "buttons": [
                        {
                            "type": "postback",
                            "title": b.get("label", "")[:20],
                            "payload": b.get("data", ""),
                        }
                        for b in buttons
                    ],
                },
            }
        },
    }
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://graph.facebook.com/v18.0/me/messages?access_token={page_token}",
            json=payload,
            timeout=10,
        )


# ── Helpers ───────────────────────────────────────────
def _get_or_create_convo(
    bot_id: str, platform: models.PlatformEnum, external_user_id: str, db: Session
) -> models.Conversation:
    convo = db.query(models.Conversation).filter(
        models.Conversation.bot_id == bot_id,
        models.Conversation.platform == platform,
        models.Conversation.external_user_id == external_user_id,
    ).first()
    if not convo:
        convo = models.Conversation(
            bot_id=bot_id, platform=platform, external_user_id=external_user_id
        )
        db.add(convo)
        db.flush()
        db.query(models.Bot).filter(models.Bot.id == bot_id).update(
            {"total_conversations": models.Bot.total_conversations + 1}
        )
    convo.last_message_at = datetime.utcnow()
    db.commit()
    return convo


def _get_history(convo_id: str, db: Session, limit: int = 10) -> list[dict]:
    msgs = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == convo_id)
        .order_by(models.Message.created_at.desc())
        .limit(limit)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in reversed(msgs)]


def _check_handoff(
    bot: models.Bot, convo: models.Conversation, user_text: str, db: Session
) -> bool:
    """Check if user is requesting human handoff (#9)."""
    if not bot.handoff_enabled:
        return False

    keywords = (bot.handoff_keywords or "").split(",")
    text_lower = user_text.lower().strip()

    for kw in keywords:
        if kw.strip().lower() in text_lower:
            convo.is_handoff = True
            db.add(models.Message(conversation_id=convo.id, role="user", content=user_text))
            db.add(models.Message(
                conversation_id=convo.id, role="system",
                content=f"[HANDOFF] User requested human agent. Keyword matched: {kw.strip()}"
            ))
            db.commit()
            return True
    return False


def _detect_rich_content(text: str) -> dict | None:
    """Detect if AI response contains structured data for rich messages (#6)."""
    if "```json" in text and "flex" in text.lower():
        try:
            json_start = text.index("```json") + 7
            json_end = text.index("```", json_start)
            json_str = text[json_start:json_end].strip()
            data = json.loads(json_str)
            if "type" in data:
                return data
        except (ValueError, json.JSONDecodeError):
            pass
    return None
