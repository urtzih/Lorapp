"""Add square foot gardening data

Revision ID: 009
Revises: 008
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    """
    Agrega campos para Square Foot Gardening:
    - square_foot_plants: Número de plantas por cuadrado de 30x30cm (1 pie cuadrado)
    - square_foot_spacing: Espaciado recomendado en cm
    - square_foot_notes: Notas adicionales para SFG (soporte, profundidad, etc.)
    """
    
    # Agregar campos a la tabla especies
    op.add_column('especies', 
        sa.Column('square_foot_plants', sa.Integer(), nullable=True, 
                  comment='Número de plantas por cuadrado de 30x30cm'))
    op.add_column('especies', 
        sa.Column('square_foot_spacing', sa.Float(), nullable=True,
                  comment='Espaciado entre plantas en cm para SFG'))
    op.add_column('especies',
        sa.Column('square_foot_notes', sa.Text(), nullable=True,
                  comment='Notas especiales para Square Foot Gardening'))
    
    # Agregar campos a la tabla variedades (pueden sobrescribir los de especie)
    op.add_column('variedades',
        sa.Column('square_foot_plants', sa.Integer(), nullable=True,
                  comment='Número de plantas por cuadrado de 30x30cm'))
    op.add_column('variedades',
        sa.Column('square_foot_spacing', sa.Float(), nullable=True,
                  comment='Espaciado entre plantas en cm para SFG'))
    op.add_column('variedades',
        sa.Column('square_foot_notes', sa.Text(), nullable=True,
                  comment='Notas especiales para Square Foot Gardening'))
    
    # Datos iniciales basados en Square Foot Gardening estándar
    # Estos se pueden ajustar según el PDF del usuario
    square_foot_data = [
        # (nombre_comun, plantas_por_cuadrado, espaciado_cm, notas)
        ('Tomate', 1, 30, 'Requiere tutor. Variedad determinada puede ir a 30cm, indeterminada necesita espacio completo.'),
        ('Pimiento', 1, 30, 'Una planta por cuadrado. Necesita tutor en variedades altas.'),
        ('Lechuga', 4, 15, '4-9 plantas dependiendo del tamaño. Lechugas pequeñas hasta 9 por cuadrado.'),
        ('Espinaca', 9, 10, '9 plantas por cuadrado. Espaciado regular.'),
        ('Acelga', 4, 15, '4 plantas por cuadrado. Hojas grandes necesitan más espacio.'),
        ('Zanahoria', 16, 7.5, '16 por cuadrado en patrón 4x4. Siembra directa.'),
        ('Rábano', 16, 7.5, '16 por cuadrado. Crecimiento rápido.'),
        ('Cebolla', 9, 10, '9-16 plantas por cuadrado dependiendo del tamaño deseado.'),
        ('Ajo', 9, 10, '9 dientes por cuadrado. Espaciado regular.'),
        ('Judía', 9, 10, '8-9 plantas por cuadrado. Necesitan soporte vertical.'),
        ('Guisante', 8, 10, '8 plantas por cuadrado en dos hileras. Necesitan enrejado.'),
        ('Calabacín', 1, 30, '1 planta por cuadrado. Mejor cultivar verticalmente en enrejado.'),
        ('Pepino', 2, 21, '2 plantas por cuadrado si se cultiva en enrejado, 1 si crece horizontal.'),
        ('Berenjena', 1, 30, '1 planta por cuadrado. Necesita tutor.'),
        ('Maíz', 4, 15, '4 plantas por cuadrado. Plantar en bloques para mejor polinización.'),
        ('Albahaca', 4, 15, '4 plantas por cuadrado.'),
        ('Perejil', 4, 15, '4 plantas por cuadrado.'),
        ('Cilantro', 9, 10, '9 plantas por cuadrado.'),
        ('Rúcula', 16, 7.5, '16 plantas por cuadrado.'),
        ('Brócoli', 1, 30, '1 planta por cuadrado.'),
        ('Coliflor', 1, 30, '1 planta por cuadrado.'),
        ('Col', 1, 30, '1 planta por cuadrado.'),
        ('Calabaza', 1, 30, '1 planta por 2-4 cuadrados. Requiere mucho espacio.'),
        ('Melón', 1, 30, '1 planta por 2 cuadrados. Mejor en enrejado.'),
        ('Fresa', 4, 15, '4 plantas por cuadrado.'),
    ]
    
    # Actualizar especies existentes con datos de Square Foot Gardening
    for nombre_comun, plantas, espaciado, notas in square_foot_data:
        op.execute(f"""
            UPDATE especies 
            SET square_foot_plants = {plantas},
                square_foot_spacing = {espaciado},
                square_foot_notes = '{notas}'
            WHERE nombre_comun = '{nombre_comun}'
        """)


def downgrade():
    """Revertir cambios"""
    op.drop_column('variedades', 'square_foot_notes')
    op.drop_column('variedades', 'square_foot_spacing')
    op.drop_column('variedades', 'square_foot_plants')
    op.drop_column('especies', 'square_foot_notes')
    op.drop_column('especies', 'square_foot_spacing')
    op.drop_column('especies', 'square_foot_plants')
