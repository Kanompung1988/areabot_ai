"""Convert knowledge_chunks.embedding to native pgvector + HNSW index

Revision ID: 0002_vector_embedding
Revises: 0001_initial
Create Date: 2026-03-02 01:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_vector_embedding"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure pgvector is enabled (idempotent)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Drop text placeholder if exists, add native vector(1536) column
    op.execute("ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding")
    op.execute(
        "ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536)"
    )

    # HNSW index for fast approximate nearest-neighbour search (cosine)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw
        ON knowledge_chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_knowledge_chunks_embedding_hnsw")
    op.execute("ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding")
    op.add_column(
        "knowledge_chunks",
        sa.Column("embedding", sa.Text(), nullable=True),
    )
