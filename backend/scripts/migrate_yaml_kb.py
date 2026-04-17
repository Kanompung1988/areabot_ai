#!/usr/bin/env python3
"""
migrate_yaml_kb.py — One-time migration script
Imports YAML knowledge base files from Tobtan-Clinic-AI into TobTan-PipeLine's
PostgreSQL + pgvector database as KnowledgeDocuments.

Usage:
  cd /Users/king_phuripol/AI-Engineer/04_Work/Current/TobTan/TobTan-PipeLine/backend
  python scripts/migrate_yaml_kb.py

Prerequisites:
  - TobTan-PipeLine backend .env configured with DATABASE_URL + OPENAI_API_KEY
  - PostgreSQL running (via docker-compose or locally)
  - A Bot already created in TobTan-PipeLine (get its ID from dashboard or DB)
  - YAML source dir accessible (default: ../Tobtan-Clinic-AI/backend/knowledge_base)

Environment variables (optional overrides):
  BOT_ID          — Target bot ID(s), comma-separated (default: all bots)
  YAML_KB_DIR     — Path to knowledge_base directory
  BRANCH_BOT_MAP  — JSON mapping {"branch_main": "bot-uuid-1", ...}
"""
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# ── Ensure backend package is importable ─────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import yaml
from app.config import get_settings
from app.database import SessionLocal
from app import models
from app.services.rag_service import extract_text_from_yaml, process_document

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()

# ── Default paths ─────────────────────────────────────────────────────────────
# knowledge_base now lives inside TobTan-PipeLine/backend — fully self-contained
DEFAULT_YAML_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"

# YAML doc_type → human label
YAML_LABELS = {
    "services":    "บริการ",
    "pricing":     "ราคา",
    "faq":         "คำถามที่พบบ่อย",
    "promotions":  "โปรโมชั่น",
}


async def migrate_branch(bot_id: str, branch_dir: Path, db):
    """Load all YAML files from a branch directory and insert as KnowledgeDocuments."""
    if not branch_dir.exists():
        logger.warning(f"Branch dir not found: {branch_dir}")
        return

    yaml_files = sorted(branch_dir.glob("*.yaml")) + sorted(branch_dir.glob("*.yml"))
    if not yaml_files:
        logger.warning(f"No YAML files in {branch_dir}")
        return

    for yaml_file in yaml_files:
        doc_type_key = yaml_file.stem  # e.g. "pricing"
        label = YAML_LABELS.get(doc_type_key, doc_type_key)
        title = f"[{branch_dir.name}] {label}"

        # Check if already migrated
        existing = db.query(models.KnowledgeDocument).filter(
            models.KnowledgeDocument.bot_id == bot_id,
            models.KnowledgeDocument.title == title,
        ).first()
        if existing:
            logger.info(f"  SKIP (already exists): {title}")
            continue

        file_bytes = yaml_file.read_bytes()
        content = extract_text_from_yaml(file_bytes)
        if not content.strip():
            logger.warning(f"  EMPTY content from {yaml_file.name}, skipping")
            continue

        doc = models.KnowledgeDocument(
            bot_id=bot_id,
            title=title,
            doc_type="faq",
            content=content,
            status="processing",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        logger.info(f"  Ingesting: {title} ({len(content)} chars) ...")
        await process_document(doc.id, content, db)
        logger.info(f"  Done: {title} — {doc.chunk_count} chunks")


async def main():
    yaml_dir = Path(os.environ.get("YAML_KB_DIR", str(DEFAULT_YAML_DIR)))

    if not yaml_dir.exists():
        logger.error(f"YAML KB directory not found: {yaml_dir}")
        logger.error("Set YAML_KB_DIR env var to the correct path")
        sys.exit(1)

    branches = [d for d in yaml_dir.iterdir() if d.is_dir()]
    if not branches:
        logger.error(f"No branch subdirectories found in {yaml_dir}")
        sys.exit(1)

    # ── Resolve bot mapping ────────────────────────────────────────────────────
    # BRANCH_BOT_MAP env: '{"branch_main": "uuid-1", "branch_2": "uuid-2", ...}'
    branch_bot_map: dict[str, str] = {}
    if os.environ.get("BRANCH_BOT_MAP"):
        branch_bot_map = json.loads(os.environ["BRANCH_BOT_MAP"])

    db = SessionLocal()
    try:
        available_bots = db.query(models.Bot).filter(models.Bot.is_active == True).all()
        if not available_bots:
            logger.error("No active bots found in database. Create a bot first via the dashboard.")
            sys.exit(1)

        if branch_bot_map:
            # Validate provided mapping
            for branch, bot_id in branch_bot_map.items():
                bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
                if not bot:
                    logger.error(f"Bot ID '{bot_id}' for branch '{branch}' not found")
                    sys.exit(1)
        else:
            # If only one bot, use it for all branches
            if len(available_bots) == 1:
                logger.info(f"Single bot found: {available_bots[0].name} ({available_bots[0].id})")
                logger.info("All branches will be imported into this bot.")
                for branch in branches:
                    branch_bot_map[branch.name] = available_bots[0].id
            else:
                logger.info("Multiple bots found:")
                for i, bot in enumerate(available_bots):
                    logger.info(f"  [{i}] {bot.name} — {bot.id}")
                logger.info("")
                logger.info("Set BRANCH_BOT_MAP env var to specify which bot gets which branch:")
                example = {b.name: "<bot-uuid>" for b in branches[:3]}
                logger.info(f"  export BRANCH_BOT_MAP='{json.dumps(example)}'")
                sys.exit(1)

        # ── Run migration ──────────────────────────────────────────────────────
        total_branches = len([b for b in branches if b.name in branch_bot_map])
        if total_branches == 0:
            logger.error("No branch→bot mappings resolved. Check BRANCH_BOT_MAP.")
            sys.exit(1)

        logger.info(f"\nMigrating {total_branches} branch(es) from {yaml_dir}\n")
        for branch_dir in sorted(branches):
            if branch_dir.name not in branch_bot_map:
                logger.info(f"Skipping branch '{branch_dir.name}' (not in mapping)")
                continue

            bot_id = branch_bot_map[branch_dir.name]
            bot = db.query(models.Bot).filter(models.Bot.id == bot_id).first()
            logger.info(f"Branch: {branch_dir.name} → Bot: {bot.name} ({bot_id})")
            await migrate_branch(bot_id, branch_dir, db)

        logger.info("\nMigration complete!")

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
