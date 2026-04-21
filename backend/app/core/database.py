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


async def init_db():
    """Create missing tables and patch known legacy schema gaps."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_legacy_schema(conn)
