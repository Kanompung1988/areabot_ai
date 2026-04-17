"""Add catalog_items table for store/product management

Revision ID: 0006_catalog
Revises: 0005_appointments
Create Date: 2026-04-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0006_catalog"
down_revision: Union[str, None] = "0005_appointments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "catalog_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bot_id", sa.String(36), sa.ForeignKey("bots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False, server_default="service"),
        # service | package | promotion
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("image_url", sa.Text, nullable=True),
        # SKUs stored as JSON string: '[{"name": "S", "price": 1200}]'
        sa.Column("skus", sa.Text, nullable=True),
        # For promotions
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_catalog_items_bot_id", "catalog_items", ["bot_id"])
    op.create_index("ix_catalog_items_type", "catalog_items", ["type"])


def downgrade() -> None:
    op.drop_index("ix_catalog_items_type", "catalog_items")
    op.drop_index("ix_catalog_items_bot_id", "catalog_items")
    op.drop_table("catalog_items")
