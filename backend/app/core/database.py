from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
from app.core.config import settings
import os


class Base(DeclarativeBase):
    pass


pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "2"))
pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "1800"))

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=pool_timeout,
    pool_recycle=pool_recycle,
    pool_pre_ping=True,
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def _column_exists(table_name: str, column_name: str, conn) -> bool:
    result = await conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = :table_name AND column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    )
    return result.scalar() is not None


async def _ensure_legacy_schema(conn) -> None:
    if not await _column_exists("conversations", "updated_at", conn):
        await conn.execute(
            text(
                """
                ALTER TABLE conversations
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                """
            )
        )
        await conn.execute(
            text(
                """
                UPDATE conversations
                SET updated_at = created_at
                WHERE updated_at IS NULL
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE conversations
                ALTER COLUMN updated_at SET NOT NULL
                """
            )
        )

    if not await _column_exists("users", "is_verified", conn):
        await conn.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN is_verified BOOLEAN DEFAULT false NOT NULL,
                ADD COLUMN verification_code VARCHAR(6),
                ADD COLUMN verification_code_expires TIMESTAMPTZ,
                ADD COLUMN reset_token VARCHAR(255),
                ADD COLUMN reset_token_expires TIMESTAMPTZ
                """
            )
        )
        await conn.execute(
            text("UPDATE users SET is_verified = true WHERE is_verified IS NULL")
        )

    if not await _column_exists("audit_logs", "actor_name", conn):
        await conn.execute(
            text(
                """
                ALTER TABLE audit_logs
                ADD COLUMN actor_name VARCHAR(100)
                """
            )
        )

    if not await _column_exists("audit_logs", "actor_username", conn):
        await conn.execute(
            text(
                """
                ALTER TABLE audit_logs
                ADD COLUMN actor_username VARCHAR(50)
                """
            )
        )

    if not await _column_exists("audit_logs", "actor_role", conn):
        await conn.execute(
            text(
                """
                ALTER TABLE audit_logs
                ADD COLUMN actor_role VARCHAR(20)
                """
            )
        )

    await conn.execute(
        text(
            """
            UPDATE audit_logs AS audit
            SET actor_name = COALESCE(audit.actor_name, users.full_name),
                actor_username = COALESCE(audit.actor_username, users.username),
                actor_role = COALESCE(audit.actor_role, users.role::text)
            FROM users
            WHERE audit.user_id = users.id
              AND (
                audit.actor_name IS NULL
                OR audit.actor_username IS NULL
                OR audit.actor_role IS NULL
              )
            """
        )
    )


async def init_db():
    """Create missing tables and patch known legacy schema gaps.

    Multiple API workers can start concurrently, so serialize schema
    initialization to avoid races while PostgreSQL enum types are created.
    """
    async with engine.begin() as conn:
        await conn.execute(text("SELECT pg_advisory_xact_lock(2147483001)"))
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_legacy_schema(conn)
