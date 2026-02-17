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
            return { label: 'Invierno', className: 'calendar-season calendar-season--winter' };
        }
        if ([3, 4, 5].includes(month)) {
            return { label: 'Primavera', className: 'calendar-season calendar-season--spring' };
        }
        if ([6, 7, 8].includes(month)) {
            return { label: 'Verano', className: 'calendar-season calendar-season--summer' };
        }
        return { label: 'Otono', className: 'calendar-season calendar-season--autumn' };
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

            <Link
                to="/calendar/luna-tiempo"
                className="card calendar-cta calendar-cta--dark"
            >
                <div>
                    <div className="calendar-cta__title">
                        🌙 Ver calendario completo de luna y tiempo
                    </div>
                    <div className="calendar-cta__subtitle">
                        Fases lunares, clima y detalles diarios
                    </div>
                </div>
                <span className="calendar-cta__arrow">→</span>
            </Link>

            {/* Filters */}
            <div className="card mb-6 calendar-filters-card">
                <div className="calendar-filters-row">
                    <label className="calendar-filters-label">
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
                <div className="shared-loading">
                    <div className="spinner shared-loading__spinner"></div>
                    <p className="text-gray shared-loading__text">Cargando resumen anual...</p>
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
                <>
                    <div className="grid gap-3">
                        {months.map((item) => (
                            <Link
                                key={item.month}
                                to={`/calendar/mes/${currentYear}/${item.month}`}
                                className={`card calendar-month-card ${item.month === currentMonth ? 'calendar-month-card--current' : ''}`}
                            >
                                <div className="calendar-month-card__row">
                                    <div>
                                        <h4 className="calendar-month-card__title">
                                            {monthNames[item.month - 1]}
                                        </h4>
                                        <p className="text-gray calendar-month-card__meta">
                                            {getSummaryLabel()}
                                        </p>
                                        {item.month === currentMonth && (
                                            <span className="calendar-current-badge">
                                                Mes actual
                                            </span>
                                        )}
                                    </div>
                                    <div className="calendar-month-card__badges">
                                        <div className={getSeasonStyles(item.month).className}>
                                            <span className="calendar-season__dot" aria-hidden="true"></span>
                                            {getSeasonStyles(item.month).label}
                                        </div>
                                        <span className="calendar-badge calendar-badge--status">
                                            {getStatusBadgeLabel()}
                                        </span>
                                        <div className="calendar-badge calendar-badge--total">
                                            {item.total}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <Link
                        to="/calendar/semillas"
                        className="card calendar-cta calendar-cta--light"
                    >
                        <div>
                            <div className="calendar-cta__title">
                                📋 Ver resumen ejecutivo de semillas
                            </div>
                            <div className="text-gray calendar-cta__subtitle">
                                Ordenadas por fecha de plantacion
                            </div>
                        </div>
                        <span className="calendar-cta__arrow">→</span>
                    </Link>
                </>
            )}

            {/* Year Navigation */}
            <div className="calendar-nav calendar-nav--year">
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
        </div>
    );
}

export default Calendar;
