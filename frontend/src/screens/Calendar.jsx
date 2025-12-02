import { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';
import { format } from 'date-fns';

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
            planting: '🌱',
            transplanting: '🌿',
            harvesting: '🥕',
            reminders: '⏰'
        };

        const colors = {
            planting: '#ecfdf5',
            transplanting: '#fef3c7',
            harvesting: '#fee2e2',
            reminders: '#e0f2fe'
        };

        return (
            <div className="card" style={{ backgroundColor: colors[type], borderLeft: `4px solid var(--color-primary)` }}>
                <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.5rem' }}>{icons[type]}</span>
                    <div style={{ flex: 1 }}>
                        <h4 className="mb-1">{task.seed_name}</h4>
                        <p className="text-sm text-gray">{task.description || task.type}</p>
                        {task.variety && <span className="badge badge-primary mt-2">{task.variety}</span>}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="container section flex justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="container section">
            <h1 className="mb-6">📅 Calendario Agrícola</h1>

            {/* Month Navigation */}
            <div className="card mb-6">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => {
                            if (currentMonth === 1) {
                                setCurrentMonth(12);
                                setCurrentYear(currentYear - 1);
                            } else {
                                setCurrentMonth(currentMonth - 1);
                            }
                        }}
                        className="btn btn-secondary"
                    >
                        ← Anterior
                    </button>

                    <h2>{monthNames[currentMonth - 1]} {currentYear}</h2>

                    <button
                        onClick={() => {
                            if (currentMonth === 12) {
                                setCurrentMonth(1);
                                setCurrentYear(currentYear + 1);
                            } else {
                                setCurrentMonth(currentMonth + 1);
                            }
                        }}
                        className="btn btn-secondary"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6" style={{ overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`btn ${activeTab === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    📅 Vista Mensual
                </button>
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`btn ${activeTab === 'recommendations' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    💡 Recomendaciones
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    🌿 Próximos Trasplantes
                </button>
            </div>

            {/* Content */}
            {activeTab === 'monthly' && monthlyData && (
                <div>
                    {/* Summary */}
                    <div className="grid grid-2 gap-4 mb-6">
                        <div className="card text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</div>
                            <h3>{monthlyData.summary?.total_planting || 0}</h3>
                            <p className="text-gray">Siembras</p>
                        </div>
                        <div className="card text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
                            <h3>{monthlyData.summary?.total_transplanting || 0}</h3>
                            <p className="text-gray">Trasplantes</p>
                        </div>
                    </div>

                    {/* Tasks */}
                    {monthlyData.tasks?.planting?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-4">🌱 Siembras este mes</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.planting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="planting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {monthlyData.tasks?.transplanting?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-4">🌿 Trasplantes programados</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.transplanting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="transplanting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {monthlyData.tasks?.harvesting?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-4">🥕 Cosechas esperadas</h3>
                            <div className="grid gap-3">
                                {monthlyData.tasks.harvesting.map((task, index) => (
                                    <TaskCard key={index} task={task} type="harvesting" />
                                ))}
                            </div>
                        </div>
                    )}

                    {Object.values(monthlyData.tasks || {}).every(arr => arr.length === 0) && (
                        <div className="text-center" style={{ padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
                            <h3 className="mb-2">Sin tareas este mes</h3>
                            <p className="text-gray">No hay actividades programadas para {monthNames[currentMonth - 1]}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'recommendations' && (
                <div>
                    <h3 className="mb-4">💡 ¿Qué puedo sembrar este mes?</h3>
                    {recommendations.length > 0 ? (
                        <div className="grid gap-3">
                            {recommendations.map((rec, index) => (
                                <div key={index} className="card" style={{ backgroundColor: '#ecfdf5' }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="mb-2">{rec.seed_name}</h4>
                                            {rec.variety && <p className="text-sm text-gray mb-2">{rec.variety}</p>}
                                            <div className="flex gap-2">
                                                {rec.can_plant_indoor && <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>Interior</span>}
                                                {rec.can_plant_outdoor && <span className="badge badge-success">Exterior</span>}
                                            </div>
                                        </div>
                                        {rec.germination_days && (
                                            <div className="text-center">
                                                <div className="text-sm text-gray">Germinación</div>
                                                <div className="font-semibold text-primary">{rec.germination_days} días</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center" style={{ padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
                            <h3 className="mb-2">Sin recomendaciones</h3>
                            <p className="text-gray">Añade semillas a tu inventario para recibir recomendaciones</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'upcoming' && (
                <div>
                    <h3 className="mb-4">🌿 Próximos 7 días</h3>
                    {upcomingTransplants.length > 0 ? (
                        <div className="grid gap-3">
                            {upcomingTransplants.map((item, index) => (
                                <div key={index} className="card" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid var(--color-accent)' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="mb-1">{item.seed_name}</h4>
                                            {item.variety && <p className="text-sm text-gray">{item.variety}</p>}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-gray">En</div>
                                            <div className="font-bold text-accent">{item.days_until} día{item.days_until !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center" style={{ padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                            <h3 className="mb-2">¡Todo al día!</h3>
                            <p className="text-gray">No hay trasplantes programados para los próximos días</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Calendar;
