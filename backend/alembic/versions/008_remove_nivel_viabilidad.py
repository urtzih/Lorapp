"""Remove nivel_viabilidad field

Revision ID: 008
Revises: 007

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove nivel_viabilidad column from lotes_semillas
    op.drop_column('lotes_semillas', 'nivel_viabilidad')


def downgrade() -> None:
    # Re-add nivel_viabilidad column
    op.add_column('lotes_semillas', sa.Column('nivel_viabilidad', sa.Float(), nullable=True))
