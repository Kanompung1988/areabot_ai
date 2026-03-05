"""Add Instagram integration fields + INSTAGRAM to platform enum

Revision ID: 0004_instagram_integration
Revises: 0003_per_bot_openai_key
Create Date: 2026-03-03 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004_instagram_integration"
down_revision: Union[str, None] = "0003_per_bot_openai_key"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # เพิ่ม Instagram access token และ verify token
    op.add_column("bots", sa.Column("instagram_access_token", sa.Text(), nullable=True))
    op.add_column("bots", sa.Column("instagram_verify_token", sa.String(255), nullable=True))

    # เพิ่ม 'instagram' ใน platform enum
    op.execute("ALTER TYPE platformenum ADD VALUE IF NOT EXISTS 'instagram'")


def downgrade() -> None:
    op.drop_column("bots", "instagram_access_token")
    op.drop_column("bots", "instagram_verify_token")
    # หมายเหตุ: PostgreSQL ไม่รองรับการลบค่าออกจาก enum โดยตรง
    # ต้อง recreate enum ถ้าต้องการ rollback สมบูรณ์
