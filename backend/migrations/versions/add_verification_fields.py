"""add verification and reset fields to users

Revision ID: add_verification_fields
Revises: 
Create Date: 2026-04-20 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_verification_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

   
    if not inspector.has_table("users"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}

    if "is_verified" not in existing_columns:
        op.add_column(
            "users",
            sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        )
    if "verification_code" not in existing_columns:
        op.add_column("users", sa.Column("verification_code", sa.String(6), nullable=True))
    if "verification_code_expires" not in existing_columns:
        op.add_column(
            "users",
            sa.Column("verification_code_expires", sa.DateTime(timezone=True), nullable=True),
        )
    if "reset_token" not in existing_columns:
        op.add_column("users", sa.Column("reset_token", sa.String(255), nullable=True))
    if "reset_token_expires" not in existing_columns:
        op.add_column(
            "users",
            sa.Column("reset_token_expires", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'verification_code_expires')
    op.drop_column('users', 'verification_code')
    op.drop_column('users', 'is_verified')
