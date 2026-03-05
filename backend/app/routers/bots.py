"""
Bot CRUD operations.
#4 - Background task for system prompt generation
#11 - Multi-model support
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.claude_service import generate_system_prompt, generate_api_key
from app.services.redis_service import invalidate_bot_cache

router = APIRouter(prefix="/bots", tags=["Bots"])


def _generate_prompt_background(bot_id: str, bot_data: dict):
    """Background task to generate system prompt (#4)."""
    import asyncio
    from app.database import SessionLocal

    async def _run():
        prompt = await generate_system_prompt(bot_data)
        db = SessionLocal()
        try:
            db.query(models.Bot).filter(models.Bot.id == bot_id).update(
                {"system_prompt": prompt, "updated_at": datetime.utcnow()}
            )
            db.commit()
        finally:
            db.close()

    asyncio.run(_run())


@router.get("", response_model=List[schemas.BotOut])
def list_bots(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Bot).filter(models.Bot.user_id == current_user.id).all()


@router.post("", response_model=schemas.BotOut, status_code=201)
async def create_bot(
    body: schemas.BotCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ── Subscription bot limit check ──────────────────────────────
    BOT_LIMITS = {"free": 1, "pro": 5, "business": -1}
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).first()
    plan = sub.plan if sub else "free"
    bot_limit = BOT_LIMITS.get(plan, 1)
    if bot_limit != -1:
        current_count = db.query(func.count(models.Bot.id)).filter(
            models.Bot.user_id == current_user.id
        ).scalar() or 0
        if current_count >= bot_limit:
            raise HTTPException(
                status_code=402,
                detail=f"Bot limit reached for {plan} plan ({bot_limit} bots). Please upgrade to create more bots.",
            )

    bot_data = body.model_dump()
    api_key = generate_api_key()

    # Generate prompt synchronously for initial creation (user sees it)
    system_prompt = await generate_system_prompt(bot_data)

    bot = models.Bot(
        user_id=current_user.id,
        api_key=api_key,
        system_prompt=system_prompt,
        **bot_data,
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


@router.get("/{bot_id}", response_model=schemas.BotOut)
def get_bot(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_user_bot(bot_id, current_user.id, db)


@router.put("/{bot_id}", response_model=schemas.BotOut)
async def update_bot(
    bot_id: str,
    body: schemas.BotUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = _get_user_bot(bot_id, current_user.id, db)
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Skip masked openai_api_key — prevents overwriting real key with masked placeholder
        if field == "openai_api_key" and value and str(value).startswith("***"):
            continue
        setattr(bot, field, value)
    bot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(bot)

    # Invalidate cache (#16)
    await invalidate_bot_cache(bot_id)
    return bot


@router.post("/{bot_id}/regenerate-prompt", response_model=schemas.BotOut)
async def regenerate_prompt(
    bot_id: str,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate system prompt — runs in background (#4)."""
    bot = _get_user_bot(bot_id, current_user.id, db)
    bot_data = {
        "company_name": bot.company_name,
        "business_type": bot.business_type,
        "description": bot.description,
        "products_services": bot.products_services,
        "pricing_info": bot.pricing_info,
        "phone": bot.phone,
        "email_contact": bot.email_contact,
        "website": bot.website,
        "address": bot.address,
        "facebook_url": bot.facebook_url,
        "line_id": bot.line_id,
        "bot_name": bot.bot_name,
        "bot_personality": bot.bot_personality,
        "response_language": bot.response_language,
        "greeting_message": bot.greeting_message,
    }

    # Use BackgroundTasks instead of blocking (#4)
    background_tasks.add_task(_generate_prompt_background, bot_id, bot_data)

    bot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(bot)
    return bot


@router.post("/{bot_id}/regenerate-key", response_model=schemas.BotOut)
async def regenerate_api_key(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = _get_user_bot(bot_id, current_user.id, db)
    bot.api_key = generate_api_key()
    bot.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(bot)
    await invalidate_bot_cache(bot_id)
    return bot


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = _get_user_bot(bot_id, current_user.id, db)
    db.delete(bot)
    db.commit()
    await invalidate_bot_cache(bot_id)


@router.get("/{bot_id}/stats", response_model=schemas.BotStats)
def bot_stats(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = _get_user_bot(bot_id, current_user.id, db)

    # Subquery for message count (N+1 fix)
    msg_count_subq = (
        db.query(
            models.Message.conversation_id,
            func.count(models.Message.id).label("msg_count")
        )
        .group_by(models.Message.conversation_id)
        .subquery()
    )

    rows = (
        db.query(models.Conversation, msg_count_subq.c.msg_count)
        .outerjoin(msg_count_subq, models.Conversation.id == msg_count_subq.c.conversation_id)
        .filter(models.Conversation.bot_id == bot_id)
        .order_by(models.Conversation.last_message_at.desc())
        .limit(10)
        .all()
    )

    platform_counts = (
        db.query(models.Conversation.platform, func.count(models.Conversation.id))
        .filter(models.Conversation.bot_id == bot_id)
        .group_by(models.Conversation.platform)
        .all()
    )
    by_platform = {str(p): c for p, c in platform_counts}

    convo_out = [
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

    return schemas.BotStats(
        bot_id=bot.id,
        bot_name=bot.name,
        total_messages=bot.total_messages,
        total_conversations=bot.total_conversations,
        messages_by_platform=by_platform,
        recent_conversations=convo_out,
    )


# ── Widget embed info ────────────────────────────────
@router.get("/{bot_id}/widget-code")
def get_widget_code(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get embeddable widget code for the bot (#7)."""
    bot = _get_user_bot(bot_id, current_user.id, db)
    from app.config import get_settings
    settings = get_settings()
    embed_code = f'<script src="{settings.BACKEND_URL}/widget/embed.js?bot_id={bot.id}"></script>'
    return {"embed_code": embed_code, "bot_id": bot.id, "bot_name": bot.bot_name}


def _get_user_bot(bot_id: str, user_id: str, db: Session) -> models.Bot:
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == user_id
    ).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot
