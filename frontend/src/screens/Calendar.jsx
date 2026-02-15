import { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function Calendar() {
    const [activeTab, setActiveTab] = useState('monthly');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [monthlyData, setMonthlyData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [upcomingTransplants, setUpcomingTransplants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [currentMonth, currentYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [monthly, recs, transplants] = await Promise.all([
                calendarAPI.getMonthly(currentMonth, currentYear),
                calendarAPI.getRecommendations(),
                calendarAPI.getUpcomingTransplants(7)
            ]);

            setMonthlyData(monthly.data);
            setRecommendations(recs.data);
            setUpcomingTransplants(transplants.data);
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
            {activeTab === 'monthly' && monthlyData && (
                <div>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="stat-card">
                            <div className="stat-label">Siembras</div>
                            <div className="stat-value">{monthlyData.summary?.total_planting || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Trasplantes</div>
                            <div className="stat-value">{monthlyData.summary?.total_transplanting || 0}</div>
                        </div>
                    </div>

                    {/* Planting Tasks */}
                    {monthlyData.tasks?.planting?.length > 0 && (
                        <div className="tasks-section mb-6">
                            <h3 className="tasks-title">Siembras este mes</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.planting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="planting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transplanting Tasks */}
                    {monthlyData.tasks?.transplanting?.length > 0 && (
                        <div className="tasks-section mb-6">
                            <h3 className="tasks-title">Trasplantes programados</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.transplanting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="transplanting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Harvesting Tasks */}
                    {monthlyData.tasks?.harvesting?.length > 0 && (
                        <div className="tasks-section mb-6">
                            <h3 className="tasks-title">Cosechas esperadas</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.harvesting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="harvesting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {Object.values(monthlyData.tasks || {}).every(arr => arr.length === 0) && (
                        <div className="empty-state">
                            <h3>Sin tareas este mes</h3>
                            <p className="text-gray">No hay actividades programadas para {monthNames[currentMonth - 1]}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content - Recommendations View */}
            {activeTab === 'recommendations' && (
                <div>
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
                                                    <span className="badge badge-info">Interior</span>
                                                )}
                                                {rec.can_plant_outdoor && (
                                                    <span className="badge badge-success">Exterior</span>
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
                    {upcomingTransplants.length > 0 ? (
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
                    ) : (
                        <div className="empty-state">
                            <h3>¡Todo al día!</h3>
                            <p className="text-gray">No hay trasplantes programados para los próximos días</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Calendar;
