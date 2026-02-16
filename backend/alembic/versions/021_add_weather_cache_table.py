"""add weather cache table

Revision ID: 021_add_weather_cache
Revises: 020_add_lunar_cache
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '021_add_weather_cache'
down_revision = '020_add_lunar_cache'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'weather_data_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False, index=True),
        sa.Column('location', sa.String(500), nullable=False, index=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('temp_max', sa.Float(), nullable=True),
        sa.Column('temp_min', sa.Float(), nullable=True),
        sa.Column('temp_avg', sa.Float(), nullable=True),
        sa.Column('condition', sa.String(255), nullable=True),
        sa.Column('humidity', sa.Integer(), nullable=True),
        sa.Column('precipitation_mm', sa.Float(), nullable=True),
        sa.Column('chance_of_rain', sa.Integer(), nullable=True),
        sa.Column('wind_kph', sa.Float(), nullable=True),
        sa.Column('uv_index', sa.Float(), nullable=True),
        sa.Column('raw_data', JSONB(), nullable=True),
        sa.Column('cached_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date', 'location', name='uq_weather_date_location')
    )
    
    # Composite index for fast lookups
    op.create_index('ix_weather_date_location', 'weather_data_cache', ['date', 'location'])


def downgrade():
    op.drop_index('ix_weather_date_location', table_name='weather_data_cache')
    op.drop_table('weather_data_cache')
