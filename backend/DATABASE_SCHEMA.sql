-- ============================================================================
-- LORAPP - BANCO DE SEMILLAS AVANZADO - ESQUEMA COMPLETO
-- ============================================================================
-- Creado: 2026-02-12
-- Sistema: MySQL 8.0+
-- ORM: SQLAlchemy 2.0+
-- Nombres de tablas y columnas en CASTELLANO

-- ============================================================================
-- TABLAS EXISTENTES (SIN CAMBIOS)
-- ============================================================================

-- users: Tabla de usuarios (sin cambios, referencias mostradas)
-- CREATE TABLE users (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     hashed_password VARCHAR(255),
--     name VARCHAR(255) NOT NULL,
--     location VARCHAR(500),
--     latitude FLOAT,
--     longitude FLOAT,
--     climate_zone VARCHAR(50),
--     language VARCHAR(5) DEFAULT 'es',
--     notifications_enabled BOOLEAN DEFAULT TRUE,
--     google_id VARCHAR(255) UNIQUE,
--     oauth_provider VARCHAR(50),
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- ENUMS (Tipos Enumerados)
-- ============================================================================

-- EstadoLoteSemillas: ENUM('activo', 'agotado', 'vencido', 'descartado')
-- TipoExposicionSolar: ENUM('total', 'parcial', 'sombra')
-- FrecuenciaRiego: ENUM('diario', 'cada_dos_dias', 'semanal', 'cada_dos_semanas', 'mensual')
-- EstadoPlantacion: ENUM('planificada', 'sembrada', 'germinada', 'trasplantada', 'crecimiento', 'cosecha_cercana', 'cosechada', 'cancelada')
-- TipoCosecha: ENUM('consumo', 'semilla', 'mixta')


-- ============================================================================
-- BANCO DE SEMILLAS - TABLAS BOTÁNICAS BASE
-- ============================================================================

CREATE TABLE especies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identificación
    nombre_comun VARCHAR(255) NOT NULL UNIQUE,
    nombre_cientifico VARCHAR(255) UNIQUE,
    familia_botanica VARCHAR(100),
    genero VARCHAR(100),
    
    -- Descripción y clasificación
    descripcion TEXT,
    tipo_cultivo VARCHAR(50) COMMENT 'hortaliza, fruta, flor, aromática',
    
    -- Parámetros agrícolas estándar
    profundidad_siembra_cm FLOAT,
    distancia_plantas_cm FLOAT,
    distancia_surcos_cm FLOAT,
    frecuencia_riego ENUM('diario', 'cada_dos_dias', 'semanal', 'cada_dos_semanas', 'mensual'),
    exposicion_solar ENUM('total', 'parcial', 'sombra'),
    
    -- Ciclo de cultivo
    dias_germinacion_min INT,
    dias_germinacion_max INT,
    dias_hasta_trasplante INT,
    dias_hasta_cosecha_min INT,
    dias_hasta_cosecha_max INT,
    
    -- Calendario de siembra (JSON array de meses 1-12)
    meses_siembra_interior JSON DEFAULT '[]',
    meses_siembra_exterior JSON DEFAULT '[]',
    
    -- Condiciones de crecimiento
    temperatura_minima_c FLOAT,
    temperatura_maxima_c FLOAT,
    zonas_climaticas_preferidas JSON DEFAULT '[]',
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre_comun (nombre_comun),
    INDEX idx_familia (familia_botanica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE especies IS 'Especies botánicas disponibles en el sistema - tabla global';


CREATE TABLE variedades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    especie_id INT NOT NULL,
    
    -- Identificación
    nombre_variedad VARCHAR(255) NOT NULL,
    codigo_interno VARCHAR(100) UNIQUE,
    
    -- Características específicas
    descripcion TEXT,
    color_fruto VARCHAR(100),
    sabor VARCHAR(255),
    tamanio_planta VARCHAR(50) COMMENT 'enana, compacta, grande, trepadoras',
    
    -- Parámetros heredados (pueden sobrescribir especie)
    profundidad_siembra_cm FLOAT,
    distancia_plantas_cm FLOAT,
    distancia_surcos_cm FLOAT,
    dias_germinacion_min INT,
    dias_germinacion_max INT,
    dias_hasta_cosecha_min INT,
    dias_hasta_cosecha_max INT,
    
    -- Características especiales
    resistencias JSON DEFAULT '[]',
    es_hibrido_f1 BOOLEAN DEFAULT FALSE,
    es_variedad_antigua BOOLEAN DEFAULT FALSE,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (especie_id) REFERENCES especies(id) ON DELETE CASCADE,
    INDEX idx_especie (especie_id),
    INDEX idx_nombre_variedad (nombre_variedad),
    INDEX idx_codigo (codigo_interno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE variedades IS 'Variedades dentro de especies - multiples variedad por especie';


-- ============================================================================
-- BANCO DE SEMILLAS - INVENTARIO
-- ============================================================================

CREATE TABLE lotes_semillas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    variedad_id INT NOT NULL,
    
    -- Información comercial
    nombre_comercial VARCHAR(500) NOT NULL,
    marca VARCHAR(255),
    numero_lote VARCHAR(100),
    
    -- Datos del paquete
    cantidad_estimada INT COMMENT 'Número de semillas en paquete',
    anno_produccion INT,
    fecha_vencimiento DATETIME,
    fecha_adquisicion DATETIME,
    
    -- Almacenamiento
    lugar_almacenamiento VARCHAR(255) COMMENT 'frigorífico, despensa, etc.',
    temperatura_almacenamiento_c FLOAT,
    humedad_relativa FLOAT COMMENT 'Porcentaje 0-100',
    
    -- Estado
    estado ENUM('activo', 'agotado', 'vencido', 'descartado') DEFAULT 'activo',
    cantidad_restante INT,
    
    -- Documentación
    fotos JSON DEFAULT '[]',
    notas TEXT,
    informacion_proveedor JSON,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (variedad_id) REFERENCES variedades(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_variedad (variedad_id),
    INDEX idx_estado (estado),
    INDEX idx_numero_lote (numero_lote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE lotes_semillas IS 'Inventario de semillas del usuario - paquetes físicos';


-- ============================================================================
-- CONTROL DE CALIDAD
-- ============================================================================

CREATE TABLE pruebas_germinacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    lote_semillas_id INT NOT NULL,
    
    -- Datos de la prueba
    fecha_prueba DATETIME NOT NULL,
    cantidad_semillas_probadas INT NOT NULL,
    cantidad_germinadas INT NOT NULL,
    
    -- Resultados
    porcentaje_germinacion FLOAT COMMENT '(germinadas/probadas)*100',
    dias_germinacion_promedio FLOAT,
    
    -- Condiciones
    temperatura_prueba_c FLOAT,
    humedad_prueba_relativa FLOAT,
    medio_germinacion VARCHAR(100) COMMENT 'algodón, papel, tierra, agua',
    
    -- Notas
    observaciones TEXT,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_semillas_id) REFERENCES lotes_semillas(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_lote (lote_semillas_id),
    INDEX idx_fecha (fecha_prueba)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE pruebas_germinacion IS 'Registro de pruebas de viabilidad de semillas';


-- ============================================================================
-- GESTIÓN DE CULTIVOS
-- ============================================================================

CREATE TABLE temporadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Identificación
    nombre VARCHAR(100) NOT NULL,
    anno INT NOT NULL,
    
    -- Período
    mes_inicio INT NOT NULL COMMENT '1-12',
    mes_fin INT NOT NULL COMMENT '1-12',
    
    -- Información
    descripcion TEXT,
    clima_esperado VARCHAR(100),
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_temporada (nombre, anno),
    INDEX idx_anno (anno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE temporadas IS 'Períodos de cultivo en el año (opcional)';


CREATE TABLE plantaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    lote_semillas_id INT NOT NULL,
    
    -- Información de plantación
    nombre_plantacion VARCHAR(255) NOT NULL,
    fecha_siembra DATETIME NOT NULL,
    tipo_siembra VARCHAR(50) NOT NULL COMMENT 'interior, exterior, terraza, maceta',
    cantidad_semillas_plantadas INT,
    
    -- Ubicación física
    ubicacion_descripcion VARCHAR(255),
    coordenadas_x FLOAT COMMENT 'Para mapas futuros',
    coordenadas_y FLOAT,
    
    -- Seguimiento del ciclo
    estado ENUM('planificada', 'sembrada', 'germinada', 'trasplantada', 'crecimiento', 'cosecha_cercana', 'cosechada', 'cancelada') DEFAULT 'planificada',
    fecha_germinacion DATETIME,
    fecha_trasplante DATETIME,
    fecha_cosecha_estimada DATETIME,
    
    -- Documentación
    fotos JSON DEFAULT '[]',
    notas TEXT,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_semillas_id) REFERENCES lotes_semillas(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_lote (lote_semillas_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_siembra (fecha_siembra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE plantaciones IS 'Eventos de siembra/plantación - vincula lote_semillas con evento';


CREATE TABLE cosechas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    plantacion_id INT NOT NULL,
    
    -- Información de cosecha
    fecha_cosecha DATETIME NOT NULL,
    cantidad_kg FLOAT COMMENT 'Peso total cosechado',
    cantidad_unidades INT COMMENT 'Número de frutos/plantas',
    
    -- Descripción
    descripcion TEXT,
    calidad_observada VARCHAR(100) COMMENT 'excelente, buena, regular, mala',
    
    -- Almacenamiento y uso
    metodo_almacenamiento VARCHAR(100) COMMENT 'frigorífico, despensa, congelador',
    fecha_consumo_inicio DATETIME,
    
    -- Documentación
    fotos JSON DEFAULT '[]',
    notas TEXT,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plantacion_id) REFERENCES plantaciones(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_plantacion (plantacion_id),
    INDEX idx_fecha (fecha_cosecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE cosechas IS 'Cosechas de alimentos/frutos';


CREATE TABLE cosechas_semillas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    plantacion_id INT NOT NULL,
    
    -- Información de cosecha
    fecha_cosecha DATETIME NOT NULL,
    cantidad_semillas_estimada INT,
    
    -- Descripción del proceso
    descripcion TEXT,
    metodo_secado VARCHAR(100) COMMENT 'aire, deshidratador, congelador',
    fecha_secado_completado DATETIME,
    
    -- Viabilidad
    porcentaje_viabilidad_inicial FLOAT,
    
    -- Almacenamiento
    lugar_almacenamiento VARCHAR(255),
    temperatura_almacenamiento_c FLOAT,
    humedad_relativa FLOAT,
    
    -- Documentación
    fotos JSON DEFAULT '[]',
    notas TEXT,
    
    -- Control
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plantacion_id) REFERENCES plantaciones(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_plantacion (plantacion_id),
    INDEX idx_fecha (fecha_cosecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMENT ON TABLE cosechas_semillas IS 'Cosechas de semillas para propagación';


-- ============================================================================
-- NOTIFICACIONES Y SUSCRIPCIONES
-- ============================================================================

-- push_subscriptions: Actualizar user_id a usuario_id
ALTER TABLE push_subscriptions CHANGE COLUMN user_id usuario_id INT;
ALTER TABLE push_subscriptions DROP FOREIGN KEY push_subscriptions_ibfk_1;
ALTER TABLE push_subscriptions ADD FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;

-- notification_history: Actualizar user_id a usuario_id
ALTER TABLE notification_history CHANGE COLUMN user_id usuario_id INT;
ALTER TABLE notification_history DROP FOREIGN KEY notification_history_ibfk_1;
ALTER TABLE notification_history ADD FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;


-- ============================================================================
-- ÍNDICES Y OPTIMIZACIONES
-- ============================================================================

-- Crear índices compuestos para búsquedas comunes
CREATE INDEX idx_usuario_estado ON lotes_semillas(usuario_id, estado);
CREATE INDEX idx_usuario_plantacion_estado ON plantaciones(usuario_id, estado);
CREATE INDEX idx_plantacion_cosecha ON cosechas(plantacion_id, fecha_cosecha);

-- Crear vistas útiles
CREATE VIEW v_lotes_activos AS
SELECT 
    ls.id,
    u.name as usuario,
    e.nombre_comun,
    v.nombre_variedad,
    ls.nombre_comercial,
    ls.cantidad_restante,
    ls.fecha_vencimiento,
    ls.estado
FROM lotes_semillas ls
JOIN users u ON ls.usuario_id = u.id
JOIN variedades v ON ls.variedad_id = v.id
JOIN especies e ON v.especie_id = e.id
WHERE ls.estado = 'activo' AND (ls.fecha_vencimiento IS NULL OR ls.fecha_vencimiento > NOW());

CREATE VIEW v_plantaciones_en_curso AS
SELECT 
    p.id,
    u.name as usuario,
    e.nombre_comun,
    v.nombre_variedad,
    p.nombre_plantacion,
    p.estado,
    p.fecha_siembra,
    p.fecha_cosecha_estimada,
    DATEDIFF(IFNULL(p.fecha_cosecha_estimada, NOW()), NOW()) as dias_faltantes
FROM plantaciones p
JOIN users u ON p.usuario_id = u.id
JOIN lotes_semillas ls ON p.lote_semillas_id = ls.id
JOIN variedades v ON ls.variedad_id = v.id
JOIN especies e ON v.especie_id = e.id
WHERE p.estado NOT IN ('cosechada', 'cancelada');

-- ============================================================================
-- DATOS INICIALES (Ejemplo: Especies comunes)
-- ============================================================================

INSERT INTO especies (nombre_comun, nombre_cientifico, familia_botanica, genero, tipo_cultivo, 
                      profundidad_siembra_cm, distancia_plantas_cm, distancia_surcos_cm,
                      frecuencia_riego, exposicion_solar,
                      dias_germinacion_min, dias_germinacion_max, dias_hasta_trasplante, dias_hasta_cosecha_min, dias_hasta_cosecha_max,
                      meses_siembra_interior, meses_siembra_exterior,
                      temperatura_minima_c, temperatura_maxima_c, zonas_climaticas_preferidas)
VALUES
('Tomate', 'Solanum lycopersicum', 'Solanaceae', 'Solanum', 'hortaliza',
 1, 50, 70,
 'diario', 'total',
 5, 10, 35, 55, 85,
 '[2,3,4]', '[5,6,7,8]',
 18, 30, '["templada", "mediterránea"]'),

('Lechuga', 'Lactuca sativa', 'Asteraceae', 'Lactuca', 'hortaliza',
 0.5, 30, 40,
 'semanal', 'parcial',
 4, 8, 0, 30, 50,
 '[1,2,3,4,8,9]', '[4,5,9,10,11]',
 10, 20, '["templada"]'),

('Habas', 'Vicia faba', 'Fabaceae', 'Vicia', 'hortaliza',
 3, 20, 45,
 'semanal', 'total',
 10, 14, 30, 70, 100,
 '[10,11,12,1]', '[1,2,3]',
 10, 25, '["templada", "mediterránea"]');

-- ============================================================================
-- INFORMACIÓN Y MARCADORES
-- ============================================================================

-- Para verificar que todo está correcto:
SELECT 'Esquema de Banco de Semillas Lorapp - Refactorizado 2026-02-12';

-- Ver todas las tablas nuevas:
-- SHOW TABLES LIKE '%especies%' OR LIKE '%semillas%' OR LIKE '%plantaciones%' OR LIKE '%cosechas%';

-- Verificar FK:
-- SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_NAME IS NOT NULL
-- ORDER BY TABLE_NAME;
