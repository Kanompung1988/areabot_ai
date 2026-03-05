"""
Conversation Export endpoints.
Export conversations to CSV or Excel.
"""
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/bots/{bot_id}/conversations/csv")
def export_conversations_csv(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    conversations = db.query(models.Conversation).filter(
        models.Conversation.bot_id == bot_id
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "conversation_id", "platform", "user_id", "user_name",
        "message_role", "message_content", "tokens_used", "model_used", "created_at"
    ])

    for convo in conversations:
        messages = db.query(models.Message).filter(
            models.Message.conversation_id == convo.id
        ).order_by(models.Message.created_at.asc()).all()
        for msg in messages:
            writer.writerow([
                convo.id, convo.platform.value, convo.external_user_id,
                convo.external_user_name or "", msg.role, msg.content,
                msg.tokens_used, msg.model_used or "", str(msg.created_at)
            ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=conversations_{bot_id[:8]}.csv"}
    )


@router.get("/bots/{bot_id}/conversations/excel")
def export_conversations_excel(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Conversations"
    ws.append([
        "Conversation ID", "Platform", "User ID", "User Name",
        "Role", "Content", "Tokens Used", "Model", "Created At"
    ])

    conversations = db.query(models.Conversation).filter(
        models.Conversation.bot_id == bot_id
    ).all()

    for convo in conversations:
        messages = db.query(models.Message).filter(
            models.Message.conversation_id == convo.id
        ).order_by(models.Message.created_at.asc()).all()
        for msg in messages:
            ws.append([
                convo.id, convo.platform.value, convo.external_user_id,
                convo.external_user_name or "", msg.role, msg.content,
                msg.tokens_used, msg.model_used or "", str(msg.created_at)
            ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=conversations_{bot_id[:8]}.xlsx"}
    )
