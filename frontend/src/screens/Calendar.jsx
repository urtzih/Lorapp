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
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [loadingTransplants, setLoadingTransplants] = useState(false);

    useEffect(() => {
        loadCalendar();
        loadRecommendations();
        loadTransplants();
    }, [currentMonth, currentYear]);

    // Carga el calendario principal (más rápido - solo BBDD)
    const loadCalendar = async () => {
        setLoading(true);
        try {
            console.log('[Calendar] Loading calendar for:', currentYear, currentMonth);
            const response = await integratedCalendarAPI.getMonth(currentYear, currentMonth);
            const calendarData = response.data; // axios devuelve response.data
            console.log('[Calendar] Calendar data received:', calendarData);
            console.log('[Calendar] Days count:', calendarData.days?.length);
            setIntegratedCalendar(calendarData);
        } catch (error) {
            console.error('[Calendar] Error loading calendar:', error);
            console.error('[Calendar] Error details:', error.response?.data);
            setIntegratedCalendar(null);
        } finally {
            setLoading(false);
        }
    };

    // Carga recomendaciones de forma independiente
    const loadRecommendations = async () => {
        setLoadingRecommendations(true);
        try {
            const response = await calendarAPI.getRecommendations();
            const recs = response.data;
            console.log('[Calendar] Recommendations loaded:', recs);
            setRecommendations(recs?.recommendations || recs?.data || recs || []);
        } catch (error) {
            console.warn('[Calendar] Could not load recommendations:', error);
            setRecommendations([]);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    // Carga trasplantes de forma independiente
    const loadTransplants = async () => {
        setLoadingTransplants(true);
        try {
            const response = await calendarAPI.getUpcomingTransplants(7);
            const transplants = response.data;
            console.log('[Calendar] Transplants loaded:', transplants);
            setUpcomingTransplants(transplants || []);
        } catch (error) {
            console.warn('[Calendar] Could not load transplants:', error);
            setUpcomingTransplants([]);
        } finally {
            setLoadingTransplants(false);
        }
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const TaskCard = ({ task, type }) => {
        const typeIcons = {
            planting: '🌱',
            indoor: '🏠',
            outdoor: '🌾',
            transplanting: '🌳',
            harvesting: '🥕',
            reminders: '📌'
        };

        const typeLabels = {
            planting: 'Siembra',
            indoor: 'Interior',
            outdoor: 'Exterior',
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
                    {/* Icon with Type Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                    }}>
                        <span style={{fontSize: '24px'}}>{typeIcons[task.type] || typeIcons[type]}</span>
                        <span className="badge" style={{
                            background: type === 'planting' ? '#dcfce7' : type === 'harvesting' ? '#fef3c7' : '#dbeafe',
                            color: type === 'planting' ? '#166534' : type === 'harvesting' ? '#92400e' : '#0c4a6e',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}>
                            {typeLabels[task.type] || typeLabels[type]}
                        </span>
                    </div>

                    <div className="calendar-task-card__details">
                        <h4 className="calendar-task-card__title" style={{marginBottom: '4px'}}>
                            {task.especie || task.seed_name}
                        </h4>
                        {task.variety && (
                            <p style={{
                                fontSize: '12px',
                                color: '#4b5563',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                {task.variety}
                            </p>
                        )}
                        {task.description && (
                            <p className="calendar-task-card__description text-gray text-sm">
                                {task.description}
                            </p>
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

            {/* Loading State for Monthly */}
            {activeTab === 'monthly' && loading && (
                <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
                </div>
            )}

            {/* Content - Monthly View */}
            {activeTab === 'monthly' && !loading && integratedCalendar && (
                <div>
                    {/* Location and Period Info */}
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

                    {/* Lunar Phases Section - Prominent */}
                    <div className="card mb-6" style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white'
                    }}>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">🌙 Fases Lunares</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                                gap: '12px'
                            }}>
                                {integratedCalendar.days
                                    ?.filter((day, idx, arr) => 
                                        idx === 0 || day.lunar?.phase !== arr[idx-1]?.lunar?.phase
                                    )
                                    .map((day, idx) => (
                                        <div key={idx} style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{
                                                fontSize: '32px',
                                                marginBottom: '4px'
                                            }}>
                                                {day.lunar?.phase === 'new_moon' && '🌑'}
                                                {day.lunar?.phase === 'waxing_crescent' && '🌒'}
                                                {day.lunar?.phase === 'first_quarter' && '🌓'}
                                                {day.lunar?.phase === 'waxing_gibbous' && '🌔'}
                                                {day.lunar?.phase === 'full_moon' && '🌕'}
                                                {day.lunar?.phase === 'waning_gibbous' && '🌖'}
                                                {day.lunar?.phase === 'last_quarter' && '🌗'}
                                                {day.lunar?.phase === 'waning_crescent' && '🌘'}
                                                {day.lunar?.phase === 'Creciente' && '🌒'}
                                                {day.lunar?.phase === 'Llena' && '🌕'}
                                                {day.lunar?.phase === 'Menguante' && '🌖'}
                                                {day.lunar?.phase === 'Nueva' && '🌑'}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                marginBottom: '4px'
                                            }}>
                                                {day.lunar?.phase}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                opacity: '0.8'
                                            }}>
                                                Día {day.day}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="card mb-6">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">📅 Calendario del Mes</h3>
                            <div className="calendar-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '6px'
                            }}>
                                {/* Day headers */}
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'].map(day => (
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
                                
                                {/* Calendar days */}
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
                                        {/* Day number */}
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            marginBottom: '3px',
                                            color: '#6b7280'
                                        }}>
                                            {day.day}
                                        </div>

                                        {/* Lunar phase indicator */}
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
                                            {day.lunar.phase} {Math.round(day.lunar.illumination)}%
                                        </div>

                                        {/* Weather info */}
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
                    {(!integratedCalendar.days || integratedCalendar.days.length === 0) && (
                        <div className="empty-state">
                            <h3>Sin datos para este mes</h3>
                            <p className="text-gray">No hay información disponible para {monthNames[currentMonth - 1]}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state when calendar fails to load */}
            {activeTab === 'monthly' && !loading && !integratedCalendar && (
                <div className="empty-state">
                    <h3>📅 No se pudo cargar el calendario</h3>
                    <p className="text-gray">Intenta refrescar la página o selecciona otro mes</p>
                    <button 
                        onClick={() => loadCalendar()} 
                        className="btn btn-primary mt-4"
                    >
                        🔄 Reintentar
                    </button>
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
                                        🌙 {integratedCalendar.days[0].lunar?.phase || 'Cargando...'}
                                    </h3>
                                    <div className="text-2xl">
                                        {integratedCalendar.days[0].lunar?.illumination ? Math.round(integratedCalendar.days[0].lunar.illumination) : 0}%
                                    </div>
                                </div>
                                <p className="text-sm opacity-90">
                                    Fase lunar actual para {integratedCalendar.location || 'tu ubicación'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <h3 className="tasks-title mb-4">¿Qué puedo sembrar este mes?</h3>
                    
                    {/* Loading state for recommendations */}
                    {loadingRecommendations && (
                        <div className="flex justify-center items-center" style={{ minHeight: '200px' }}>
                            <div className="spinner"></div>
                        </div>
                    )}
                    
                    {!loadingRecommendations && recommendations.length > 0 ? (
                        <div className="grid gap-3">
                            {(() => {
                                // Group by especie (seed_name) and sort alphabetically
                                const grouped = {};
                                recommendations.forEach(rec => {
                                    if (!grouped[rec.seed_name]) {
                                        grouped[rec.seed_name] = [];
                                    }
                                    grouped[rec.seed_name].push(rec);
                                });

                                // Sort species alphabetically
                                const sortedSpecies = Object.keys(grouped).sort();

                                return sortedSpecies.map((speciesName) => (
                                    <div key={speciesName}>
                                        {/* Species header */}
                                        <h4 style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            marginBottom: '8px',
                                            marginTop: '12px',
                                            paddingBottom: '8px',
                                            borderBottom: '2px solid #e5e7eb'
                                        }}>
                                            🌱 {speciesName}
                                        </h4>
                                        {/* Varieties for this species */}
                                        <div className="grid gap-3 mb-4">
                                            {grouped[speciesName].map((rec, index) => (
                                                <div 
                                                    key={`${speciesName}-${index}`} 
                                                    className="calendar-recommendation-card card"
                                                >
                                                    <div className="calendar-recommendation-card__content">
                                                        <div>
                                                            {rec.variety && (
                                                                <p className="calendar-recommendation-card__variety text-gray text-sm mb-2">Variedad: {rec.variety}</p>
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
                                    </div>
                                ));
                            })()}
                        </div>
                    ) : !loadingRecommendations ? (
                        <div className="empty-state">
                            <h3>Sin recomendaciones</h3>
                            <p className="text-gray">Añade semillas a tu inventario para recibir recomendaciones</p>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Content - Upcoming Transplants */}
            {activeTab === 'upcoming' && (
                <div>
                    <h3 className="tasks-title mb-4">Próximos 7 días</h3>
                    
                    {/* Loading states */}
                    {(loading || loadingTransplants) && (
                        <div className="flex justify-center items-center" style={{ minHeight: '200px' }}>
                            <div className="spinner"></div>
                        </div>
                    )}
                    
                    {/* Show seeds plantable in the next week */}
                    {!loading && integratedCalendar && integratedCalendar.days && (
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
                    {!loadingTransplants && upcomingTransplants.length > 0 ? (
                        <>
                            <h3 className="tasks-title mb-4">Trasplantes Pendientes</h3>
                            <div className="grid gap-3">
                                {(() => {
                                    // Group by especie (seed_name) and sort alphabetically
                                    const grouped = {};
                                    upcomingTransplants.forEach(item => {
                                        if (!grouped[item.seed_name]) {
                                            grouped[item.seed_name] = [];
                                        }
                                        grouped[item.seed_name].push(item);
                                    });

                                    // Sort species alphabetically
                                    const sortedSpecies = Object.keys(grouped).sort();

                                    return sortedSpecies.map((speciesName) => (
                                        <div key={speciesName}>
                                            {/* Species header */}
                                            <h4 style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#2d3748',
                                                marginBottom: '8px',
                                                marginTop: '12px',
                                                paddingBottom: '8px',
                                                borderBottom: '2px solid #e5e7eb'
                                            }}>
                                                🌾 {speciesName}
                                            </h4>
                                            {/* Items for this species */}
                                            <div className="grid gap-3 mb-4">
                                                {grouped[speciesName].map((item, index) => (
                                                    <div 
                                                        key={`${speciesName}-${index}`}
                                                        className="calendar-upcoming-card card"
                                                    >
                                                        <div className="calendar-upcoming-card__content">
                                                            <div>
                                                                {item.variety && (
                                                                    <p className="calendar-upcoming-card__variety text-gray text-sm">Variedad: {item.variety}</p>
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
                                        </div>
                                    ));
                                })()}
                            </div>
                        </>
                    ) : null}

                    {/* Empty state */}
                    {!loading && !loadingTransplants && 
                     (!integratedCalendar || !integratedCalendar.days?.slice(0, 7).some(d => d.plantable_seeds > 0)) && 
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
