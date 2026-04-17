"""
Admin & analytics endpoints.
#3 - Fixed N+1 query using subquery for message counts.
#12 - Added time-series analytics and top questions.
"""
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Conversations for a specific bot (#3 - N+1 FIX) ──
@router.get("/bots/{bot_id}/conversations", response_model=List[schemas.ConversationOut])
def list_conversations(
    bot_id: str,
    platform: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    # Subquery for message count — eliminates N+1
    msg_count_subq = (
        db.query(
            models.Message.conversation_id,
            func.count(models.Message.id).label("msg_count")
        )
        .group_by(models.Message.conversation_id)
        .subquery()
    )

    q = (
        db.query(models.Conversation, msg_count_subq.c.msg_count)
        .outerjoin(msg_count_subq, models.Conversation.id == msg_count_subq.c.conversation_id)
        .filter(models.Conversation.bot_id == bot_id)
    )

    if platform:
        try:
            p = models.PlatformEnum(platform)
            q = q.filter(models.Conversation.platform == p)
        except ValueError:
            pass

    rows = q.order_by(models.Conversation.last_message_at.desc()).offset(offset).limit(limit).all()

    return [
        schemas.ConversationOut(
            id=c.id,
            bot_id=c.bot_id,
            platform=c.platform.value,
            external_user_id=c.external_user_id,
            external_user_name=c.external_user_name,
            is_handoff=c.is_handoff,
            created_at=c.created_at,
            last_message_at=c.last_message_at,
            message_count=msg_count or 0,
        )
        for c, msg_count in rows
    ]


@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationDetail)
def get_conversation(
    conversation_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    bot = db.query(models.Bot).filter(
        models.Bot.id == convo.bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(403, "Access denied")

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return schemas.ConversationDetail(
        id=convo.id,
        bot_id=convo.bot_id,
        platform=convo.platform.value,
        external_user_id=convo.external_user_id,
        external_user_name=convo.external_user_name,
        is_handoff=convo.is_handoff,
        created_at=convo.created_at,
        last_message_at=convo.last_message_at,
        message_count=len(messages),
        messages=[
            schemas.MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                tokens_used=m.tokens_used,
                model_used=m.model_used,
                message_type=m.message_type or "text",
                rich_content=m.rich_content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


# ── Dashboard stats ──────────────────────────────────
@router.get("/dashboard")
def dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bots = db.query(models.Bot).filter(models.Bot.user_id == current_user.id).all()

    return {
        "total_bots": len(bots),
        "total_messages": sum(b.total_messages or 0 for b in bots),
        "total_conversations": sum(b.total_conversations or 0 for b in bots),
        "active_bots": sum(1 for b in bots if b.is_active),
    }


# ── Analytics (#12) ──────────────────────────────────
@router.get("/bots/{bot_id}/analytics", response_model=schemas.AnalyticsResponse)
def bot_analytics(
    bot_id: str,
    days: int = Query(default=30, le=90),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    since = datetime.utcnow() - timedelta(days=days)

    # Messages per day
    daily = (
        db.query(
            cast(models.Message.created_at, Date).label("date"),
            func.count(models.Message.id).label("count")
        )
        .join(models.Conversation, models.Message.conversation_id == models.Conversation.id)
        .filter(
            models.Conversation.bot_id == bot_id,
            models.Message.created_at >= since,
        )
        .group_by(cast(models.Message.created_at, Date))
        .order_by(cast(models.Message.created_at, Date))
        .all()
    )

    # Platform breakdown
    platform_counts = (
        db.query(models.Conversation.platform, func.count(models.Conversation.id))
        .filter(models.Conversation.bot_id == bot_id)
        .group_by(models.Conversation.platform)
        .all()
    )

    # Top questions (most common user messages)
    top_q = (
        db.query(models.Message.content, func.count(models.Message.id).label("cnt"))
        .join(models.Conversation, models.Message.conversation_id == models.Conversation.id)
        .filter(
            models.Conversation.bot_id == bot_id,
            models.Message.role == "user",
            models.Message.created_at >= since,
        )
        .group_by(models.Message.content)
        .order_by(func.count(models.Message.id).desc())
        .limit(10)
        .all()
    )

    return schemas.AnalyticsResponse(
        total_messages=bot.total_messages or 0,
        total_conversations=bot.total_conversations or 0,
        messages_by_platform={str(p): c for p, c in platform_counts},
        daily_messages=[
            schemas.DailyMessageStat(date=str(d), count=c) for d, c in daily
        ],
        top_questions=[{"question": q, "count": c} for q, c in top_q],
    )


# ── Human Handoff toggle (#9) ────────────────────────
@router.post("/conversations/{conversation_id}/handoff")
def toggle_handoff(
    conversation_id: str,
    enable: bool = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    bot = db.query(models.Bot).filter(
        models.Bot.id == convo.bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(403, "Access denied")

    convo.is_handoff = enable
    db.commit()
    return {"conversation_id": conversation_id, "is_handoff": enable}


# ── Send message as admin (Human Handoff) (#9) ──────
@router.post("/conversations/{conversation_id}/reply")
async def admin_reply(
    conversation_id: str,
    body: schemas.ChatMessage,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convo = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    bot = db.query(models.Bot).filter(
        models.Bot.id == convo.bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(403, "Access denied")

    # Save admin message
    msg = models.Message(
        conversation_id=conversation_id,
        role="assistant",
        content=body.content,
    )
    db.add(msg)
    db.commit()

    # Send to platform
    import httpx
    if convo.platform == models.PlatformEnum.LINE and bot.line_channel_access_token:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://api.line.me/v2/bot/message/push",
                headers={"Authorization": f"Bearer {bot.line_channel_access_token}", "Content-Type": "application/json"},
                json={"to": convo.external_user_id, "messages": [{"type": "text", "text": body.content}]},
                timeout=10,
            )
    elif convo.platform == models.PlatformEnum.FACEBOOK and bot.fb_page_token:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.facebook.com/v18.0/me/messages?access_token={bot.fb_page_token}",
                json={"recipient": {"id": convo.external_user_id}, "message": {"text": body.content}},
                timeout=10,
            )

    return {"status": "sent", "message_id": msg.id}


# ── AI Summary ────────────────────────────────────────
@router.post("/conversations/{conversation_id}/summary")
async def conversation_summary(
    conversation_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Use AI to summarize a conversation."""
    from app.services.openai_service import chat_with_openai

    convo = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()
    if not convo:
        raise HTTPException(404, "Conversation not found")

    msgs = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .limit(50)
        .all()
    )
    if not msgs:
        return {"summary": "ยังไม่มีข้อความในบทสนทนานี้"}

    chat_log = "\n".join(
        f"{'ลูกค้า' if m.role == 'user' else 'บอท/แอดมิน'}: {m.content}"
        for m in msgs
    )

    bot = db.query(models.Bot).filter(models.Bot.id == convo.bot_id).first()
    model = "gemini-3-flash-preview"  # internal task — always use Gemini

    summary_prompt = (
        "สรุปบทสนทนาต่อไปนี้ให้กระชับภายใน 2-3 ประโยค เป็นภาษาไทย "
        "ระบุสิ่งที่ลูกค้าสนใจ ปัญหาที่พบ และสถานะปัจจุบัน:\n\n"
        f"{chat_log}"
    )

    try:
        text, _ = await chat_with_openai(
            system_prompt="คุณเป็นผู้ช่วยสรุปบทสนทนา ตอบเป็นภาษาไทยกระชับ",
            messages=[{"role": "user", "content": summary_prompt}],
            model=model,
            max_tokens=300,
            temperature=0.3,
            api_key=bot.openai_api_key if bot else None,
        )
        return {"summary": text}
    except Exception as e:
        logger.error(f"AI Summary failed: {e}")
        return {"summary": f"ไม่สามารถสรุปได้: {e}"}
