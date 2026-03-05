"""
Broadcast / Push Message endpoints.
Send messages to all users of a bot on LINE/Facebook.
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import httpx

from app.database import get_db, SessionLocal
from app import models, schemas
from app.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/broadcast", tags=["Broadcast"])


async def _send_line_push(token: str, user_id: str, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.line.me/v2/bot/message/push",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"to": user_id, "messages": [{"type": "text", "text": text}]},
            timeout=10,
        )


async def _send_fb_message(page_token: str, recipient_id: str, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://graph.facebook.com/v18.0/me/messages?access_token={page_token}",
            json={"recipient": {"id": recipient_id}, "message": {"text": text}},
            timeout=10,
        )


async def _execute_broadcast(campaign_id: str):
    """Background task to send broadcast messages — creates its own DB session."""
    db: Session = SessionLocal()
    try:
        campaign = db.query(models.BroadcastCampaign).filter(
            models.BroadcastCampaign.id == campaign_id
        ).first()
        if not campaign:
            return

        bot = db.query(models.Bot).filter(models.Bot.id == campaign.bot_id).first()
        if not bot:
            return

        platform_filter = models.PlatformEnum(campaign.platform) if campaign.platform != "all" else None

        query = db.query(models.Conversation).filter(
            models.Conversation.bot_id == bot.id
        )
        if platform_filter:
            query = query.filter(models.Conversation.platform == platform_filter)

        conversations = query.all()

        sent = 0
        failed = 0
        for convo in conversations:
            try:
                if convo.platform == models.PlatformEnum.LINE and bot.line_channel_access_token:
                    await _send_line_push(bot.line_channel_access_token, convo.external_user_id, campaign.message)
                    sent += 1
                elif convo.platform == models.PlatformEnum.FACEBOOK and bot.fb_page_token:
                    await _send_fb_message(bot.fb_page_token, convo.external_user_id, campaign.message)
                    sent += 1
            except Exception as e:
                logger.error(f"Broadcast send failed for {convo.external_user_id}: {e}")
                failed += 1

        campaign.sent_count = sent
        campaign.failed_count = failed
        campaign.status = "completed"
        db.commit()
    except Exception as e:
        logger.error(f"Broadcast campaign {campaign_id} failed: {e}")
    finally:
        db.close()


@router.get("/bots/{bot_id}/campaigns", response_model=List[schemas.BroadcastCampaignOut])
def list_campaigns(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    campaigns = db.query(models.BroadcastCampaign).filter(
        models.BroadcastCampaign.bot_id == bot_id
    ).order_by(models.BroadcastCampaign.created_at.desc()).all()
    return campaigns


@router.post("/bots/{bot_id}/send")
async def send_broadcast(
    bot_id: str,
    body: schemas.BroadcastCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    target_count = db.query(models.Conversation).filter(
        models.Conversation.bot_id == bot_id
    ).count()

    campaign = models.BroadcastCampaign(
        bot_id=bot_id,
        name=body.name,
        message=body.message,
        platform=body.platform,
        target_count=target_count,
        status="sending",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    background_tasks.add_task(_execute_broadcast, campaign.id)

    return {"id": campaign.id, "status": "sending", "target_count": target_count}
