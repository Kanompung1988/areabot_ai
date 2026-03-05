"""Add per-bot openai_api_key to bots table

Revision ID: 0003_per_bot_openai_key
Revises: 0002_vector_embedding
Create Date: 2026-03-03 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003_per_bot_openai_key"
down_revision: Union[str, None] = "0002_vector_embedding"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # เพิ่ม openai_api_key — nullable เพื่อ fallback ไปใช้ global key ใน .env
    op.add_column(
        "bots",
        sa.Column("openai_api_key", sa.String(255), nullable=True),
    )

    # เปลี่ยน default model เป็น gpt-4.1-mini สำหรับ bot ใหม่
    op.execute(
        "ALTER TABLE bots ALTER COLUMN model_name SET DEFAULT 'gpt-4.1-mini'"
    )


def downgrade() -> None:
    op.drop_column("bots", "openai_api_key")
    op.execute(
        "ALTER TABLE bots ALTER COLUMN model_name SET DEFAULT 'gpt-4o'"
    )
