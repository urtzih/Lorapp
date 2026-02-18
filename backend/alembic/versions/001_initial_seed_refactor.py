"""Refactorizar modelo de semillas a 8 tablas normalizadas

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-12 14:00:00.000000

"""
from alembic import op  # type: ignore
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Apply database changes:
    - Create new tables for refactored seed bank system
    - Add ENUMs for state management
    """
    
    # Create ENUMs with IF NOT EXISTS using raw SQL
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE estadolotesemillas AS ENUM ('activo', 'agotado', 'vencido', 'descartado');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE tipoexposicionsolar AS ENUM ('total', 'parcial', 'sombra');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE frecuenciariego AS ENUM ('diario', 'cada_dos_dias', 'semanal', 'cada_dos_semanas', 'mensual');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE estadoplantacion AS ENUM ('PLANIFICADA', 'SEMBRADA', 'GERMINADA', 'TRASPLANTADA', 'CRECIMIENTO', 'COSECHA_CERCANA', 'COSECHADA', 'CANCELADA');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE tipocosecha AS ENUM ('consumo', 'semilla', 'mixta');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create especies table - use sa.Enum with sqlite_enum_type for type specifications
    op.create_table('especies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre_comun', sa.String(length=255), nullable=False),
        sa.Column('nombre_cientifico', sa.String(length=255), nullable=True),
        sa.Column('familia_botanica', sa.String(length=100), nullable=True),
        sa.Column('genero', sa.String(length=100), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('tipo_cultivo', sa.String(length=50), nullable=True),
        sa.Column('profundidad_siembra_cm', sa.Float(), nullable=True),
        sa.Column('distancia_plantas_cm', sa.Float(), nullable=True),
        sa.Column('distancia_surcos_cm', sa.Float(), nullable=True),
        sa.Column('frecuencia_riego', sa.Text(), nullable=True),  # Use Text for now
        sa.Column('exposicion_solar', sa.Text(), nullable=True),  # Use Text for now
        sa.Column('dias_germinacion_min', sa.Integer(), nullable=True),
        sa.Column('dias_germinacion_max', sa.Integer(), nullable=True),
        sa.Column('dias_hasta_trasplante', sa.Integer(), nullable=True),
        sa.Column('dias_hasta_cosecha_min', sa.Integer(), nullable=True),
        sa.Column('dias_hasta_cosecha_max', sa.Integer(), nullable=True),
        sa.Column('meses_siembra_interior', sa.JSON(), nullable=True),
        sa.Column('meses_siembra_exterior', sa.JSON(), nullable=True),
        sa.Column('temperatura_minima_c', sa.Float(), nullable=True),
        sa.Column('temperatura_maxima_c', sa.Float(), nullable=True),
        sa.Column('zonas_climaticas_preferidas', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_especies_id'), 'especies', ['id'], unique=False)
    op.create_index(op.f('ix_especies_nombre_comun'), 'especies', ['nombre_comun'], unique=False)
    
    # Create variedades table
    op.create_table('variedades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('especie_id', sa.Integer(), nullable=False),
        sa.Column('nombre_variedad', sa.String(length=255), nullable=False),
        sa.Column('codigo_interno', sa.String(length=100), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('color_fruto', sa.String(length=100), nullable=True),
        sa.Column('sabor', sa.String(length=255), nullable=True),
        sa.Column('tamanio_planta', sa.String(length=50), nullable=True),
        sa.Column('profundidad_siembra_cm', sa.Float(), nullable=True),
        sa.Column('distancia_plantas_cm', sa.Float(), nullable=True),
        sa.Column('distancia_surcos_cm', sa.Float(), nullable=True),
        sa.Column('dias_germinacion_min', sa.Integer(), nullable=True),
        sa.Column('dias_germinacion_max', sa.Integer(), nullable=True),
        sa.Column('dias_hasta_cosecha_min', sa.Integer(), nullable=True),
        sa.Column('dias_hasta_cosecha_max', sa.Integer(), nullable=True),
        sa.Column('resistencias', sa.JSON(), nullable=True),
        sa.Column('es_hija_f1', sa.Boolean(), nullable=True),
        sa.Column('es_variedad_antigua', sa.Boolean(), nullable=True),
        sa.Column('tipo_origen', sa.String(length=50), nullable=True),
        sa.Column('procedencia', sa.String(length=255), nullable=True),
        sa.Column('anno_recoleccion', sa.Integer(), nullable=True),
        sa.Column('generacion', sa.String(length=50), nullable=True),
        sa.Column('tipo_polinizacion', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['especie_id'], ['especies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo_interno')
    )
    op.create_index(op.f('ix_variedades_especie_id'), 'variedades', ['especie_id'], unique=False)
    op.create_index(op.f('ix_variedades_id'), 'variedades', ['id'], unique=False)
    op.create_index(op.f('ix_variedades_nombre_variedad'), 'variedades', ['nombre_variedad'], unique=False)
    
    # Create lotes_semillas table
    op.create_table('lotes_semillas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('variedad_id', sa.Integer(), nullable=False),
        sa.Column('nombre_comercial', sa.String(length=500), nullable=False),
        sa.Column('marca', sa.String(length=255), nullable=True),
        sa.Column('numero_lote', sa.String(length=100), nullable=True),
        sa.Column('cantidad_estimada', sa.Integer(), nullable=True),
        sa.Column('anno_produccion', sa.Integer(), nullable=True),
        sa.Column('fecha_vencimiento', sa.DateTime(), nullable=True),
        sa.Column('fecha_adquisicion', sa.DateTime(), nullable=True),
        sa.Column('lugar_almacenamiento', sa.String(length=255), nullable=True),
        sa.Column('temperatura_almacenamiento_c', sa.Float(), nullable=True),
        sa.Column('humedad_relativa', sa.Float(), nullable=True),
        sa.Column('estado', estado_lote_enum, nullable=True),
        sa.Column('cantidad_restante', sa.Integer(), nullable=True),
        sa.Column('fotos', sa.JSON(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('informacion_proveedor', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['variedad_id'], ['variedades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lotes_semillas_id'), 'lotes_semillas', ['id'], unique=False)
    op.create_index(op.f('ix_lotes_semillas_numero_lote'), 'lotes_semillas', ['numero_lote'], unique=False)
    op.create_index(op.f('ix_lotes_semillas_usuario_id'), 'lotes_semillas', ['usuario_id'], unique=False)
    op.create_index(op.f('ix_lotes_semillas_variedad_id'), 'lotes_semillas', ['variedad_id'], unique=False)
    
    # Create pruebas_germinacion table
    op.create_table('pruebas_germinacion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('lote_semillas_id', sa.Integer(), nullable=False),
        sa.Column('fecha_prueba', sa.DateTime(), nullable=False),
        sa.Column('cantidad_semillas_probadas', sa.Integer(), nullable=False),
        sa.Column('cantidad_germinadas', sa.Integer(), nullable=False),
        sa.Column('porcentaje_germinacion', sa.Float(), nullable=True),
        sa.Column('dias_germinacion_promedio', sa.Float(), nullable=True),
        sa.Column('temperatura_prueba_c', sa.Float(), nullable=True),
        sa.Column('humedad_prueba_relativa', sa.Float(), nullable=True),
        sa.Column('medio_germinacion', sa.String(length=100), nullable=True),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['lote_semillas_id'], ['lotes_semillas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pruebas_germinacion_id'), 'pruebas_germinacion', ['id'], unique=False)
    op.create_index(op.f('ix_pruebas_germinacion_lote_semillas_id'), 'pruebas_germinacion', ['lote_semillas_id'], unique=False)
    op.create_index(op.f('ix_pruebas_germinacion_usuario_id'), 'pruebas_germinacion', ['usuario_id'], unique=False)
    
    # Create temporadas table
    op.create_table('temporadas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('anno', sa.Integer(), nullable=False),
        sa.Column('mes_inicio', sa.Integer(), nullable=False),
        sa.Column('mes_fin', sa.Integer(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('clima_esperado', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_temporadas_id'), 'temporadas', ['id'], unique=False)
    
    # Create plantaciones table
    op.create_table('plantaciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('lote_semillas_id', sa.Integer(), nullable=False),
        sa.Column('nombre_plantacion', sa.String(length=255), nullable=False),
        sa.Column('fecha_siembra', sa.DateTime(), nullable=False),
        sa.Column('tipo_siembra', sa.String(length=50), nullable=False),
        sa.Column('cantidad_semillas_plantadas', sa.Integer(), nullable=True),
        sa.Column('ubicacion_descripcion', sa.String(length=255), nullable=True),
        sa.Column('coordenadas_x', sa.Float(), nullable=True),
        sa.Column('coordenadas_y', sa.Float(), nullable=True),
        sa.Column('estado', estado_plantacion_enum, nullable=True),
        sa.Column('fecha_germinacion', sa.DateTime(), nullable=True),
        sa.Column('fecha_trasplante', sa.DateTime(), nullable=True),
        sa.Column('fecha_cosecha_estimada', sa.DateTime(), nullable=True),
        sa.Column('fotos', sa.JSON(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['lote_semillas_id'], ['lotes_semillas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plantaciones_id'), 'plantaciones', ['id'], unique=False)
    op.create_index(op.f('ix_plantaciones_lote_semillas_id'), 'plantaciones', ['lote_semillas_id'], unique=False)
    op.create_index(op.f('ix_plantaciones_usuario_id'), 'plantaciones', ['usuario_id'], unique=False)
    
    # Create cosechas table
    op.create_table('cosechas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('plantacion_id', sa.Integer(), nullable=False),
        sa.Column('fecha_cosecha', sa.DateTime(), nullable=False),
        sa.Column('cantidad_kg', sa.Float(), nullable=True),
        sa.Column('cantidad_unidades', sa.Integer(), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('calidad_observada', sa.String(length=100), nullable=True),
        sa.Column('metodo_almacenamiento', sa.String(length=100), nullable=True),
        sa.Column('fecha_consumo_inicio', sa.DateTime(), nullable=True),
        sa.Column('fotos', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['plantacion_id'], ['plantaciones.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cosechas_id'), 'cosechas', ['id'], unique=False)
    op.create_index(op.f('ix_cosechas_plantacion_id'), 'cosechas', ['plantacion_id'], unique=False)
    op.create_index(op.f('ix_cosechas_usuario_id'), 'cosechas', ['usuario_id'], unique=False)
    
    # Create cosechas_semillas table
    op.create_table('cosechas_semillas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('plantacion_id', sa.Integer(), nullable=False),
        sa.Column('fecha_cosecha', sa.DateTime(), nullable=False),
        sa.Column('cantidad_semillas_estimada', sa.Integer(), nullable=True),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('metodo_secado', sa.String(length=100), nullable=True),
        sa.Column('fecha_secado_completado', sa.DateTime(), nullable=True),
        sa.Column('porcentaje_viabilidad_inicial', sa.Float(), nullable=True),
        sa.Column('lugar_almacenamiento', sa.String(length=255), nullable=True),
        sa.Column('temperatura_almacenamiento_c', sa.Float(), nullable=True),
        sa.Column('humedad_relativa', sa.Float(), nullable=True),
        sa.Column('fotos', sa.JSON(), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['plantacion_id'], ['plantaciones.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cosechas_semillas_id'), 'cosechas_semillas', ['id'], unique=False)
    op.create_index(op.f('ix_cosechas_semillas_plantacion_id'), 'cosechas_semillas', ['plantacion_id'], unique=False)
    op.create_index(op.f('ix_cosechas_semillas_usuario_id'), 'cosechas_semillas', ['usuario_id'], unique=False)


def downgrade() -> None:
    """
    Revert database changes:
    - Drop all new tables
    - Drop ENUMs
    """
    op.drop_index(op.f('ix_cosechas_semillas_usuario_id'), table_name='cosechas_semillas')
    op.drop_index(op.f('ix_cosechas_semillas_plantacion_id'), table_name='cosechas_semillas')
    op.drop_index(op.f('ix_cosechas_semillas_id'), table_name='cosechas_semillas')
    op.drop_table('cosechas_semillas')
    
    op.drop_index(op.f('ix_cosechas_usuario_id'), table_name='cosechas')
    op.drop_index(op.f('ix_cosechas_plantacion_id'), table_name='cosechas')
    op.drop_index(op.f('ix_cosechas_id'), table_name='cosechas')
    op.drop_table('cosechas')
    
    op.drop_index(op.f('ix_plantaciones_usuario_id'), table_name='plantaciones')
    op.drop_index(op.f('ix_plantaciones_lote_semillas_id'), table_name='plantaciones')
    op.drop_index(op.f('ix_plantaciones_id'), table_name='plantaciones')
    op.drop_table('plantaciones')
    
    op.drop_index(op.f('ix_temporadas_id'), table_name='temporadas')
    op.drop_table('temporadas')
    
    op.drop_index(op.f('ix_pruebas_germinacion_usuario_id'), table_name='pruebas_germinacion')
    op.drop_index(op.f('ix_pruebas_germinacion_lote_semillas_id'), table_name='pruebas_germinacion')
    op.drop_index(op.f('ix_pruebas_germinacion_id'), table_name='pruebas_germinacion')
    op.drop_table('pruebas_germinacion')
    
    op.drop_index(op.f('ix_lotes_semillas_variedad_id'), table_name='lotes_semillas')
    op.drop_index(op.f('ix_lotes_semillas_usuario_id'), table_name='lotes_semillas')
    op.drop_index(op.f('ix_lotes_semillas_numero_lote'), table_name='lotes_semillas')
    op.drop_index(op.f('ix_lotes_semillas_id'), table_name='lotes_semillas')
    op.drop_table('lotes_semillas')
    
    op.drop_index(op.f('ix_variedades_nombre_variedad'), table_name='variedades')
    op.drop_index(op.f('ix_variedades_id'), table_name='variedades')
    op.drop_index(op.f('ix_variedades_especie_id'), table_name='variedades')
    op.drop_table('variedades')
    
    op.drop_index(op.f('ix_especies_nombre_comun'), table_name='especies')
    op.drop_index(op.f('ix_especies_id'), table_name='especies')
    op.drop_table('especies')
    
    # Drop ENUMs
    sa.Enum(name='tipocosecha').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='estadoplantacion').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='frecuenciariego').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='tipoexposicionsolar').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='estadolotesemillas').drop(op.get_bind(), checkfirst=True)
