"""Replace fecha_vencimiento with anos_viabilidad_semilla and nivel_viabilidad

Revision ID: 007
Revises: 006

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove fecha_vencimiento column from lotes_semillas
    op.drop_column('lotes_semillas', 'fecha_vencimiento')
    
    # Add new columns to lotes_semillas
    op.add_column('lotes_semillas', sa.Column('anos_viabilidad_semilla', sa.Integer(), nullable=True))
    op.add_column('lotes_semillas', sa.Column('nivel_viabilidad', sa.Float(), nullable=True))


def downgrade() -> None:
    # Remove the new columns
    op.drop_column('lotes_semillas', 'nivel_viabilidad')
    op.drop_column('lotes_semillas', 'anos_viabilidad_semilla')
    
    # Re-add fecha_vencimiento column
    op.add_column('lotes_semillas', sa.Column('fecha_vencimiento', sa.DateTime(), nullable=True))
