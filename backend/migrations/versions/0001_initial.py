"""Initial schema — all tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ───────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("is_admin", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("email_verified", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("email_verification_token", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── refresh_tokens ──────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("token", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_token", "refresh_tokens", ["token"], unique=True)

    # ── password_reset_tokens ───────────────────────
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("token", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"], unique=True)

    # ── bots ────────────────────────────────────────
    op.create_table(
        "bots",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("business_type", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("products_services", sa.Text(), nullable=True),
        sa.Column("pricing_info", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email_contact", sa.String(255), nullable=True),
        sa.Column("website", sa.String(500), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("facebook_url", sa.String(500), nullable=True),
        sa.Column("line_id", sa.String(255), nullable=True),
        sa.Column("instagram_url", sa.String(500), nullable=True),
        sa.Column("bot_name", sa.String(100), nullable=True, server_default="Assistant"),
        sa.Column("bot_personality", sa.String(500), nullable=True),
        sa.Column("response_language", sa.String(50), nullable=True, server_default="Thai"),
        sa.Column("greeting_message", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=True),
        sa.Column("api_key", sa.String(100), nullable=False),
        sa.Column("model_name", sa.String(100), nullable=True, server_default="gpt-4o"),
        sa.Column("line_channel_secret", sa.String(255), nullable=True),
        sa.Column("line_channel_access_token", sa.Text(), nullable=True),
        sa.Column("fb_page_token", sa.Text(), nullable=True),
        sa.Column("fb_verify_token", sa.String(255), nullable=True),
        sa.Column("fb_app_secret", sa.String(255), nullable=True),
        sa.Column("handoff_enabled", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("handoff_keywords", sa.Text(), nullable=True),
        sa.Column("total_messages", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("total_conversations", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bots_api_key", "bots", ["api_key"], unique=True)

    # ── subscriptions ───────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("plan", sa.String(50), nullable=True, server_default="free"),
        sa.Column("status", sa.String(50), nullable=True, server_default="active"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("message_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("message_limit", sa.Integer(), nullable=True, server_default="100"),
        sa.Column("current_period_end", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # ── conversations ───────────────────────────────
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("bot_id", sa.String(), nullable=False),
        sa.Column("platform", sa.Enum("line", "facebook", "api", name="platformenum"), nullable=False),
        sa.Column("external_user_id", sa.String(255), nullable=True),
        sa.Column("external_user_name", sa.String(255), nullable=True),
        sa.Column("is_handoff", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bot_id"], ["bots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── messages ─────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("conversation_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("message_type", sa.String(20), nullable=True, server_default="text"),
        sa.Column("rich_content", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── knowledge_documents ──────────────────────────
    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("bot_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("doc_type", sa.String(20), nullable=False),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("chunk_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("status", sa.String(20), nullable=True, server_default="processing"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bot_id"], ["bots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── knowledge_chunks ─────────────────────────────
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("document_id", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("embedding", sa.Text(), nullable=True),   # placeholder; converted by 0002
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["knowledge_documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── broadcast_campaigns ──────────────────────────
    op.create_table(
        "broadcast_campaigns",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("bot_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("platform", sa.String(20), nullable=True, server_default="all"),
        sa.Column("target_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("status", sa.String(20), nullable=True, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bot_id"], ["bots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("broadcast_campaigns")
    op.drop_table("knowledge_chunks")
    op.drop_table("knowledge_documents")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("subscriptions")
    op.drop_table("bots")
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS platformenum")
