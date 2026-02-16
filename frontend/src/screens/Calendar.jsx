import { useState, useEffect } from 'react';
import { integratedCalendarAPI, calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function Calendar() {
    const [activeTab, setActiveTab] = useState('monthly');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [integratedCalendar, setIntegratedCalendar] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [upcomingTransplants, setUpcomingTransplants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [currentMonth, currentYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load integrated calendar (lunar + weather data)
            const calendarData = await integratedCalendarAPI.getMonth(currentYear, currentMonth);
            setIntegratedCalendar(calendarData);
            
            // Load recommendations and upcoming transplants if available
            try {
                const [recs, transplants] = await Promise.all([
                    calendarAPI.getRecommendations().catch(() => ({ data: [] })),
                    calendarAPI.getUpcomingTransplants(7).catch(() => ({ data: [] }))
                ]);
                
                setRecommendations(recs?.data?.recommendations || recs?.data || []);
                setUpcomingTransplants(transplants?.data || []);
            } catch (error) {
                console.warn('Could not load recommendations/transplants:', error);
            }
        } catch (error) {
            console.error('Error loading calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const TaskCard = ({ task, type }) => {
        const icons = {
            planting: 'Siembra',
            transplanting: 'Trasplante',
            harvesting: 'Cosecha',
            reminders: 'Recordatorio'
        };

        const cardClasses = {
            planting: 'calendar-task-card--planting',
            transplanting: 'calendar-task-card--transplanting',
            harvesting: 'calendar-task-card--harvesting',
            reminders: 'calendar-task-card--reminders'
        };

        return (
            <div className={`calendar-task-card card ${cardClasses[type]}`}>
                <div className="calendar-task-card__content">
                    <div className="calendar-task-card__icon">{icons[type]}</div>
                    <div className="calendar-task-card__details">
                        <h4 className="calendar-task-card__title">{task.seed_name}</h4>
                        <p className="calendar-task-card__description text-gray text-sm">{task.description || task.type}</p>
                        {task.variety && (
                            <span className="calendar-task-card__variety badge badge-primary">
                                {task.variety}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="calendar-container">
                <div className="calendar-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">📅 Calendario Agrícola</h1>
                <p className="calendar-header__description text-gray">Planifica tus siembras y trasplantes</p>
            </div>

            {/* Month Navigation */}
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

            {/* Tabs - Mobile optimized */}
            <div className="tabs-container mb-6">
                {[
                    { id: 'monthly', label: 'Mes', icon: '📅' },
                    { id: 'recommendations', label: 'Ideas', icon: '💡' },
                    { id: 'upcoming', label: 'Próximos', icon: '🌿' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content - Monthly View */}
            {activeTab === 'monthly' && integratedCalendar && (
                <div>
                    {/* Location and Period Info */}
                    <div className="card mb-6" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                    }}>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">📍 {integratedCalendar.location}</h3>
                            <p className="text-sm opacity-90">
                                Lat: {integratedCalendar.coordinates.latitude.toFixed(2)}° | 
                                Lon: {integratedCalendar.coordinates.longitude.toFixed(2)}°
                            </p>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="stat-card">
                            <div className="stat-label">Días</div>
                            <div className="stat-value">{integratedCalendar.days?.length || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Sembrables</div>
                            <div className="stat-value">{integratedCalendar.days?.reduce((sum, d) => sum + (d.plantable_seeds || 0), 0) || 0}</div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="card mb-6">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">📅 Calendario del Mes</h3>
                            <div className="calendar-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '8px'
                            }}>
                                {/* Day headers */}
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map(day => (
                                    <div key={day} style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        padding: '8px',
                                        borderBottom: '2px solid #e5e7eb'
                                    }}>
                                        {day}
                                    </div>
                                ))}
                                
                                {/* Calendar days */}
                                {integratedCalendar.days?.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className="calendar-day-card"
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            minHeight: '100px',
                                            background: day.plantable_seeds > 0 ? '#f0fdf4' : '#f9fafb'
                                        }}
                                    >
                                        {/* Day number */}
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            marginBottom: '4px',
                                            color: '#6b7280'
                                        }}>
                                            {day.day}
                                        </div>

                                        {/* Lunar phase indicator */}
                                        <div style={{
                                            fontSize: '10px',
                                            background: '#ede9fe',
                                            color: '#6d28d9',
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                            marginBottom: '4px',
                                            fontWeight: '500'
                                        }}>
                                            {day.lunar.phase} ({Math.round(day.lunar.illumination)}%)
                                        </div>

                                        {/* Weather info */}
                                        <div style={{
                                            fontSize: '9px',
                                            color: '#6b7280',
                                            marginBottom: '4px',
                                            lineHeight: '1.3'
                                        }}>
                                            {typeof day.weather?.temperature === 'object' ? (
                                                <>🌡️ {day.weather.temperature.max_c}°/</>
                                            ) : (
                                                <>°C|</>
                                            )}
                                            🌧️ {typeof day.weather?.precipitation === 'object' ? day.weather.precipitation.chance_of_rain : 0}%
                                        </div>

                                        {/* Plantable indicator */}
                                        {day.plantable_seeds > 0 && (
                                            <div style={{
                                                fontSize: '10px',
                                                background: '#dcfce7',
                                                color: '#166534',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>
                                                ✓ {day.plantable_seeds} semilla{day.plantable_seeds !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Daily Details View */}
                    <div className="card mb-6">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">🔍 Detalles Diarios</h3>
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
                                                    {day.day_name} {day.day}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {day.date}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                                                {day.lunar.phase}
                                            </div>
                                        </div>

                                        <div style={{ 
                                            background: 'white',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            fontSize: '12px'
                                        }}>
                                            <div>🌙 Iluminación: <strong>{Math.round(day.lunar.illumination)}%</strong></div>
                                            {typeof day.weather?.temperature === 'object' && (
                                                <div>🌡️ Temperatura: <strong>{day.weather.temperature.max_c}°C / {day.weather.temperature.min_c}°C</strong></div>
                                            )}
                                            {typeof day.weather?.precipitation === 'object' && (
                                                <>
                                                    <div>🌧️ Lluvia: <strong>{day.weather.precipitation.mm}mm ({day.weather.precipitation.chance_of_rain}%)</strong></div>
                                                </>
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

                    {/* Empty State */}
                    {!integratedCalendar.days || integratedCalendar.days.length === 0 && (
                        <div className="empty-state">
                            <h3>Sin datos para este mes</h3>
                            <p className="text-gray">No hay información disponible para {monthNames[currentMonth - 1]}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content - Recommendations View */}
            {activeTab === 'recommendations' && (
                <div>
                    {/* Current Lunar Phase Info */}
                    {integratedCalendar && integratedCalendar.days && integratedCalendar.days.length > 0 && (
                        <div className="card mb-6" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold">
                                        🌙 {integratedCalendar.days[0].lunar.phase}
                                    </h3>
                                    <div className="text-2xl">
                                        {Math.round(integratedCalendar.days[0].lunar.illumination)}%
                                    </div>
                                </div>
                                <p className="text-sm opacity-90">
                                    Fase lunar actual para {integratedCalendar.location}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <h3 className="tasks-title mb-4">¿Qué puedo sembrar este mes?</h3>
                    {recommendations.length > 0 ? (
                        <div className="grid gap-3">
                            {recommendations.map((rec, index) => (
                                <div 
                                    key={index} 
                                    className="calendar-recommendation-card card"
                                >
                                    <div className="calendar-recommendation-card__content">
                                        <div>
                                            <h4 className="calendar-recommendation-card__title">{rec.seed_name}</h4>
                                            {rec.variety && (
                                                <p className="calendar-recommendation-card__variety text-gray text-sm mb-2">{rec.variety}</p>
                                            )}
                                            <div className="calendar-recommendation-card__badges">
                                                {rec.can_plant_indoor && (
                                                    <span className="badge badge-info">🏠 Interior</span>
                                                )}
                                                {rec.can_plant_outdoor && (
                                                    <span className="badge badge-success">🌱 Exterior</span>
                                                )}
                                                {rec.cantidad_disponible > 0 && (
                                                    <span className="badge badge-secondary">
                                                        {rec.cantidad_disponible} disponible{rec.cantidad_disponible !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {rec.germination_days && (
                                            <div className="calendar-recommendation-card__germination">
                                                <div className="calendar-recommendation-card__germination-label text-gray text-xs">Germinación</div>
                                                <div className="calendar-recommendation-card__germination-days">{rec.germination_days}d</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>Sin recomendaciones</h3>
                            <p className="text-gray">Añade semillas a tu inventario para recibir recomendaciones</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content - Upcoming Transplants */}
            {activeTab === 'upcoming' && (
                <div>
                    <h3 className="tasks-title mb-4">Próximos 7 días</h3>
                    
                    {/* Show seeds plantable in the next week */}
                    {integratedCalendar && integratedCalendar.days && (
                        <div>
                            {integratedCalendar.days.slice(0, 7).some(d => d.plantable_seeds > 0) ? (
                                <div className="grid gap-3 mb-6">
                                    {integratedCalendar.days.slice(0, 7).map((day, idx) => 
                                        day.plantable_seeds > 0 ? (
                                            <div key={idx} className="calendar-upcoming-card card" style={{
                                                background: '#f0fdf4',
                                                borderLeft: '4px solid #22c55e'
                                            }}>
                                                <div style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                                {day.day_name} {day.day}
                                                            </h4>
                                                            <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                {day.plantable_seeds} semilla{day.plantable_seeds !== 1 ? 's' : ''} sembrable{day.plantable_seeds !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                                                {Math.round(day.lunar.illumination)}% 🌙
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>
                                                                Óptimo
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Upcoming transplants from inventory */}
                    {upcomingTransplants.length > 0 ? (
                        <>
                            <h3 className="tasks-title mb-4">Trasplantes Pendientes</h3>
                            <div className="grid gap-3">
                                {upcomingTransplants.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className="calendar-upcoming-card card"
                                    >
                                        <div className="calendar-upcoming-card__content">
                                            <div>
                                                <h4 className="calendar-upcoming-card__title">{item.seed_name}</h4>
                                                {item.variety && (
                                                    <p className="calendar-upcoming-card__variety text-gray text-sm">{item.variety}</p>
                                                )}
                                            </div>
                                            <div className="calendar-upcoming-card__days">
                                                <div className="calendar-upcoming-card__days-label text-gray text-xs">En</div>
                                                <div className="calendar-upcoming-card__days-count">{item.days_until}</div>
                                                <div className="calendar-upcoming-card__days-unit text-gray text-xs">día{item.days_until !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}

                    {/* Empty state */}
                    {(!integratedCalendar || !integratedCalendar.days?.slice(0, 7).some(d => d.plantable_seeds > 0)) && 
                     upcomingTransplants.length === 0 && (
                        <div className="empty-state">
                            <h3>¡Todo al día!</h3>
                            <p className="text-gray">No hay actividades programadas para los próximos 7 días</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Calendar;
