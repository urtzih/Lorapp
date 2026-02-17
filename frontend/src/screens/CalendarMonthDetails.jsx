import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function CalendarMonthDetails() {
    const { year, month } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tasks, setTasks] = useState({ planting: [] });

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const numericMonth = Number(month);
    const numericYear = Number(year);

    useEffect(() => {
        loadMonth();
    }, [numericYear, numericMonth]);

    const loadMonth = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await calendarAPI.getMonthly(numericMonth, numericYear);
            setTasks(response.data?.tasks || { planting: [] });
        } catch (err) {
            setError('No se pudo cargar el detalle del mes.');
        } finally {
            setLoading(false);
        }
    };

    const grouped = useMemo(() => {
        const groups = {};
        tasks.planting?.forEach((item) => {
            const key = item.especie || item.seed_name || 'Sin especie';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });
        return Object.keys(groups)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name, items: groups[name] }));
    }, [tasks]);

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">📅 {monthNames[numericMonth - 1]} {numericYear}</h1>
                <p className="calendar-header__description text-gray">
                    Detalle de siembras del mes agrupadas por especie
                </p>
            </div>

            <div className="tabs-container mb-4">
                <Link to="/calendar" className="tab-button">
                    <span className="tab-icon">←</span>
                    <span className="tab-label">Volver al resumen</span>
                </Link>
            </div>

            {loading && (
                <div className="flex justify-center items-center" style={{ minHeight: '240px', flexDirection: 'column', gap: '12px' }}>
                    <div className="spinner"></div>
                    <p className="text-gray" style={{ fontSize: '14px' }}>Cargando detalle del mes...</p>
                </div>
            )}

            {!loading && error && (
                <div className="empty-state">
                    <h3>📅 {error}</h3>
                    <button onClick={loadMonth} className="btn btn-primary mt-4">
                        🔄 Reintentar
                    </button>
                </div>
            )}

            {!loading && !error && grouped.length === 0 && (
                <div className="empty-state">
                    <h3>Sin siembras</h3>
                    <p className="text-gray">No hay variedades para plantar este mes</p>
                </div>
            )}

            {!loading && !error && grouped.length > 0 && (
                <div className="grid gap-3">
                    {grouped.map((group) => (
                        <div key={group.name} className="card" style={{ padding: '12px' }}>
                            <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>🌱 {group.name}</h4>
                            <div className="grid gap-2">
                                {group.items.map((item, index) => (
                                    <div key={`${group.name}-${index}`} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 10px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                                            {item.variety || item.seed_name}
                                        </div>
                                        <span style={{
                                            fontSize: '11px',
                                            background: item.type === 'indoor' ? '#f3e8ff' : '#dcfce7',
                                            color: item.type === 'indoor' ? '#6d28d9' : '#166534',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontWeight: '600'
                                        }}>
                                            {item.type === 'indoor' ? 'Interior' : 'Exterior'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CalendarMonthDetails;
