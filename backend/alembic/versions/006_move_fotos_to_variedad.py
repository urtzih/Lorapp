"""Move fotos field from LoteSemillas to Variedad

Revision ID: 006
Revises: 005

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add fotos column to variedades table
    op.add_column('variedades', sa.Column('fotos', postgresql.JSON(), nullable=False, server_default='[]'))
    
    # Remove fotos column from lotes_semillas table
    op.drop_column('lotes_semillas', 'fotos')


def downgrade() -> None:
    # Re-add fotos column to lotes_semillas table
    op.add_column('lotes_semillas', sa.Column('fotos', postgresql.JSON(), nullable=False, server_default='[]'))
    
    # Remove fotos column from variedades table
    op.drop_column('variedades', 'fotos')
