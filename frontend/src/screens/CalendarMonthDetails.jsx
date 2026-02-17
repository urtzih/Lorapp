import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function CalendarMonthDetails() {
    const { year, month } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tasks, setTasks] = useState({ planting: [] });

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const shortMonthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const numericMonth = Number(month);
    const numericYear = Number(year);
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, idx) => currentYear - 2 + idx);

    const getPrevMonthLink = () => {
        if (numericMonth === 1) {
            return { year: numericYear - 1, month: 12 };
        }
        return { year: numericYear, month: numericMonth - 1 };
    };

    const getNextMonthLink = () => {
        if (numericMonth === 12) {
            return { year: numericYear + 1, month: 1 };
        }
        return { year: numericYear, month: numericMonth + 1 };
    };

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

    const renderMonthBadges = (months = []) => {
        if (!months || months.length === 0) {
            return <span className="calendar-month-badge is-empty">Sin meses</span>;
        }

        return months.map((monthNumber) => (
            <span
                key={monthNumber}
                className={`calendar-month-badge${monthNumber === numericMonth ? ' is-current' : ''}`}
            >
                {shortMonthNames[monthNumber - 1]}
            </span>
        ));
    };

    const getMonthProgress = (months = []) => {
        if (!months || months.length === 0) return null;
        const normalized = months.map((value) => Number(value));
        const index = normalized.indexOf(numericMonth);
        if (index === -1) {
            return { phase: 'off', label: 'Fuera de temporada' };
        }
        if (normalized.length === 1) {
            return { phase: 'full', label: 'Unico' };
        }
        const ratio = index / (normalized.length - 1);
        if (ratio < 0.34) return { phase: 'start', label: 'Inicio' };
        if (ratio < 0.67) return { phase: 'mid', label: 'Mitad' };
        return { phase: 'end', label: 'Final' };
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">📅 {monthNames[numericMonth - 1]} {numericYear}</h1>
                <p className="calendar-header__description text-gray">
                    Detalle de siembras del mes agrupadas por especie
                </p>
                <div className="calendar-header__actions">
                    <Link to="/calendar" className="calendar-back-link">
                        ← Volver al resumen
                    </Link>
                    <Link
                        to={`/calendar/mes/${currentYear}/${currentMonth}`}
                        className="calendar-today-chip"
                    >
                        Mes actual
                    </Link>
                </div>
            </div>

            <div className="calendar-month-nav">
                <Link
                    to={`/calendar/mes/${getPrevMonthLink().year}/${getPrevMonthLink().month}`}
                    className="calendar-month-nav__btn"
                >
                    ← Mes anterior
                </Link>
                <Link
                    to={`/calendar/mes/${getNextMonthLink().year}/${getNextMonthLink().month}`}
                    className="calendar-month-nav__btn"
                >
                    Mes siguiente →
                </Link>
            </div>

            <div className="card mb-4 calendar-month-controls">
                <div className="calendar-month-controls__row">
                    <label className="calendar-month-controls__label">
                        Mes
                        <select
                            className="input"
                            value={numericMonth}
                            onChange={(event) => {
                                const nextMonth = Number(event.target.value);
                                navigate(`/calendar/mes/${numericYear}/${nextMonth}`);
                            }}
                        >
                            {monthNames.map((name, index) => (
                                <option key={name} value={index + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="calendar-month-controls__label">
                        Ano
                        <select
                            className="input"
                            value={numericYear}
                            onChange={(event) => {
                                const nextYear = Number(event.target.value);
                                navigate(`/calendar/mes/${nextYear}/${numericMonth}`);
                            }}
                        >
                            {yearOptions.map((optionYear) => (
                                <option key={optionYear} value={optionYear}>
                                    {optionYear}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {loading && (
                <div className="shared-loading shared-loading--compact">
                    <div className="spinner shared-loading__spinner"></div>
                    <p className="text-gray shared-loading__text">Cargando detalle del mes...</p>
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
                        <div key={group.name} className="card calendar-month-group">
                            <h4 className="calendar-month-group__title">🌱 {group.name}</h4>
                            <div className="grid gap-2">
                                {group.items.map((item, index) => (
                                    <div key={`${group.name}-${index}`} className="calendar-month-item">
                                        <div className="calendar-month-item__name">
                                            {item.variety || item.seed_name}
                                        </div>
                                        <div className="calendar-month-item__badges">
                                            {item.planting_months?.length
                                                ? renderMonthBadges(item.planting_months)
                                                : (item.planting_months_total ? (
                                                    <span className="calendar-month-badge">
                                                        {item.planting_months_total} meses
                                                    </span>
                                                ) : null)
                                            }
                                            <span className={`calendar-type-badge ${item.type === 'indoor' ? 'calendar-type-badge--indoor' : 'calendar-type-badge--outdoor'}`}>
                                                {item.type === 'indoor' ? 'Interior' : 'Exterior'}
                                            </span>
                                        </div>
                                        {(() => {
                                            const progress = getMonthProgress(item.planting_months);
                                            if (!progress) return null;
                                            return (
                                                <div className={`calendar-progress calendar-progress--${progress.phase}`}>
                                                    <span className="calendar-progress__track">
                                                        <span className="calendar-progress__fill" />
                                                        <span className="calendar-progress__dot" />
                                                    </span>
                                                    <span className="calendar-progress__label">{progress.label}</span>
                                                </div>
                                            );
                                        })()}
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
