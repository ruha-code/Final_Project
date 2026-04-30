"""add extended health vitals

Revision ID: add_extended_health_vitals
Revises: add_verification_fields
Create Date: 2026-04-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "add_extended_health_vitals"
down_revision = "add_verification_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("health_vitals"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("health_vitals")}

    if "heart_rate" not in existing_columns:
        op.add_column("health_vitals", sa.Column("heart_rate", sa.Integer(), nullable=True))
    if "oxygen_saturation" not in existing_columns:
        op.add_column("health_vitals", sa.Column("oxygen_saturation", sa.Float(), nullable=True))
    if "respiratory_rate" not in existing_columns:
        op.add_column("health_vitals", sa.Column("respiratory_rate", sa.Integer(), nullable=True))
    if "pain_score" not in existing_columns:
        op.add_column("health_vitals", sa.Column("pain_score", sa.Integer(), nullable=True))
    if "notes" not in existing_columns:
        op.add_column("health_vitals", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("health_vitals", "notes")
    op.drop_column("health_vitals", "pain_score")
    op.drop_column("health_vitals", "respiratory_rate")
    op.drop_column("health_vitals", "oxygen_saturation")
    op.drop_column("health_vitals", "heart_rate")
