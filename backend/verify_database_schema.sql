-- ============================================================================
-- Script de verificación del esquema de base de datos
-- LORAPP - Banco de Semillas
-- ============================================================================

-- Verificar todas las tablas existentes
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- ============================================================================
-- Verificar columnas de la tabla especies
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'especies'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- Verificar columnas de la tabla variedades
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'variedades'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- Verificar Foreign Keys
-- ============================================================================
SELECT
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna_fk,
    ccu.table_name AS tabla_referenciada,
    ccu.column_name AS columna_referenciada,
    rc.delete_rule AS on_delete
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY 
    tc.table_name, kcu.column_name;

-- ============================================================================
-- Verificar índices
-- ============================================================================
SELECT
    tablename AS tabla,
    indexname AS indice,
    indexdef AS definicion
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename, indexname;

-- ============================================================================
-- Verificar restricciones UNIQUE
-- ============================================================================
SELECT
    tc.table_name AS tabla,
    kcu.column_name AS columna,
    tc.constraint_name AS nombre_restriccion
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY 
    tc.table_name, kcu.column_name;

-- ============================================================================
-- Contar registros en cada tabla
-- ============================================================================
SELECT 
    'users' AS tabla, COUNT(*) AS total FROM users
UNION ALL
SELECT 'especies', COUNT(*) FROM especies
UNION ALL
SELECT 'variedades', COUNT(*) FROM variedades
UNION ALL
SELECT 'square_foot_gardening', COUNT(*) FROM square_foot_gardening
UNION ALL
SELECT 'lotes_semillas', COUNT(*) FROM lotes_semillas
UNION ALL
SELECT 'pruebas_germinacion', COUNT(*) FROM pruebas_germinacion
UNION ALL
SELECT 'temporadas', COUNT(*) FROM temporadas
UNION ALL
SELECT 'plantaciones', COUNT(*) FROM plantaciones
UNION ALL
SELECT 'cosechas', COUNT(*) FROM cosechas
UNION ALL
SELECT 'cosechas_semillas', COUNT(*) FROM cosechas_semillas
UNION ALL
SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions
UNION ALL
SELECT 'notification_history', COUNT(*) FROM notification_history
UNION ALL
SELECT 'crop_rules', COUNT(*) FROM crop_rules
ORDER BY tabla;

-- ============================================================================
-- Verificar si existen campos de cultivo en especies (NO deberían existir)
-- ============================================================================
SELECT 
    COUNT(*) AS campos_cultivo_en_especies
FROM 
    information_schema.columns
WHERE 
    table_name = 'especies'
    AND column_name IN (
        'profundidad_siembra_cm',
        'distancia_plantas_cm',
        'distancia_surcos_cm',
        'frecuencia_riego',
        'exposicion_solar',
        'dias_germinacion_min',
        'dias_germinacion_max',
        'dias_hasta_trasplante',
        'dias_hasta_cosecha_min',
        'dias_hasta_cosecha_max'
    );

-- ============================================================================
-- Verificar campos de Square Foot Gardening en especies (deberían existir)
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'especies'
    AND column_name LIKE 'square_foot%'
ORDER BY 
    column_name;

-- ============================================================================
-- Verificar tabla square_foot_gardening
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'square_foot_gardening'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- Verificar versión de Alembic aplicada
-- ============================================================================
SELECT 
    version_num,
    is_current
FROM 
    alembic_version
ORDER BY 
    version_num DESC;

-- ============================================================================
-- Verificar estructura de notification_history
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'notification_history'
ORDER BY 
    ordinal_position;

-- ============================================================================
-- Verificar índices en notification_history
-- ============================================================================
SELECT
    indexname AS indice,
    indexdef AS definicion
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = 'notification_history'
ORDER BY
    indexname;
