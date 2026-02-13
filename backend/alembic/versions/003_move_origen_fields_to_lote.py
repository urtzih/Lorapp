"""Move tipo_origen and anno_recoleccion from Variedad to LoteSemillas.

Revision ID: 003
Revises: 002_add_origen_generacion
Create Date: 2026-02-13 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '003'
down_revision = '002_add_origen_generacion'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to lotes_semillas
    op.add_column('lotes_semillas', sa.Column('tipo_origen', sa.String(50), nullable=True))
    op.add_column('lotes_semillas', sa.Column('anno_recoleccion', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove columns from lotes_semillas
    op.drop_column('lotes_semillas', 'anno_recoleccion')
    op.drop_column('lotes_semillas', 'tipo_origen')
