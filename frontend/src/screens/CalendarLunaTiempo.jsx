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
                <div className="shared-loading">
                    <div className="spinner shared-loading__spinner"></div>
                    <p className="text-gray shared-loading__text">Cargando luna y tiempo...</p>
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
                    <div className="card mb-6 calendar-location-card">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">📍 {integratedCalendar.location}</h3>
                            {integratedCalendar.coordinates && (
                                <p className="calendar-location-meta">
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

                    <div className="card mb-6 calendar-lunar-panel">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">🌙 Fases lunares</h3>
                            <div className="calendar-lunar-grid">
                                {integratedCalendar.days
                                    ?.filter((day, idx, arr) =>
                                        idx === 0 || day.lunar?.phase !== arr[idx - 1]?.lunar?.phase
                                    )
                                    .map((day, idx) => (
                                        <div key={idx} className="calendar-lunar-item">
                                            <div className="calendar-lunar-emoji">
                                                {getLunarPhaseEmoji(day.lunar?.phase)}
                                            </div>
                                            <div className="calendar-lunar-title">
                                                {translateLunarPhase(day.lunar?.phase)}
                                            </div>
                                            <div className="calendar-lunar-day">
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
                            <div className="calendar-grid calendar-grid--compact">
                                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
                                    <div key={day} className="calendar-weekday">
                                        {day}
                                    </div>
                                ))}

                                {integratedCalendar.days?.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={`calendar-day-card ${day.plantable_seeds > 0 ? 'calendar-day-card--plantable' : 'calendar-day-card--idle'}`}
                                    >
                                        <div className="calendar-day-card__date">
                                            {day.day}
                                        </div>

                                        <div className="calendar-day-card__lunar">
                                            {translateLunarPhase(day.lunar?.phase)} {Math.round(day.lunar?.illumination || 0)}%
                                        </div>

                                        <div className="calendar-day-card__weather">
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
                                    <div key={idx} className={`calendar-daily-card ${day.plantable_seeds > 0 ? 'calendar-daily-card--plantable' : ''}`}>
                                        <div className="calendar-daily-card__header">
                                            <div>
                                                <div className="calendar-daily-card__title">
                                                    {weekdayMap[day.day_name] || day.day_name} {day.day}
                                                </div>
                                                <div className="calendar-daily-card__date">
                                                    {day.date}
                                                </div>
                                            </div>
                                            <div className="calendar-daily-card__phase">
                                                {translateLunarPhase(day.lunar?.phase)}
                                            </div>
                                        </div>

                                        <div className="calendar-daily-card__stats">
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
                                            <div className="calendar-daily-card__plantable">
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
