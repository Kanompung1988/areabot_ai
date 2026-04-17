#!/bin/sh
# Backend entrypoint — runs in production container
set -e

echo "→ Running database migrations..."

# If the DB has tables from a pre-Alembic create_all() run but no alembic_version,
# stamp migration 0001_initial as applied so only 0002+ will actually execute.
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
    conn.close()
    if has_users and not has_alembic:
        print("  Existing schema detected (no alembic_version). Will stamp 0001_initial.")
        sys.exit(1)
    sys.exit(0)
except Exception as e:
    print(f"  DB check skipped: {e}")
    sys.exit(0)
EOF
STAMP_NEEDED=$?
set -e

if [ "$STAMP_NEEDED" = "1" ]; then
    alembic stamp 0001_initial
fi

alembic upgrade head

echo "→ Starting AreaBot API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
