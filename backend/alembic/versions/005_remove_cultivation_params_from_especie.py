"""Remove cultivation parameters from Especie table.

Revision ID: 005
Revises: 004
Create Date: 2026-02-13 20:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove cultivation parameters from especies table
    # (These are now only in variedades table)
    
    # Parámetros agrícolas estándar
    op.drop_column('especies', 'profundidad_siembra_cm')
    op.drop_column('especies', 'distancia_plantas_cm')
    op.drop_column('especies', 'distancia_surcos_cm')
    op.drop_column('especies', 'frecuencia_riego')
    op.drop_column('especies', 'exposicion_solar')
    
    # Ciclo de cultivo
    op.drop_column('especies', 'dias_germinacion_min')
    op.drop_column('especies', 'dias_germinacion_max')
    op.drop_column('especies', 'dias_hasta_trasplante')
    op.drop_column('especies', 'dias_hasta_cosecha_min')
    op.drop_column('especies', 'dias_hasta_cosecha_max')
    
    # Calendario de siembra
    op.drop_column('especies', 'meses_siembra_interior')
    op.drop_column('especies', 'meses_siembra_exterior')
    
    # Condiciones de crecimiento
    op.drop_column('especies', 'temperatura_minima_c')
    op.drop_column('especies', 'temperatura_maxima_c')
    op.drop_column('especies', 'zonas_climaticas_preferidas')
    
    # Add corresponding columns to variedades if not exist
    # (Some already exist, so we use try/except pattern or check before adding)
    # To avoid errors, we'll add only the missing ones
    
    # Add frecuencia_riego to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='frecuencia_riego') THEN
                ALTER TABLE variedades ADD COLUMN frecuencia_riego VARCHAR(20);
            END IF;
        END $$;
    """)
    
    # Add exposicion_solar to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='exposicion_solar') THEN
                ALTER TABLE variedades ADD COLUMN exposicion_solar VARCHAR(20);
            END IF;
        END $$;
    """)
    
    # Add meses_siembra_interior to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='meses_siembra_interior') THEN
                ALTER TABLE variedades ADD COLUMN meses_siembra_interior JSON DEFAULT '[]';
            END IF;
        END $$;
    """)
    
    # Add meses_siembra_exterior to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='meses_siembra_exterior') THEN
                ALTER TABLE variedades ADD COLUMN meses_siembra_exterior JSON DEFAULT '[]';
            END IF;
        END $$;
    """)
    
    # Add temperatura_minima_c to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='temperatura_minima_c') THEN
                ALTER TABLE variedades ADD COLUMN temperatura_minima_c FLOAT;
            END IF;
        END $$;
    """)
    
    # Add temperatura_maxima_c to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='temperatura_maxima_c') THEN
                ALTER TABLE variedades ADD COLUMN temperatura_maxima_c FLOAT;
            END IF;
        END $$;
    """)
    
    # Add zonas_climaticas_preferidas to variedades
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='variedades' AND column_name='zonas_climaticas_preferidas') THEN
                ALTER TABLE variedades ADD COLUMN zonas_climaticas_preferidas JSON DEFAULT '[]';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Restore columns to especies table
    op.add_column('especies', sa.Column('profundidad_siembra_cm', sa.Float(), nullable=True))
    op.add_column('especies', sa.Column('distancia_plantas_cm', sa.Float(), nullable=True))
    op.add_column('especies', sa.Column('distancia_surcos_cm', sa.Float(), nullable=True))
    op.add_column('especies', sa.Column('frecuencia_riego', sa.String(20), nullable=True))
    op.add_column('especies', sa.Column('exposicion_solar', sa.String(20), nullable=True))
    op.add_column('especies', sa.Column('dias_germinacion_min', sa.Integer(), nullable=True))
    op.add_column('especies', sa.Column('dias_germinacion_max', sa.Integer(), nullable=True))
    op.add_column('especies', sa.Column('dias_hasta_trasplante', sa.Integer(), nullable=True))
    op.add_column('especies', sa.Column('dias_hasta_cosecha_min', sa.Integer(), nullable=True))
    op.add_column('especies', sa.Column('dias_hasta_cosecha_max', sa.Integer(), nullable=True))
    op.add_column('especies', sa.Column('meses_siembra_interior', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('especies', sa.Column('meses_siembra_exterior', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('especies', sa.Column('temperatura_minima_c', sa.Float(), nullable=True))
    op.add_column('especies', sa.Column('temperatura_maxima_c', sa.Float(), nullable=True))
    op.add_column('especies', sa.Column('zonas_climaticas_preferidas', postgresql.JSON(astext_type=sa.Text()), nullable=True))
