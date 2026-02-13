"""Add dias_hasta_trasplante to Variedad.

Revision ID: 004
Revises: 003
Create Date: 2026-02-13 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add dias_hasta_trasplante column to variedades table
    op.add_column('variedades', sa.Column('dias_hasta_trasplante', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove dias_hasta_trasplante column from variedades table
    op.drop_column('variedades', 'dias_hasta_trasplante')
