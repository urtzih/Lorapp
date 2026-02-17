import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { integratedCalendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function CalendarLunaTiempo() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [integratedCalendar, setIntegratedCalendar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCalendar();
    }, [currentMonth, currentYear]);

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const weekdayMap = {
        Monday: 'Lunes',
        Tuesday: 'Martes',
        Wednesday: 'Miercoles',
        Thursday: 'Jueves',
        Friday: 'Viernes',
        Saturday: 'Sabado',
        Sunday: 'Domingo'
    };

    const translateLunarPhase = (phase) => {
        const translations = {
            new_moon: 'Luna Nueva',
            waxing_crescent: 'Creciente',
            first_quarter: 'Cuarto Creciente',
            waxing_gibbous: 'Creciente Gibosa',
            full_moon: 'Luna Llena',
            waning_gibbous: 'Menguante Gibosa',
            last_quarter: 'Cuarto Menguante',
            waning_crescent: 'Menguante',
            Nueva: 'Luna Nueva',
            Creciente: 'Creciente',
            Llena: 'Luna Llena',
            Menguante: 'Menguante'
        };
        return translations[phase] || phase;
    };

    const getLunarPhaseEmoji = (phase) => {
        const emojis = {
            new_moon: '🌑',
            waxing_crescent: '🌒',
            first_quarter: '🌓',
            waxing_gibbous: '🌔',
            full_moon: '🌕',
            waning_gibbous: '🌖',
            last_quarter: '🌗',
            waning_crescent: '🌘',
            Nueva: '🌑',
            Creciente: '🌒',
            Llena: '🌕',
            Menguante: '🌖'
        };
        return emojis[phase] || '🌙';
    };

    const loadCalendar = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await integratedCalendarAPI.getMonth(currentYear, currentMonth);
            setIntegratedCalendar(response.data);
        } catch (err) {
            setError('No se pudo cargar el calendario de luna y tiempo.');
            setIntegratedCalendar(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">🌙 Luna y tiempo</h1>
                <p className="calendar-header__description text-gray">
                    Calendario completo con fases lunares y clima
                </p>
            </div>

            <div className="calendar-nav">
                <button
                    onClick={() => {
                        if (currentMonth === 1) {
                            setCurrentMonth(12);
                            setCurrentYear(currentYear - 1);
                        } else {
                            setCurrentMonth(currentMonth - 1);
                        }
                    }}
                    className="calendar-nav__btn btn btn-secondary"
                >
                    ←
                </button>
                <h3 className="calendar-nav__title">
                    {monthNames[currentMonth - 1]} {currentYear}
                </h3>
                <button
                    onClick={() => {
                        if (currentMonth === 12) {
                            setCurrentMonth(1);
                            setCurrentYear(currentYear + 1);
                        } else {
                            setCurrentMonth(currentMonth + 1);
                        }
                    }}
                    className="calendar-nav__btn btn btn-secondary"
                >
                    →
                </button>
            </div>

            <div className="tabs-container mb-4">
                <Link to="/calendar" className="tab-button">
                    <span className="tab-icon">📅</span>
                    <span className="tab-label">Resumen</span>
                </Link>
            </div>

            {loading && (
                <div className="flex justify-center items-center" style={{ minHeight: '320px', flexDirection: 'column', gap: '16px' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
                    <p className="text-gray" style={{ fontSize: '14px' }}>Cargando luna y tiempo...</p>
                </div>
            )}

            {!loading && error && (
                <div className="empty-state">
                    <h3>🌙 {error}</h3>
                    <button onClick={loadCalendar} className="btn btn-primary mt-4">
                        🔄 Reintentar
                    </button>
                </div>
            )}

            {!loading && !error && integratedCalendar && (
                <div>
                    <div className="card mb-6" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">📍 {integratedCalendar.location}</h3>
                            {integratedCalendar.coordinates && (
                                <p className="text-sm opacity-90">
                                    Lat: {integratedCalendar.coordinates.latitude?.toFixed(2) || 'N/A'}° |
                                    Lon: {integratedCalendar.coordinates.longitude?.toFixed(2) || 'N/A'}°
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="stat-card">
                            <div className="stat-label">Dias</div>
                            <div className="stat-value">{integratedCalendar.days?.length || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Sembrables</div>
                            <div className="stat-value">
                                {integratedCalendar.days?.reduce((sum, d) => sum + (d.plantable_seeds || 0), 0) || 0}
                            </div>
                        </div>
                    </div>

                    <div className="card mb-6" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white'
                    }}>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">🌙 Fases lunares</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                                gap: '12px'
                            }}>
                                {integratedCalendar.days
                                    ?.filter((day, idx, arr) =>
                                        idx === 0 || day.lunar?.phase !== arr[idx - 1]?.lunar?.phase
                                    )
                                    .map((day, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{ fontSize: '32px', marginBottom: '4px' }}>
                                                {getLunarPhaseEmoji(day.lunar?.phase)}
                                            </div>
                                            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                                                {translateLunarPhase(day.lunar?.phase)}
                                            </div>
                                            <div style={{ fontSize: '11px', opacity: '0.8' }}>
                                                Dia {day.day}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="card mb-6">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">📅 Calendario del mes</h3>
                            <div className="calendar-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '6px'
                            }}>
                                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
                                    <div key={day} style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        padding: '6px 2px',
                                        fontSize: '11px',
                                        borderBottom: '2px solid #e5e7eb'
                                    }}>
                                        {day}
                                    </div>
                                ))}

                                {integratedCalendar.days?.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className="calendar-day-card"
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            padding: '6px',
                                            minHeight: '70px',
                                            background: day.plantable_seeds > 0 ? '#f0fdf4' : '#f9fafb'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            marginBottom: '3px',
                                            color: '#6b7280'
                                        }}>
                                            {day.day}
                                        </div>

                                        <div style={{
                                            fontSize: '9px',
                                            background: '#ede9fe',
                                            color: '#6d28d9',
                                            padding: '1px 3px',
                                            borderRadius: '3px',
                                            marginBottom: '3px',
                                            fontWeight: '500',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {translateLunarPhase(day.lunar?.phase)} {Math.round(day.lunar?.illumination || 0)}%
                                        </div>

                                        <div style={{
                                            fontSize: '8px',
                                            color: '#6b7280',
                                            lineHeight: '1.2'
                                        }}>
                                            {typeof day.weather?.temperature === 'object' ? (
                                                <div>🌡️ {day.weather.temperature.max_c}°</div>
                                            ) : null}
                                            {typeof day.weather?.precipitation === 'object' ? (
                                                <div>🌧️ {day.weather.precipitation.chance_of_rain}%</div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card mb-6">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">🔍 Detalles diarios</h3>
                            <div className="grid gap-3">
                                {integratedCalendar.days?.slice(0, 7).map((day, idx) => (
                                    <div key={idx} style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        background: day.plantable_seeds > 0 ? '#f0fdf4' : '#fafafa'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                    {weekdayMap[day.day_name] || day.day_name} {day.day}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {day.date}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                                                {translateLunarPhase(day.lunar?.phase)}
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'white',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            fontSize: '12px'
                                        }}>
                                            <div>🌙 Iluminacion: <strong>{Math.round(day.lunar?.illumination || 0)}%</strong></div>
                                            {typeof day.weather?.temperature === 'object' && (
                                                <div>🌡️ Temperatura: <strong>{day.weather.temperature.max_c}°C / {day.weather.temperature.min_c}°C</strong></div>
                                            )}
                                            {typeof day.weather?.precipitation === 'object' && (
                                                <div>🌧️ Lluvia: <strong>{day.weather.precipitation.mm}mm ({day.weather.precipitation.chance_of_rain}%)</strong></div>
                                            )}
                                            <div>💨 Viento: <strong>{day.weather?.wind_kph || 0}km/h</strong></div>
                                            <div>☀️ UV Index: <strong>{day.weather?.uv_index || 0}</strong></div>
                                        </div>

                                        {day.plantable_seeds > 0 && (
                                            <div style={{
                                                background: '#dcfce7',
                                                border: '1px solid #86efac',
                                                borderRadius: '4px',
                                                padding: '8px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#166534'
                                            }}>
                                                ✓ {day.plantable_seeds} semilla{day.plantable_seeds !== 1 ? 's' : ''} sembrable{day.plantable_seeds !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarLunaTiempo;
