# Revisión del Esquema de Base de Datos - LORAPP

## Fecha de revisión: 15 de febrero de 2026

## Actualización: 16 de febrero de 2026

---

## 🚀 Resumen Ejecutivo de Cambios Recientes

**Separación de dominios:**
- **Catálogo global compartido:** especies, variedades, fichas de conocimiento, reglas de cultivo.
- **Datos privados por usuario:** temporadas, lugares, plantaciones, lotes de semillas, listas, archivos, inventario, etc.

**Nuevos modelos colaborativos y escalables:**
- **Temporada:** organiza plantaciones por ciclos personalizados del usuario.
- **Lugar:** ubicaciones físicas personalizadas.
- **Archivo:** adjuntos asociables a cualquier entidad (plantacion, variedad, etc.).
- **Lista y ListaItem:** listas colaborativas con visibilidad y slug publico.
- **FichaConocimiento:** fichas versionadas y asociadas a cualquier entidad.

**Relaciones clave actualizadas:**
- Plantacion ahora puede vincularse a Temporada y Lugar.
- User extiende relaciones a temporadas, lugares, archivos, listas.
- Indices y constraints reforzados para escalabilidad multiusuario.

**Compatibilidad y migracion:**
- No se rompe el modelo legacy, se mantienen tablas y relaciones previas.
- Se usan BIGSERIAL/BIGINT y JSONB para escalabilidad y flexibilidad.

---

## � Resumen Ejecutivo

**Estado General:** ✅ **BUENO** - Base de datos bien diseñada con ajustes menores pendientes

### Estadísticas
- **13 tablas** en total
- **12 relaciones** bien definidas con cascadas
- **5 Enums** para estados y categorías
- **Todas las tablas** tienen timestamps (created_at, updated_at)

### Hallazgos Clave
✅ **Fortalezas:**
- Relaciones bien estructuradas con cascadas apropiadas
- Índices correctamente definidos en campos clave
- Diseño normalizado (campos de cultivo solo en Variedad)
- Uso apropiado de JSON para datos flexibles

⚠️ **Áreas de Mejora:**
1. Relationship faltante: User ↔ NotificationHistory
2. Falta indice en NotificationHistory.sent_at
3. Validar migraciones Alembic con la nueva estructura
4. Tabla CropRule legacy (verificar si se usa)

---

## �📊 Resumen de Tablas (2026)

### Catalogo Global (compartido)
- **especies**
- **variedades**
- **square_foot_gardening**
- **fichas_conocimiento**
- **crop_rules** (legacy)

### Datos Privados por Usuario
- **users**
- **temporadas**
- **lugares**
- **plantaciones**
- **lotes_semillas**
- **pruebas_germinacion**
- **cosechas**
- **cosechas_semillas**
- **listas**
- **listas_items**
- **archivos**
- **push_subscriptions**
- **notification_history**

---

## 🔗 Mapa de Relaciones

### User (Usuario Principal)
```
User (1:N)
├── lotes_semillas
├── plantaciones
├── cosechas
├── cosechas_semillas
├── pruebas_germinacion
├── push_subscriptions
├── temporadas
├── lugares
├── archivos
└── listas
```

### Especie → Variedad → Lote
```
Especie (1:N)
├── variedades
└── square_foot_gardening (1:1)

Variedad (1:N)
└── lotes_semillas

LoteSemillas (1:N)
├── plantaciones
└── pruebas_germinacion
```

### Plantación → Temporada, Lugar, Cosechas
```
Plantacion (1:N)
├── cosechas
├── cosechas_semillas
└── temporada (N:1)
└── lugar (N:1)
```

---

## ⚠️ Problemas Identificados

### 1. **Relationship faltante en User**
**Problema:** `NotificationHistory` tiene una FK a `users.id`, pero el modelo `User` no declara la relación inversa.

**Ubicación:**
- [backend/app/infrastructure/database/models.py](backend/app/infrastructure/database/models.py#L107)

**Estado actual:**
```python
# User model - FALTA esta relación:
# notification_history = relationship("NotificationHistory", back_populates="usuario", cascade="all, delete-orphan")
```

**NotificationHistory declara:**
```python
usuario_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
# Pero NO tiene: usuario = relationship("User", back_populates="notification_history")
```

**Impacto:** 
- No se pueden consultar las notificaciones desde el objeto User
- Inconsistencia en el modelo ORM

**Solución recomendada:**
1. Añadir en `User`: `notification_history = relationship("NotificationHistory", back_populates="usuario", cascade="all, delete-orphan")`
2. Añadir en `NotificationHistory`: `usuario = relationship("User", back_populates="notification_history")`

---

### 2. **Campos comentados en Especie - DECISIÓN DE DISEÑO ✅**
**Estado:** Los campos de cultivo fueron **intencionalmente eliminados** de `Especie` en la migración 005.

**Ubicación:**
- [backend/app/infrastructure/database/models.py](backend/app/infrastructure/database/models.py#L135-L152)
- [backend/alembic/versions/005_remove_cultivation_params_from_especie.py](backend/alembic/versions/005_remove_cultivation_params_from_especie.py)

**Campos eliminados de Especie (ahora solo en Variedad):**
- `profundidad_siembra_cm`
- `distancia_plantas_cm`
- `distancia_surcos_cm`
- `frecuencia_riego`
- `exposicion_solar`
- `dias_germinacion_min/max`
- `dias_hasta_trasplante`
- `dias_hasta_cosecha_min/max`
- `meses_siembra_interior/exterior`
- `temperatura_minima_c/maxima_c`
- `zonas_climaticas_preferidas`

**Razón del diseño:**
Diferentes **variedades de la misma especie** pueden tener requisitos de cultivo muy diferentes. Por ejemplo:
- Tomate Cherry vs Tomate Beefsteak (diferentes tiempos de cosecha)
- Lechuga romana vs Lechuga iceberg (diferentes espaciados)

Por lo tanto, es correcto que estos campos estén **solo en Variedad**.

**Impacto:**
- ✅ Diseño correcto y normalizado
- ✅ Mayor precisión en los datos de cultivo
- ✅ Prisma actualizado para reflejar esta decision

---

### 3. **Tabla Temporada ahora relacionada**
**Estado:** La tabla `temporadas` esta vinculada a `Plantacion` y `User`.

**Estado actual:**
```python
Plantacion.temporada_id = Column(BIGINT, ForeignKey("temporadas.id"), nullable=True)
Plantacion.temporada = relationship("Temporada", back_populates="plantaciones")
User.temporadas = relationship("Temporada", back_populates="usuario")
```

**Impacto:**
- La tabla se integra en el flujo de datos
- Plantaciones pueden organizarse por temporada

---

### 4. **Falta índice en NotificationHistory.sent_at**
**Problema:** La columna `sent_at` en `NotificationHistory` no tiene índice, pero probablemente se use para consultas de rango.

**Ubicación:**
- [backend/app/infrastructure/database/models.py](backend/app/infrastructure/database/models.py#L589)

**Solución recomendada:**
```python
sent_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), index=True)
```

---

## ✅ Aspectos Positivos

### 1. **Cascade correctamente configurado**
Todas las relaciones tienen `cascade="all, delete-orphan"` o `ondelete="CASCADE"` apropiadamente configurados.

### 2. **Timestamps consistentes**
Todas las tablas tienen `created_at` y `updated_at` (excepto NotificationHistory que no necesita `updated_at`).

### 3. **Índices bien definidos**
Los campos clave tienen índices:
- Foreign keys
- Campos de búsqueda frecuente (email, nombre_comun, estado, etc.)

### 4. **Enums bien tipados**
Uso correcto de Enums para estados y categorías.

### 5. **JSON para campos flexibles**
Uso apropiado de JSON para:
- Arrays simples (fotos, resistencias)
- Datos sin estructura fija (informacion_proveedor)

---

## 📋 Diagrama de Relaciones Completo

```
                            ╔═══════════════════╗
                            ║       User        ║
                            ╚═════════┬═════════╝
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ├─────────────┐            ├─────────────┐            ├────────────────┐
           │             │            │             │            │                │
           ▼             ▼            ▼             ▼            ▼                ▼
  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌─────────────┐
  │    Push     │ │Notification│ │ Prueba  │ │ Cosecha │ │ Cosecha │  │ Plantacion  │
  │Subscription │ │  History   │ │Germinac.│ │         │ │Semillas │  │             │
  └─────────────┘ └──────────┬─┘ └────┬────┘ └────┬────┘ └────┬────┘  └──────┬──────┘
                             │        │           │           │              │
                       ⚠️ SIN └────────┴───────────┴───────────┴──────────────┘
                       RELACIÓN       │           │           │              │
                       BIDIRECCIONAL  │           │           └──────────────┘
                                     │           │
                                     ▼           ▼
                            ┌─────────────────────┐
                            │   LoteSemillas      │
                            └──────────┬──────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │     Variedad        │
                            └──────────┬──────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │      Especie        │
                            └──────────┬──────────┘
                                      │
                                      │ 1:1
                                      ▼
                            ┌─────────────────────┐
                            │ SquareFootGardening │
                            └─────────────────────┘

      ┌─────────────────┐
      │    Temporada    │  🔗 Relacionada con User y Plantacion
      └─────────────────┘
      ┌─────────────────┐
      │     Lugar       │  🔗 Relacionada con User y Plantacion
      └─────────────────┘
      ┌─────────────────┐
      │    Archivo      │  🔗 Adjuntos multi-entidad
      └─────────────────┘
      ┌─────────────────┐
      │     Lista       │  🔗 User -> ListaItem
      └─────────────────┘
      ┌────────────────────────┐
      │   FichaConocimiento    │  🔗 Asociable a cualquier entidad
      └────────────────────────┘

        ┌─────────────────┐
        │    CropRule     │  🗑️ LEGACY - Posiblemente en desuso
        └─────────────────┘
```

### Leyenda
- **Líneas sólidas (│─)**: Relaciones definidas con ForeignKey
- **⚠️**: Problemas o inconsistencias
- **🗑️**: Tabla legacy que requiere evaluación

---

## 🔧 Recomendaciones de Mejora

### Prioridad Alta

1. **Añadir relationship bidireccional para NotificationHistory**
   ```python
   # En User:
   notification_history = relationship("NotificationHistory", back_populates="usuario", cascade="all, delete-orphan")
   
   # En NotificationHistory:
   usuario = relationship("User", back_populates="notification_history")
   ```

2. **Añadir indice a NotificationHistory.sent_at**
   ```python
   sent_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), index=True)
   ```

### Prioridad Media

3. **Validar migraciones Alembic con la nueva estructura**
4. **Revisar tabla legacy CropRule si sigue en uso**
   - **O eliminar la tabla** si no se planea usar

5. **Considerar eliminar CropRule si no se usa**
   - Verificar si hay datos en la tabla
   - Si no se usa, crear migración para eliminarla
   - Es una tabla legacy del sistema antiguo

### Prioridad Baja

6. **Documentar propiedad calculada fecha_vencimiento**
   - Añadir tests para esta propiedad
   - Considerar calcularla en tiempo de consulta con SQL

7. **Considerar añadir soft deletes**
   - Campo `deleted_at` para mantener historial
   - Especialmente útil en lotes_semillas, plantaciones, cosechas

---

## 📝 Notas Adicionales

### Sincronización Prisma vs SQLAlchemy
El archivo `PRISMA_SCHEMA.prisma` es una **referencia para migración futura**, no es el schema activo. La verdadera fuente es SQLAlchemy en `models.py`.

### Migraciones de Alembic
Las migraciones están numeradas secuencialmente:
- 001: Refactorización inicial de semillas
- 002-008: Mejoras incrementales
- 009-010: Añadir Square Foot Gardening

### Campos JSON
Se usa JSON extensivamente para:
- `fotos` - Arrays de URLs
- `informacion_proveedor` - Datos flexibles
- `resistencias` - Arrays de strings
- `data` - Payload de notificaciones

---

## 🎯 Conclusión

El esquema está **escalable y preparado para colaboración**, con separación clara entre catalogo global y datos privados. Los principales puntos a atender son:

1. ⚠️ **Relationship faltante** en NotificationHistory
2. 📝 **Indice pendiente** en NotificationHistory.sent_at
3. 🧪 **Validar migraciones Alembic** para reflejar la nueva estructura
4. 🗑️ **Tabla legacy CropRule** (verificar uso y considerar eliminación)

**Decisiones de diseño correctas:**
- ✅ Campos de cultivo **solo en Variedad**, no en Especie (intencional, migracion 005)
- ✅ Temporada y Lugar ahora integradas con Plantacion y User

**Estado general:** ✅ **EXCELENTE** - Listo para produccion colaborativa
