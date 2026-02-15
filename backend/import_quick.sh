#!/bin/bash
# Script rápido para importar plantas con INSERT directo

cd /app

psql postgresql://lorapp_user:lorapp_dev_password_123@postgres:5432/lorapp <<'EOSQL'

-- Crear función para procesar CSV
CREATE TEMP TABLE temp_plants (
    name VARCHAR(255),
    sfgOriginal VARCHAR(10),
    sfgMultisow VARCHAR(10),
    sfgMacizo VARCHAR(10)
);

-- Copiar desde CSV
\COPY temp_plants FROM '/app/plants_sfg.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', NULL '', ENCODING 'UTF-8');

-- Insertar especies nuevas
INSERT INTO especies (nombre_comun, tipo_cultivo, created_at)
SELECT DISTINCT 
    TRIM(name),
    'SFG',
    CURRENT_TIMESTAMP
FROM temp_plants tp
WHERE TRIM(tp.name) != ''
  AND NOT EXISTS (
    SELECT 1 FROM especies e WHERE e.nombre_comun = TRIM(tp.name)
  )
ON CONFLICT (nombre_comun) DO NOTHING;

-- Insertar datos SFG
INSERT INTO square_foot_gardening (especie_id, plantas_original, plantas_multisow, plantas_macizo)
SELECT 
    e.id,
    CASE WHEN TRIM(tp.sfgOriginal) != '' THEN CAST(TRIM(tp.sfgOriginal) AS INTEGER) ELSE NULL END,
    CASE WHEN TRIM(tp.sfgMultisow) != '' THEN CAST(TRIM(tp.sfgMultisow) AS INTEGER) ELSE NULL END,
    CASE WHEN TRIM(tp.sfgMacizo) != '' THEN CAST(TRIM(tp.sfgMacizo) AS INTEGER) ELSE NULL END
FROM temp_plants tp
INNER JOIN especies e ON e.nombre_comun = TRIM(tp.name)
WHERE NOT EXISTS (
    SELECT 1 FROM square_foot_gardening sfg WHERE sfg.especie_id = e.id
)
AND (
    TRIM(tp.sfgOriginal) != '' OR 
    TRIM(tp.sfgMultisow) != '' OR 
    TRIM(tp.sfgMacizo) != ''
);

-- Mostrar resumen
SELECT 
    (SELECT COUNT(*) FROM especies) as total_especies,
    (SELECT COUNT(*) FROM square_foot_gardening) as con_datos_sfg,
    (SELECT COUNT(*) FROM especies WHERE tipo_cultivo = 'SFG') as tipo_sfg;

EOSQL

echo "✅ Importación completada"
