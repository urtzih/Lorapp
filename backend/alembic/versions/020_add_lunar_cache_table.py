"""add lunar cache table

Revision ID: 020_add_lunar_cache
Revises: 2f0e7c1e9d15
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '020_add_lunar_cache'
down_revision = '2f0e7c1e9d15'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lunar_data_cache',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('date', sa.Date(), nullable=False, unique=True, index=True),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('moon_phase', sa.String(50), nullable=False),
        sa.Column('moon_illumination', sa.Float(), nullable=False),
        sa.Column('moonrise', sa.String(10), nullable=True),
        sa.Column('moonset', sa.String(10), nullable=True),
        sa.Column('sunrise', sa.String(10), nullable=True),
        sa.Column('sunset', sa.String(10), nullable=True),
        sa.Column('raw_data', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Index for quick lookups by date and location
    op.create_index('idx_lunar_cache_date_location', 'lunar_data_cache', ['date', 'location'])


def downgrade():
    op.drop_index('idx_lunar_cache_date_location')
    op.drop_table('lunar_data_cache')
