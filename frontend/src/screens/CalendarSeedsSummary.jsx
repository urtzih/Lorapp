import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { calendarAPI } from '../services/api';
import '../styles/Calendar.css';

export function CalendarSeedsSummary() {
    const [seedSummary, setSeedSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadSeedSummary();
    }, []);

    const loadSeedSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await calendarAPI.getSeedSummary();
            setSeedSummary(response.data || []);
        } catch (err) {
            setError('No se pudo cargar el resumen de semillas.');
        } finally {
            setLoading(false);
        }
    };

    const shortMonthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const currentMonth = new Date().getMonth() + 1;

    const getMonthProgress = (months = []) => {
        if (!months || months.length === 0) return null;
        const index = months.indexOf(currentMonth);
        if (index === -1) return null;
        if (months.length === 1) {
            return { phase: 'full', label: 'Unico' };
        }
        const ratio = index / (months.length - 1);
        if (ratio < 0.34) return { phase: 'start', label: 'Inicio' };
        if (ratio < 0.67) return { phase: 'mid', label: 'Mitad' };
        return { phase: 'end', label: 'Final' };
    };

    const renderMonthBadges = (months = [], variant) => {
        if (!months || months.length === 0) {
            return <span className="calendar-month-badge is-empty">Sin meses</span>;
        }

        const variantClass = variant === 'outdoor' ? ' calendar-month-badge--outdoor' : '';

        return months.map((monthNumber) => (
            <span
                key={monthNumber}
                className={`calendar-month-badge${variantClass}${monthNumber === currentMonth ? ' is-current' : ''}`}
            >
                {shortMonthNames[monthNumber - 1]}
            </span>
        ));
    };

    const groupedSummary = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = query
            ? seedSummary.filter((seed) => {
                const especie = (seed.especie || '').toLowerCase();
                const variety = (seed.variety || '').toLowerCase();
                const name = (seed.seed_name || '').toLowerCase();
                return especie.includes(query) || variety.includes(query) || name.includes(query);
            })
            : seedSummary;

        const groups = {};
        filtered.forEach((seed) => {
            const key = seed.especie || 'Sin especie';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(seed);
        });

        return Object.keys(groups)
            .sort((a, b) => a.localeCompare(b))
            .map((especie) => ({
                especie,
                items: groups[especie].sort((a, b) => {
                    const varietyA = (a.variety || '').toLowerCase();
                    const varietyB = (b.variety || '').toLowerCase();
                    if (varietyA !== varietyB) return varietyA.localeCompare(varietyB);
                    const nameA = (a.seed_name || '').toLowerCase();
                    const nameB = (b.seed_name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                })
            }));
    }, [seedSummary, search]);

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h1 className="calendar-header__title">📋 Resumen de Semillas</h1>
                <p className="calendar-header__description text-gray">
                    Meses recomendados para plantar las semillas de tu inventario
                </p>
            </div>

            <div className="calendar-nav calendar-nav--start">
                <Link to="/calendar" className="btn btn-secondary">
                    ← Volver al calendario
                </Link>
            </div>

            {loading && (
                <div className="shared-loading">
                    <div className="spinner shared-loading__spinner"></div>
                    <p className="text-gray shared-loading__text">Cargando resumen...</p>
                </div>
            )}

            {!loading && error && (
                <div className="empty-state">
                    <h3>📋 {error}</h3>
                    <button onClick={loadSeedSummary} className="btn btn-primary mt-4">
                        🔄 Reintentar
                    </button>
                </div>
            )}

            {!loading && !error && groupedSummary.length === 0 && (
                <div className="empty-state">
                    <h3>🌱 No hay semillas para mostrar</h3>
                    <p className="text-gray">
                        {search ? 'Prueba con otra busqueda.' : 'Registra semillas en tu inventario para ver los meses de siembra.'}
                    </p>
                </div>
            )}

            {!loading && !error && groupedSummary.length > 0 && (
                <div className="shared-search">
                    <input
                        className="shared-search__input"
                        type="search"
                        placeholder="Buscar por especie, variedad o nombre comercial"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
            )}

            {!loading && !error && groupedSummary.length > 0 && (
                <div className="calendar-seeds-summary">
                    {groupedSummary.map((group) => (
                        <div key={group.especie} className="calendar-seeds-group">
                            <div className="calendar-seeds-group__header">
                                <h3 className="calendar-seeds-group__title">
                                    {group.especie}{' '}
                                    <span className="calendar-seeds-group__count">
                                        ({group.items.length} variedad{group.items.length !== 1 ? 'es' : ''})
                                    </span>
                                </h3>
                            </div>
                            <div className="calendar-seeds-group__list">
                                {group.items.map((seed) => (
                                    <div key={seed.lote_id} className="card calendar-seed-card">
                                        <div className="calendar-seed-card__header">
                                            <div>
                                                <h3 className="calendar-seed-card__title">
                                                    {seed.variety || seed.seed_name || 'Sin variedad'}
                                                </h3>
                                                <div className="calendar-seed-card__meta text-gray">
                                                    {seed.seed_name || 'Sin nombre comercial'}
                                                </div>
                                            </div>
                                            <span className="calendar-seed-card__count">
                                                {seed.cantidad_disponible} semillas
                                            </span>
                                        </div>
                                        <div className="calendar-seed-months">
                                            <div className="calendar-seed-months__row">
                                                <span className="calendar-seed-months__label">Interior</span>
                                                <div className="calendar-seed-months__badges">
                                                    {renderMonthBadges(seed.planting_months_indoor, 'indoor')}
                                                </div>
                                            </div>
                                            {(() => {
                                                const progress = getMonthProgress(seed.planting_months_indoor);
                                                if (!progress) return null;
                                                return (
                                                    <div className={`calendar-progress calendar-progress--compact calendar-progress--${progress.phase}`}>
                                                        <span className="calendar-progress__track">
                                                            <span className="calendar-progress__fill" />
                                                            <span className="calendar-progress__dot" />
                                                        </span>
                                                        <span className="calendar-progress__label">{progress.label}</span>
                                                    </div>
                                                );
                                            })()}
                                            <div className="calendar-seed-months__row">
                                                <span className="calendar-seed-months__label">Exterior</span>
                                                <div className="calendar-seed-months__badges">
                                                    {renderMonthBadges(seed.planting_months_outdoor, 'outdoor')}
                                                </div>
                                            </div>
                                            {(() => {
                                                const progress = getMonthProgress(seed.planting_months_outdoor);
                                                if (!progress) return null;
                                                return (
                                                    <div className={`calendar-progress calendar-progress--compact calendar-progress--${progress.phase}`}>
                                                        <span className="calendar-progress__track">
                                                            <span className="calendar-progress__fill" />
                                                            <span className="calendar-progress__dot" />
                                                        </span>
                                                        <span className="calendar-progress__label">{progress.label}</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
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

export default CalendarSeedsSummary;
