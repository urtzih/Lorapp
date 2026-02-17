import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function Calendar() {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const currentMonth = new Date().getMonth() + 1;
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pendingOnly, setPendingOnly] = useState(true);

    useEffect(() => {
        loadYearSummary();
    }, [currentYear, pendingOnly]);

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const getSummaryLabel = () => (pendingOnly ? 'Siembras pendientes' : 'Siembras totales');

    const getStatusBadgeLabel = () => (pendingOnly ? 'Pendientes' : 'Totales');

    const getSeasonStyles = (month) => {
        if ([12, 1, 2].includes(month)) {
            return { label: 'Invierno', color: '#2563eb', bg: '#e0f2fe' };
        }
        if ([3, 4, 5].includes(month)) {
            return { label: 'Primavera', color: '#16a34a', bg: '#dcfce7' };
        }
        if ([6, 7, 8].includes(month)) {
            return { label: 'Verano', color: '#ea580c', bg: '#ffedd5' };
        }
        return { label: 'Otono', color: '#7c3aed', bg: '#ede9fe' };
    };

    const loadYearSummary = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await calendarAPI.getYearSummary({
                year: currentYear,
                pending_only: pendingOnly
            });
            const data = response.data;
            setMonths(data?.months || []);
        } catch (err) {
            setError('No se pudo cargar el resumen del calendario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">📅 Calendario Agrícola</h1>
                <p className="calendar-header__description text-gray">
                    {getSummaryLabel()} por mes
                </p>
            </div>

            {/* Year Navigation */}
            <div className="calendar-nav">
                <button
                    onClick={() => setCurrentYear(currentYear - 1)}
                    className="calendar-nav__btn btn btn-secondary"
                >
                    ←
                </button>
                <h3 className="calendar-nav__title">{currentYear}</h3>
                <button
                    onClick={() => setCurrentYear(currentYear + 1)}
                    className="calendar-nav__btn btn btn-secondary"
                >
                    →
                </button>
            </div>

            {/* Quick Links */}
            <div className="tabs-container mb-4">
                <Link to="/calendar/luna-tiempo" className="tab-button">
                    <span className="tab-icon">🌙</span>
                    <span className="tab-label">Luna y tiempo</span>
                </Link>
            </div>

            <Link
                to="/calendar/luna-tiempo"
                className="card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    color: '#ffffff',
                    textDecoration: 'none'
                }}
            >
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                        🌙 Ver calendario completo de luna y tiempo
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.85 }}>
                        Fases lunares, clima y detalles diarios
                    </div>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>→</span>
            </Link>

            {/* Filters */}
            <div className="card mb-6" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <input
                            type="checkbox"
                            checked={pendingOnly}
                            onChange={(event) => setPendingOnly(event.target.checked)}
                        />
                        Solo pendientes
                    </label>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center" style={{ minHeight: '320px', flexDirection: 'column', gap: '16px' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
                    <p className="text-gray" style={{ fontSize: '14px' }}>Cargando resumen anual...</p>
                </div>
            )}

            {!loading && error && (
                <div className="empty-state">
                    <h3>📅 {error}</h3>
                    <button onClick={loadYearSummary} className="btn btn-primary mt-4">
                        🔄 Reintentar
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="grid gap-3">
                    {months.map((item) => (
                        <Link
                            key={item.month}
                            to={`/calendar/mes/${currentYear}/${item.month}`}
                            className="card"
                            style={{
                                display: 'block',
                                padding: '12px',
                                textDecoration: 'none',
                                border: item.month === currentMonth ? '2px solid #16a34a' : '1px solid transparent',
                                background: item.month === currentMonth ? '#f0fdf4' : undefined
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                <div>
                                    <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>
                                        {monthNames[item.month - 1]}
                                    </h4>
                                    <p className="text-gray" style={{ fontSize: '12px' }}>
                                        {getSummaryLabel()}
                                    </p>
                                    {item.month === currentMonth && (
                                        <span style={{
                                            display: 'inline-block',
                                            marginTop: '6px',
                                            background: '#16a34a',
                                            color: '#ffffff',
                                            borderRadius: '999px',
                                            padding: '2px 8px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>
                                            Mes actual
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                    <span style={{
                                        background: getSeasonStyles(item.month).bg,
                                        color: getSeasonStyles(item.month).color,
                                        borderRadius: '999px',
                                        padding: '3px 8px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {getSeasonStyles(item.month).label}
                                    </span>
                                    <span style={{
                                        background: '#e5e7eb',
                                        color: '#374151',
                                        borderRadius: '999px',
                                        padding: '3px 8px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {getStatusBadgeLabel()}
                                    </span>
                                    <div style={{
                                        background: '#dcfce7',
                                        color: '#166534',
                                        borderRadius: '999px',
                                        padding: '6px 12px',
                                        fontWeight: '700'
                                    }}>
                                        {item.total}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Calendar;
