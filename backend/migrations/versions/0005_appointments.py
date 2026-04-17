"""Add appointments table for calendar/scheduling feature

Revision ID: 0005_appointments
Revises: 0004_instagram_integration
Create Date: 2026-04-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005_appointments"
down_revision: Union[str, None] = "0004_instagram_integration"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("customer_phone", sa.String(50), nullable=True),
        sa.Column("doctor_name", sa.String(255), nullable=True),
        sa.Column("service_type", sa.String(50), nullable=False),
        sa.Column("treatment", sa.String(255), nullable=True),
        sa.Column("appointment_date", sa.Date, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="รอยืนยัน"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_appointments_bot_id", "appointments", ["bot_id"])
    op.create_index("ix_appointments_date", "appointments", ["appointment_date"])
    op.create_index("ix_appointments_status", "appointments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_appointments_status", "appointments")
    op.drop_index("ix_appointments_date", "appointments")
    op.drop_index("ix_appointments_bot_id", "appointments")
    op.drop_table("appointments")
