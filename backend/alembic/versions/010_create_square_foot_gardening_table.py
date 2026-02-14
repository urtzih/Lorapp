"""create square_foot_gardening table

Revision ID: 010
Revises: 009
Create Date: 2026-02-14 11:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Crea la tabla square_foot_gardening para almacenar los 3 métodos de plantación SFG.
    Migra los datos existentes de square_foot_* en especies a la nueva tabla.
    """
    
    # Crear tabla square_foot_gardening
    op.create_table(
        'square_foot_gardening',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('especie_id', sa.Integer(), nullable=False),
        sa.Column('plantas_original', sa.Integer(), nullable=True, comment='Plantas por cuadrado - Método original SFG'),
        sa.Column('plantas_multisow', sa.Integer(), nullable=True, comment='Plantas por cuadrado - Siembra múltiple'),
        sa.Column('plantas_macizo', sa.Integer(), nullable=True, comment='Plantas por cuadrado - Siembra en macizo'),
        sa.Column('espaciado_cm', sa.Float(), nullable=True, comment='Espaciado entre plantas en cm'),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['especie_id'], ['especies.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('especie_id')
    )
    
    # Crear índice
    op.create_index('ix_square_foot_gardening_especie_id', 'square_foot_gardening', ['especie_id'])
    
    # Migrar datos existentes de especies.square_foot_plants a square_foot_gardening.plantas_original
    op.execute("""
        INSERT INTO square_foot_gardening (especie_id, plantas_original, espaciado_cm, notas, created_at, updated_at)
        SELECT 
            id as especie_id,
            square_foot_plants as plantas_original,
            square_foot_spacing as espaciado_cm,
            square_foot_notes as notas,
            now() as created_at,
            now() as updated_at
        FROM especies
        WHERE square_foot_plants IS NOT NULL
    """)
    
    # Eliminar columnas antiguas de especies (opcional - comentado por seguridad)
    # op.drop_column('especies', 'square_foot_notes')
    # op.drop_column('especies', 'square_foot_spacing')
    # op.drop_column('especies', 'square_foot_plants')
    
    # Eliminar columnas antiguas de variedades (opcional - comentado por seguridad)
    # op.drop_column('variedades', 'square_foot_notes')
    # op.drop_column('variedades', 'square_foot_spacing')
    # op.drop_column('variedades', 'square_foot_plants')


def downgrade() -> None:
    """
    Revierte la migración restaurando los campos en especies.
    """
    
    # Restaurar datos en especies
    op.execute("""
        UPDATE especies e
        SET 
            square_foot_plants = sfg.plantas_original,
            square_foot_spacing = sfg.espaciado_cm,
            square_foot_notes = sfg.notas
        FROM square_foot_gardening sfg
        WHERE e.id = sfg.especie_id
    """)
    
    # Eliminar tabla
    op.drop_index('ix_square_foot_gardening_especie_id')
    op.drop_table('square_foot_gardening')
