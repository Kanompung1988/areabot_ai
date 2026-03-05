"""
Knowledge Base / RAG endpoints.
Upload documents, crawl URLs, manage knowledge for bots.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.rag_service import (
    process_document, extract_text_from_pdf, extract_text_from_docx, crawl_url
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])


@router.get("/bots/{bot_id}/documents", response_model=List[schemas.KnowledgeDocumentOut])
def list_documents(
    bot_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    docs = db.query(models.KnowledgeDocument).filter(
        models.KnowledgeDocument.bot_id == bot_id
    ).order_by(models.KnowledgeDocument.created_at.desc()).all()
    return docs


@router.post("/bots/{bot_id}/upload")
async def upload_document(
    bot_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    file_bytes = await file.read()
    filename = file.filename or "unknown"

    if filename.endswith(".pdf"):
        content = extract_text_from_pdf(file_bytes)
        doc_type = "pdf"
    elif filename.endswith(".docx"):
        content = extract_text_from_docx(file_bytes)
        doc_type = "docx"
    elif filename.endswith(".txt"):
        content = file_bytes.decode("utf-8", errors="ignore")
        doc_type = "txt"
    else:
        raise HTTPException(400, "Supported formats: PDF, DOCX, TXT")

    if not content.strip():
        raise HTTPException(400, "No text content extracted from file")

    doc = models.KnowledgeDocument(
        bot_id=bot_id,
        title=filename,
        doc_type=doc_type,
        content=content,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(process_document, doc.id, content, db)

    return {"id": doc.id, "title": doc.title, "status": "processing", "message": "Document uploaded and being processed"}


@router.post("/bots/{bot_id}/crawl")
async def crawl_url_endpoint(
    bot_id: str,
    body: schemas.CrawlURLRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    try:
        content = await crawl_url(body.url)
    except Exception as e:
        raise HTTPException(400, f"Failed to crawl URL: {str(e)}")

    if not content.strip():
        raise HTTPException(400, "No text content found at URL")

    doc = models.KnowledgeDocument(
        bot_id=bot_id,
        title=body.url,
        doc_type="url",
        source_url=body.url,
        content=content,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(process_document, doc.id, content, db)

    return {"id": doc.id, "title": doc.title, "status": "processing"}


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(models.KnowledgeDocument).filter(
        models.KnowledgeDocument.id == doc_id
    ).first()
    if not doc:
        raise HTTPException(404, "Document not found")

    bot = db.query(models.Bot).filter(
        models.Bot.id == doc.bot_id, models.Bot.user_id == current_user.id
    ).first()
    if not bot:
        raise HTTPException(403, "Access denied")

    db.delete(doc)
    db.commit()
