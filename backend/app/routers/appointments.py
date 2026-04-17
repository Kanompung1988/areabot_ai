"""
Appointments Router — Calendar & scheduling for beauty clinics
Endpoints:
  GET    /api/appointments              — list (filter by bot_id, date range, status)
  POST   /api/appointments              — create
  GET    /api/appointments/stats        — summary stats (นัด/ยืนยัน/consult/กำลังนัด)
  GET    /api/appointments/{id}         — detail
  PUT    /api/appointments/{id}         — update (status, reschedule, etc.)
  DELETE /api/appointments/{id}         — cancel/delete
"""
from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import Appointment, Bot, User
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut, AppointmentStats
import uuid

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _get_bot_or_404(bot_id: str, db: Session, current_user: User) -> Bot:
    """Verify bot exists and belongs to current user."""
    bot = db.query(Bot).filter(Bot.id == bot_id, Bot.user_id == current_user.id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    return bot


def _get_appointment_or_404(appointment_id: str, db: Session, current_user: User) -> Appointment:
    """Verify appointment exists and belongs to current user's bot."""
    appt = (
        db.query(Appointment)
        .join(Bot, Appointment.bot_id == Bot.id)
        .filter(Appointment.id == appointment_id, Bot.user_id == current_user.id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


# ── List appointments ─────────────────────────────────
@router.get("", response_model=List[AppointmentOut])
def list_appointments(
    bot_id: str = Query(..., description="Bot ID"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_bot_or_404(bot_id, db, current_user)

    query = db.query(Appointment).filter(Appointment.bot_id == bot_id)

    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
    if status:
        query = query.filter(Appointment.status == status)

    return query.order_by(Appointment.appointment_date, Appointment.start_time).all()


# ── Stats ─────────────────────────────────────────────
@router.get("/stats", response_model=AppointmentStats)
def get_stats(
    bot_id: str = Query(...),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_bot_or_404(bot_id, db, current_user)

    query = db.query(Appointment).filter(Appointment.bot_id == bot_id)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    appointments = query.all()

    CONFIRMED_STATUSES = {"ยืนยัน", "ยืนยันแล้ว", "มาแล้ว"}
    CONSULT_STATUSES = {"จองแล้ว"}
    PENDING_STATUSES = {"รอยืนยัน"}
    CANCELLED_STATUSES = {"ยกเลิกนัด"}

    return AppointmentStats(
        total=len(appointments),
        confirmed=sum(1 for a in appointments if a.status in CONFIRMED_STATUSES),
        consult=sum(1 for a in appointments if a.status in CONSULT_STATUSES),
        pending=sum(1 for a in appointments if a.status in PENDING_STATUSES),
        cancelled=sum(1 for a in appointments if a.status in CANCELLED_STATUSES),
    )


# ── Create ────────────────────────────────────────────
@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_bot_or_404(data.bot_id, db, current_user)

    appt = Appointment(
        id=str(uuid.uuid4()),
        **data.model_dump(),
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


# ── Get detail ────────────────────────────────────────
@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_appointment_or_404(appointment_id, db, current_user)


# ── Update ────────────────────────────────────────────
@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = _get_appointment_or_404(appointment_id, db, current_user)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appt, field, value)

    db.commit()
    db.refresh(appt)
    return appt


# ── Delete ────────────────────────────────────────────
@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = _get_appointment_or_404(appointment_id, db, current_user)
    db.delete(appt)
    db.commit()
