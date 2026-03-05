"""
Redis service for caching bot configs and rate limiting storage.
Falls back gracefully if Redis is unavailable.
"""
import json
import logging
from typing import Optional

import redis.asyncio as aioredis

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    global _redis_pool
    if _redis_pool is None:
        try:
            _redis_pool = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await _redis_pool.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable, running without cache: {e}")
            _redis_pool = None
    return _redis_pool


async def cache_get(key: str) -> Optional[str]:
    r = await get_redis()
    if not r:
        return None
    try:
        return await r.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, ttl: int = 300) -> bool:
    r = await get_redis()
    if not r:
        return False
    try:
        await r.set(key, value, ex=ttl)
        return True
    except Exception:
        return False


async def cache_delete(key: str) -> bool:
    r = await get_redis()
    if not r:
        return False
    try:
        await r.delete(key)
        return True
    except Exception:
        return False


async def cache_bot_config(bot_id: str, bot_data: dict, ttl: int = 300):
    """Cache bot configuration for fast webhook lookups."""
    await cache_set(f"bot:{bot_id}", json.dumps(bot_data), ttl)


async def get_cached_bot_config(bot_id: str) -> Optional[dict]:
    """Get cached bot config."""
    data = await cache_get(f"bot:{bot_id}")
    return json.loads(data) if data else None


async def invalidate_bot_cache(bot_id: str):
    """Invalidate bot cache when config changes."""
    await cache_delete(f"bot:{bot_id}")
