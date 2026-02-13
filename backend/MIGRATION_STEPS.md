# Guía de Aplicación de Migración

## Pasos para aplicar la refactorización de la base de datos

### 1. Verificar que Docker esté corriendo
```bash
docker-compose ps
```

### 2. Entrar al contenedor del backend
```bash
docker-compose exec backend bash
```

### 3. Aplicar la migración de Alembic
```bash
alembic upgrade head
```

### 4. Ejecutar el script de seed con tus datos
```bash
python seed_data.py
```

### 5. Verificar que los datos se insertaron correctamente
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U lorapp_user -d lorapp

# Ver especies insertadas
SELECT COUNT(*) FROM especies;

# Ver variedades insertadas
SELECT COUNT(*) FROM variedades;

# Ver algunas variedades de tomate
SELECT v.nombre_variedad, v.tipo_origen, v.procedencia 
FROM variedades v 
JOIN especies e ON v.especie_id = e.id 
WHERE e.nombre_comun = 'Tomate'
LIMIT 10;
```

## Resumen de cambios

- **8 nuevas tablas**: especies, variedades, lotes_semillas, pruebas_germinacion, temporadas, plantaciones, cosechas, cosechas_semillas
- **5 ENUMs**: EstadoLoteSemillas, TipoExposicionSolar, FrecuenciaRiego, EstadoPlantacion, TipoCosecha
- **64 variedades** distribuidas en 29 especies
- **Nuevos campos en Variedad**: tipo_origen, procedencia, anno_recoleccion, generacion, tipo_polinizacion

## Datos insertados
- 29 especies diferentes
- 64 variedades (28 compradas de Latanina + 36 propias de Huerta Urtzi)
