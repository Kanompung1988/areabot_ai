"""
OpenAI-compatible proxy endpoint.
#8 - Streaming Response via SSE
#11 - Multi-model support
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.openai_service import (
    chat_with_openai, chat_with_openai_stream, AVAILABLE_MODELS,
)
from app.services.rag_service import retrieve_context
from app.services.intent_classifier import classify_intent
from app.services.pii_service import mask_pii
from app.services.claude_service import inject_runtime_guardrails

router = APIRouter(tags=["OpenAI Proxy"])


def _get_bot_from_api_key(api_key: str, db: Session) -> models.Bot:
    bot = db.query(models.Bot).filter(
        models.Bot.api_key == api_key, models.Bot.is_active == True
    ).first()
    if not bot:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    return bot


def _get_or_create_conversation(
    bot_id: str,
    platform: models.PlatformEnum,
    external_user_id: str,
    db: Session,
) -> models.Conversation:
    convo = db.query(models.Conversation).filter(
        models.Conversation.bot_id == bot_id,
        models.Conversation.platform == platform,
        models.Conversation.external_user_id == external_user_id,
    ).first()
    if not convo:
        convo = models.Conversation(
            bot_id=bot_id,
            platform=platform,
            external_user_id=external_user_id,
        )
        db.add(convo)
        db.flush()
        db.query(models.Bot).filter(models.Bot.id == bot_id).update(
            {"total_conversations": models.Bot.total_conversations + 1}
        )
    convo.last_message_at = datetime.utcnow()
    return convo


@router.post("/v1/chat/completions")
async def chat_completions(
    request: Request,
    db: Session = Depends(get_db),
):
    # Extract Bearer token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    api_key = auth_header.split(" ", 1)[1].strip()

    bot = _get_bot_from_api_key(api_key, db)

    body = await request.json()
    req = schemas.ChatCompletionRequest(**body)

    # Multi-model: use bot's default or request override (#11)
    model = req.model or bot.model_name or "gpt-4.1-mini"
    bot_openai_key = bot.openai_api_key  # per-bot key; None = ใช้ global key

    # Determine platform from custom header
    platform_str = request.headers.get("X-Platform", "api").lower()
    platform_map = {
        "line": models.PlatformEnum.LINE,
        "facebook": models.PlatformEnum.FACEBOOK,
        "instagram": models.PlatformEnum.INSTAGRAM,
    }
    platform = platform_map.get(platform_str, models.PlatformEnum.API)

    external_user_id = request.headers.get("X-User-Id", "anonymous")

    convo = _get_or_create_conversation(bot.id, platform, external_user_id, db)

    # Save user messages
    for msg in req.messages:
        if msg.role == "user":
            db.add(models.Message(
                conversation_id=convo.id,
                role="user",
                content=msg.content,
            ))

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    # RAG context injection (#5) — skipped for DIRECT intents to save latency/cost
    system_prompt = bot.system_prompt or ""
    last_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    if last_user_msg:
        try:
            intent = await classify_intent(last_user_msg)
            if intent == "RETRIEVE":
                rag_context = await retrieve_context(bot.id, last_user_msg, db)
                if rag_context:
                    system_prompt += f"\n\nข้อมูลอ้างอิงจากฐานความรู้:\n{rag_context}"
        except Exception:
            pass

    # PII masking — ซ่อนข้อมูลส่วนบุคคลก่อนส่ง LLM (PDPA compliance)
    messages = [{"role": m.role, "content": mask_pii(m.content)} for m in req.messages]

    # Streaming response (#8)
    if req.stream:
        async def stream_generator():
            async for chunk in chat_with_openai_stream(
                system_prompt=system_prompt,
                messages=messages,
                model=model,
                max_tokens=req.max_tokens or 1000,
                temperature=req.temperature or 0.7,
                api_key=bot_openai_key,
            ):
                yield chunk

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )

    # Non-streaming
    response_text, tokens = await chat_with_openai(
        system_prompt=system_prompt,
        messages=messages,
        model=model,
        max_tokens=req.max_tokens or 1000,
        temperature=req.temperature or 0.7,
        api_key=bot_openai_key,
    )

    db.add(models.Message(
        conversation_id=convo.id,
        role="assistant",
        content=response_text,
        tokens_used=tokens,
        model_used=model,
    ))
    db.query(models.Bot).filter(models.Bot.id == bot.id).update(
        {"total_messages": models.Bot.total_messages + 2}
    )
    db.commit()

    return {
        "id": f"chatcmpl-{convo.id[:8]}",
        "object": "chat.completion",
        "created": int(datetime.utcnow().timestamp()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": response_text},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": tokens,
        },
    }


# ── Model listing endpoint (#11) ─────────────────────
@router.get("/v1/models")
def list_models():
    """List available AI models."""
    return {
        "object": "list",
        "data": [
            {
                "id": model_id,
                "object": "model",
                "provider": info["provider"],
                "name": info["name"],
                "cost_per_1k_tokens": info["cost_per_1k_tokens"],
                "description": info["description"],
            }
            for model_id, info in AVAILABLE_MODELS.items()
        ]
    }
