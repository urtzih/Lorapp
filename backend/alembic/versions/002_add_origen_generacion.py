"""Add origen and generacion columns to lotes_semillas

Revision ID: 002_add_origen_generacion
Revises: 001_initial
Create Date: 2026-02-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_origen_generacion'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add origen and generacion columns to lotes_semillas table"""
    op.add_column(
        'lotes_semillas',
        sa.Column('origen', sa.String(255), nullable=True)
    )
    op.add_column(
        'lotes_semillas',
        sa.Column('generacion', sa.String(100), nullable=True)
    )
    
    # Create indexes for faster queries
    op.create_index(
        'ix_lotes_semillas_origen',
        'lotes_semillas',
        ['origen']
    )
    op.create_index(
        'ix_lotes_semillas_generacion',
        'lotes_semillas',
        ['generacion']
    )


def downgrade() -> None:
    """Remove origen and generacion columns from lotes_semillas table"""
    op.drop_index('ix_lotes_semillas_generacion', table_name='lotes_semillas')
    op.drop_index('ix_lotes_semillas_origen', table_name='lotes_semillas')
    op.drop_column('lotes_semillas', 'generacion')
    op.drop_column('lotes_semillas', 'origen')
