#!/bin/sh
# Backend entrypoint — runs in production container
set -e

echo "→ Checking database state..."

set +e
python - <<'EOF'
import os, sys
try:
    import psycopg2
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='alembic_version')")
    has_alembic = cur.fetchone()[0]
    cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users')")
    has_users = cur.fetchone()[0]
    cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='knowledge_chunks')")
    has_knowledge_chunks = cur.fetchone()[0]
    conn.close()
    if not has_users and not has_alembic:
        sys.exit(2)   # fresh DB → use create_all
    if has_users and not has_alembic and not has_knowledge_chunks:
        sys.exit(2)   # partial schema (crashed 0001) → recreate via create_all
    if has_users and not has_alembic:
        sys.exit(1)   # existing full schema, no alembic → stamp 0001
    sys.exit(0)        # alembic already tracking → run upgrade head
except Exception as e:
    print(f"  DB check skipped: {e}")
    sys.exit(0)
EOF
DB_STATE=$?
set -e

if [ "$DB_STATE" = "2" ]; then
    echo "→ Fresh database detected. Creating tables directly..."
    python - <<'EOF'
import sys
sys.path.insert(0, '/app')
from app.database import engine, Base
from app.models import *  # noqa: F403 — loads all models
Base.metadata.create_all(bind=engine)
print("  All tables created.")
EOF
    echo "→ Stamping alembic at HEAD..."
    alembic stamp head
elif [ "$DB_STATE" = "1" ]; then
    echo "→ Existing schema (no alembic). Stamping 0001_initial..."
    alembic stamp 0001_initial
fi

echo "→ Running remaining migrations..."
alembic upgrade head

echo "→ Ensuring all schema columns exist (safe ADD COLUMN IF NOT EXISTS)..."
python - <<'EOF'
import os, sys
sys.path.insert(0, '/app')
try:
    import psycopg2
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    # messages table — rich message columns added in #6
    cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'")
    cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS rich_content JSONB")
    # conversations table — external_user_name for display
    cur.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS external_user_name VARCHAR(255)")
    conn.commit()
    conn.close()
    print("  Schema columns verified.")
except Exception as e:
    print(f"  Schema patch skipped: {e}")
EOF

echo "→ Starting AreaBot API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 2
