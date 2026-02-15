-- Script SQL para importar plantas SFG
-- Lee el CSV y lo inserta en especies y square_foot_gardening

BEGIN;

-- Crear tabla temporal para cargar CSV
CREATE TEMP TABLE temp_sfg (
    name VARCHAR(255),
    sfgOriginal VARCHAR(10),
    sfgMultisow VARCHAR(10),
    sfgMacizo VARCHAR(10)
);

-- Cargar CSV en tabla temporal
\COPY temp_sfg FROM '/tmp/plants_sfg.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF-8');

-- Insertar especies que no existen
INSERT INTO especies (nombre_comun, tipo_cultivo, created_at)
SELECT DISTINCT name, 'SFG', CURRENT_TIMESTAMP
FROM temp_sfg
WHERE name NOT IN (SELECT nombre_comun FROM especies)
  AND name IS NOT NULL
  AND trim(name) != '';

-- Insertar datos SFG para nuevas especies
INSERT INTO square_foot_gardening (especie_id, plantas_original, plantas_multisow, plantas_macizo)
SELECT 
    e.id,
    CASE WHEN trim(t.sfgOriginal) != '' THEN CAST(t.sfgOriginal AS INTEGER) ELSE NULL END,
    CASE WHEN trim(t.sfgMultisow) != '' THEN CAST(t.sfgMultisow AS INTEGER) ELSE NULL END,
    CASE WHEN trim(t.sfgMacizo) != '' THEN CAST(t.sfgMacizo AS INTEGER) ELSE NULL END
FROM temp_sfg t
INNER JOIN especies e ON e.nombre_comun = t.name
WHERE NOT EXISTS (
    SELECT 1 FROM square_foot_gardening sfg WHERE sfg.especie_id = e.id
)
AND (trim(t.sfgOriginal) != '' OR trim(t.sfgMultisow) != '' OR trim(t.sfgMacizo) != '');

-- Actualizar especies existentes con datos SFG nuevos
UPDATE square_foot_gardening sfg
SET 
    plantas_original = CASE WHEN trim(t.sfgOriginal) != '' THEN CAST(t.sfgOriginal AS INTEGER) ELSE sfg.plantas_original END,
    plantas_multisow = CASE WHEN trim(t.sfgMultisow) != '' THEN CAST(t.sfgMultisow AS INTEGER) ELSE sfg.plantas_multisow END,
    plantas_macizo = CASE WHEN trim(t.sfgMacizo) != '' THEN CAST(t.sfgMacizo AS INTEGER) ELSE sfg.plantas_macizo END
FROM temp_sfg t
INNER JOIN especies e ON e.nombre_comun = t.name
WHERE sfg.especie_id = e.id;

-- Mostrar resumen
SELECT 
    (SELECT COUNT(*) FROM especies) as total_especies,
    (SELECT COUNT(*) FROM square_foot_gardening) as total_con_sfg,
    (SELECT COUNT(*) FROM especies WHERE tipo_cultivo = 'SFG') as especies_sfg;

COMMIT;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS temp_sfg;
