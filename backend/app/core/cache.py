import json
import hashlib
from typing import Any
import redis.asyncio as aioredis
from app.core.config import settings

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def cache_get(key: str) -> Any | None:
    r = await get_redis()
    value = await r.get(key)
    return json.loads(value) if value else None


async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    r = await get_redis()
    await r.set(key, json.dumps(value), ex=ttl_seconds)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


# JWT blacklist
async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    r = await get_redis()
    await r.set(f"blacklist:{jti}", "1", ex=ttl_seconds)


async def is_token_blacklisted(jti: str) -> bool:
    r = await get_redis()
    return await r.exists(f"blacklist:{jti}") > 0


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def blacklist_raw_token(token: str, ttl_seconds: int) -> None:
    r = await get_redis()
    await r.set(f"blacklist:raw:{_token_fingerprint(token)}", "1", ex=ttl_seconds)


async def is_raw_token_blacklisted(token: str) -> bool:
    r = await get_redis()
    return await r.exists(f"blacklist:raw:{_token_fingerprint(token)}") > 0


# Cache key constants — never hardcode strings in routers
class CacheKeys:
    ANALYTICS_DEMAND = "analytics:demand"
    ANALYTICS_DOCTORS = "analytics:doctors"
    SPECIALTIES = "doctors:specialties"

    @staticmethod
    def analytics_region(h3_index: str) -> str:
        return f"analytics:region:{h3_index}"


# Rate limiting helpers
class RateLimitKeys:
    LOGIN = "ratelimit:login"
    REGISTER = "ratelimit:register"

    @staticmethod
    def login_ip(ip: str) -> str:
        return f"{RateLimitKeys.LOGIN}:{ip}"

    @staticmethod
    def register_ip(ip: str) -> str:
        return f"{RateLimitKeys.REGISTER}:{ip}"


async def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    """
    Check if a request is within rate limits.
    Returns (allowed, remaining_requests).
    """
    try:
        r = await get_redis()
        current = await r.get(key)
        if current is None:
            await r.set(key, "1", ex=window_seconds)
            return True, max_requests - 1
        count = int(current)
        if count >= max_requests:
            ttl = await r.ttl(key)
            return False, 0
        await r.incr(key)
        return True, max_requests - count - 1
    except Exception:
        return True, max_requests