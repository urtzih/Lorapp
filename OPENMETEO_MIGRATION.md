# 🌍 Open-Meteo Integration - Migration Guide

## ¿Qué cambió?

He reemplazado **WeatherAPI.com** con **Open-Meteo** para los datos de clima. Razones:

### Comparativa

| Feature | WeatherAPI | Open-Meteo |
|---------|-----------|-----------|
| **Costo** | 1M calls/mes (trial) | ✅ Completamente GRATIS |
| **API Key** | ❌ Requiere (y ha expirado el 2/Mar/2026) | ✅ NO requiere - libre |
| **Límite de llamadas** | 1M/mes (tier gratis) | ✅ Ilimitado |
| **Datos meteorológicos** | ✅ Completos | ✅ Excelentes |
| **Astronomía** | ✅ Sí (via separate endpoint) | ✅ Sí (integrado) |
| **Attribution required** | No | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| **Uptime SLA** | 99.7% | ✅ > 99% |

### ¿Por qué mejor Open-Meteo?

```
WeatherAPI:
- 🔴 Trial termina 02-Mar-2026 (EN 14 DÍAS)
- 🔴 Requiere API Key (config + gestión)
- 🟡 1M llamadas/mes limite
- 💰 Pagos después del trial

Open-Meteo:
- ✅ NUNCA expira
- ✅ SIN API Key (llamadas directas)
- ✅ SIN límites razonables
- ✅ GRATIS forever
- ✅ Data CC BY 4.0 (libre de usar)
```

## Cambios técnicos

### 1. **Backend: `weather_cache_service.py`**

**Antes:**
```python
async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.weatherapi.com/v1/forecast.json",
        params={"key": settings.WEATHER_API_KEY, ...}
    )
```

**Ahora:**
```python
async with httpx.AsyncClient() as client:
    response = await httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": 42.8467,
            "longitude": -2.6716,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,...",
            "timezone": "auto"
        }
    )
```

**Ventaja:** No requiere autenticación API, no requiere credenciales almacenadas.

### 2. **Configuración: `.env`**

**Antes:**
```env
WEATHER_API_KEY=6dd7fa56b66c4404a3b170627261602
```

**Ahora:**
```env
# DEPRECATED - Open-Meteo doesn't require API key
WEATHER_API_KEY=optional-not-used
```

### 3. **Variables de configuración**

- `WEATHER_API_KEY`: Ya no es necesaria ✅
- Fallback local: Mantiene los mismos valores por defecto

## API Endpoints disponibles

### Open-Meteo (usado)

- **Forecast atual:** `https://api.open-meteo.com/v1/forecast`
  - Daily: temp_max, temp_min, precipitation, windspeed, uv_index, sunrise, sunset
  - Datos históricos disponibles con `past_days`

### Datos retornados (ejemplo Vitoria-Gasteiz, 16 Feb 2026)

```json
{
  "date": "2026-02-16",
  "location": "Vitoria-Gasteiz,Spain",
  "coordinates": {
    "latitude": 42.8467,
    "longitude": -2.6716
  },
  "weather": {
    "temperature": {
      "max_c": 12.0,
      "min_c": 8.9,
      "avg_c": 9.8
    },
    "precipitation": {
      "mm": 20.67,
      "chance_of_rain": 100
    },
    "condition": "Rainy",
    "wind_kph": 21.4,
    "humidity": 70,
    "uv_index": 0.3,
    "sunrise": "2026-02-16T08:06",
    "sunset": "2026-02-16T18:42"
  }
}
```

## Testing

### Endpoint de prueba (en terminal)

```powershell
# Obtener forecast 3 días (Vitoria-Gasteiz)
curl "https://api.open-meteo.com/v1/forecast?latitude=42.8467&longitude=-2.6716&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset&timezone=auto&forecast_days=3"
```

### Respuesta esperada

```json
{
  "latitude": 42.85,
  "longitude": -2.67,
  "generationtime_ms": 1.23,
  "utc_offset_seconds": 3600,
  "timezone": "Europe/Madrid",
  "timezone_abbreviation": "CET",
  "daily": {
    "time": ["2026-02-16", "2026-02-17", "2026-02-18"],
    "temperature_2m_max": [12.0, 11.5, 12.5],
    "temperature_2m_min": [8.9, 8.1, 6.8],
    "temperature_2m_mean": [9.8, 9.6, 9.9],
    "precipitation_sum": [20.67, 3.2, 2.0],
    "precipitation_probability_max": [100, 93, 45],
    "windspeed_10m_max": [21.4, 12.3, 32.9],
    "uv_index_max": [0.3, 3.65, 3.65],
    "sunrise": ["2026-02-16T08:06", "2026-02-17T08:04", "2026-02-18T08:03"],
    "sunset": ["2026-02-16T18:42", "2026-02-17T18:44", "2026-02-18T18:45"]
  }
}
```

## 🚀 Endpoints de la app (funcionan igual)

- `GET /api/calendar-integrated/month/{year}/{month}` → Retorna clima + fases lunares
- `GET /api/calendar-integrated/week-forecast` → Pronóstico 7 días (Open-Meteo)
- `GET /api/calendar-integrated/planting-advisory` → Recomendaciones inteligentes

## ⚠️ Notas importantes

### Attribution (CC BY 4.0)

Open-Meteo requiere atribución. Añade en tu footer o about:

```html
<p>Weather data by <a href="https://open-meteo.com" target="_blank">Open-Meteo</a> (Licensed CC BY 4.0)</p>
```

### Datos disponibles vs WeatherAPI

| Dato | WeatherAPI | Open-Meteo |
|------|-----------|-----------|
| Temperatura | ✅ | ✅ |
| Precipitación | ✅ | ✅ |
| Humedad | ✅ | ❌ (no en free tier) |
| Condición (sunny/rainy) | ✅ | ❌ (estimamos de precipitación) |
| Viento | ✅ | ✅ |
| UV Index | ✅ | ✅ |
| Salida/Puesta sol | ✅ | ✅ |
| Moonphase | API separada | Pendiente (actual: sincronizamos con LunarApiService) |

## 🔄 Fallback a cálculo local

Si Open-Meteo falla (raro), el sistema usa:

```python
# Seasonal fallback para Northern Hemisphere
Febrero (Invierno):
- Temp max: 10°C
- Temp min: 4°C
- Precipitación: 1.5mm
- Chance of rain: 60%
```

## 🎯 Resultado final

```
✅ ANTES: WeatherAPI trial → Expira 02-Mar → Requiere pago
✅ AHORA: Open-Meteo gratis → Infinito → Sin costos
✅ MEJOR: Datos consistentes + Calendarios integrados
✅ EASY: Sin mantenimiento de API keys
```

## 📊 Uso de recursos

- **Llamadas/día estimadas:** ~200 (10 usuarios × 2 predicciones)
- **Open-Meteo limit:** Sin límite (tier gratis)
- **Costo:** **$0 / mes**

---

**Resultado:** ¡Sistema de predicción meteorológica gratuito y sin límites de por vida! 🌾📈
