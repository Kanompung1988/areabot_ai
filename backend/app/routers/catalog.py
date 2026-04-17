"""
Catalog / Store Management API
Product catalog — services, packages, promotions per bot
"""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/catalog", tags=["Catalog"])


def _bot_owned(bot_id: str, user: models.User, db: Session) -> models.Bot:
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id,
        models.Bot.user_id == user.id,
    ).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


# ── List ───────────────────────────────────────────────
@router.get("/bots/{bot_id}/items", response_model=List[schemas.CatalogItemOut])
def list_items(
    bot_id: str,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _bot_owned(bot_id, current_user, db)
    q = db.query(models.CatalogItem).filter(models.CatalogItem.bot_id == bot_id)
    if type:
        q = q.filter(models.CatalogItem.type == type)
    if search:
        q = q.filter(models.CatalogItem.name.ilike(f"%{search}%"))
    return q.order_by(models.CatalogItem.created_at.desc()).all()


# ── Create ─────────────────────────────────────────────
@router.post("/bots/{bot_id}/items", response_model=schemas.CatalogItemOut)
def create_item(
    bot_id: str,
    data: schemas.CatalogItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _bot_owned(bot_id, current_user, db)
    skus_json = json.dumps(data.skus) if data.skus else None
    item = models.CatalogItem(
        bot_id=bot_id,
        type=data.type,
        name=data.name,
        description=data.description,
        price=data.price,
        image_url=data.image_url,
        skus=skus_json,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ── Get ────────────────────────────────────────────────
@router.get("/items/{item_id}", response_model=schemas.CatalogItemOut)
def get_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.CatalogItem).filter(models.CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _bot_owned(item.bot_id, current_user, db)
    return item


# ── Update ─────────────────────────────────────────────
@router.put("/items/{item_id}", response_model=schemas.CatalogItemOut)
def update_item(
    item_id: str,
    data: schemas.CatalogItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.CatalogItem).filter(models.CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _bot_owned(item.bot_id, current_user, db)

    update_data = data.model_dump(exclude_unset=True)
    if "skus" in update_data:
        update_data["skus"] = json.dumps(update_data["skus"]) if update_data["skus"] else None
    for k, v in update_data.items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


# ── Delete ─────────────────────────────────────────────
@router.delete("/items/{item_id}")
def delete_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = db.query(models.CatalogItem).filter(models.CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _bot_owned(item.bot_id, current_user, db)
    db.delete(item)
    db.commit()
    return {"ok": True}
