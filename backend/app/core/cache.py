import json
import hashlib
import logging
from typing import Any
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("clinic.cache")

_redis: aioredis.Redis | None = None
_redis_available: bool = True


async def get_redis() -> aioredis.Redis | None:
    global _redis, _redis_available
    if not _redis_available:
        return None
    if _redis is None:
        try:
            _redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await _redis.ping()
        except Exception as exc:
            logger.warning(f"Redis unavailable: {exc}")
            _redis_available = False
            return None
    return _redis


async def close_redis():
    global _redis
    if _redis:
        try:
            await _redis.aclose()
        except Exception:
            pass
        _redis = None


async def cache_get(key: str) -> Any | None:
    r = await get_redis()
    if r is None:
        return None
    try:
        value = await r.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.delete(key)
    except Exception:
        pass


async def cache_delete_prefix(prefix: str) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        batch: list[str] = []
        async for key in r.scan_iter(match=f"{prefix}*"):
            batch.append(key)
            if len(batch) >= 100:
                await r.delete(*batch)
                batch.clear()
        if batch:
            await r.delete(*batch)
    except Exception:
        pass


async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.set(f"blacklist:{jti}", "1", ex=ttl_seconds)
    except Exception:
        pass


async def is_token_blacklisted(jti: str) -> bool:
    r = await get_redis()
    if r is None:
        return False
    try:
        return await r.exists(f"blacklist:{jti}") > 0
    except Exception:
        return False


def _token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def blacklist_raw_token(token: str, ttl_seconds: int) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        await r.set(f"blacklist:raw:{_token_fingerprint(token)}", "1", ex=ttl_seconds)
    except Exception:
        pass


async def is_raw_token_blacklisted(token: str) -> bool:
    r = await get_redis()
    if r is None:
        return False
    try:
        return await r.exists(f"blacklist:raw:{_token_fingerprint(token)}") > 0
    except Exception:
        return False


class CacheKeys:
    ANALYTICS_DEMAND = "analytics:demand"
    ANALYTICS_DOCTORS = "analytics:doctors"
    SPECIALTIES = "doctors:specialties"

    @staticmethod
    def analytics_region(h3_index: str) -> str:
        return f"analytics:region:{h3_index}"


class RateLimitKeys:
    LOGIN = "ratelimit:login"
    REGISTER = "ratelimit:register"
    FORGOT_PASSWORD = "ratelimit:forgot-password"

    @staticmethod
    def login_ip(ip: str) -> str:
        return f"{RateLimitKeys.LOGIN}:{ip}"

    @staticmethod
    def register_ip(ip: str) -> str:
        return f"{RateLimitKeys.REGISTER}:{ip}"

    @staticmethod
    def forgot_password_ip(ip: str) -> str:
        return f"{RateLimitKeys.FORGOT_PASSWORD}:ip:{ip}"

    @staticmethod
    def forgot_password_email(email: str) -> str:
        normalized_email = email.strip().lower()
        return f"{RateLimitKeys.FORGOT_PASSWORD}:email:{normalized_email}"


async def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    r = await get_redis()
    if r is None:
        return True, max_requests
    try:
        current = await r.get(key)
        if current is None:
            await r.set(key, "1", ex=window_seconds)
            return True, max_requests - 1
        count = int(current)
        if count >= max_requests:
            return False, 0
        await r.incr(key)
        return True, max_requests - count - 1
    except Exception:
        return True, max_requests
