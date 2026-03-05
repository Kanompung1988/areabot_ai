#!/usr/bin/env bash
set -e

echo "🤖 AreaBot — Local Dev Setup"
echo "=============================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# ── 1. Start PostgreSQL + Redis via Docker ──────────────
echo "→ Starting PostgreSQL and Redis..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d postgres redis
echo "  Waiting for DB..."
sleep 5

# ── 2. Backend setup ────────────────────────────────────
echo "→ Setting up backend..."
cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ⚠  Created .env from .env.example — please add your API keys!"
fi

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

# ── 3. Frontend setup ────────────────────────────────────
echo "→ Setting up frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  npm install
fi

# ── 4. Launch services ───────────────────────────────────
echo ""
echo "✅ Starting services..."
echo "   Backend  → http://localhost:8000"
echo "   Frontend → http://localhost:3002"
echo "   API Docs → http://localhost:8000/docs"
echo ""

cd "$BACKEND_DIR"
source .venv/bin/activate
echo "→ Running database migrations..."
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose -f '$PROJECT_DIR/docker-compose.yml' stop postgres" EXIT

wait $BACKEND_PID $FRONTEND_PID
