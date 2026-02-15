import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { myGardenAPI } from '../services/api';
import '../styles/MyGarden.css';

/**
 * Mi Huerta - Registro de plantaciones en el jardín/huerta
 * Permite llevar un control de lo que se planta, con fechas de siembra,
 * trasplante, cosecha, ubicación, etc.
 */
export function MyGarden() {
    const [plantings, setPlantings] = useState([]);
    const [stats, setStats] = useState({ total: 0, growing: 0, ready_to_harvest: 0, harvested: 0 });
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [filters, setFilters] = useState({
        status: 'all', // 'all', 'planted', 'growing', 'harvested'
        search: ''
    });

    const { user } = useAuth();

    useEffect(() => {
        loadPlantings();
        loadStats();
    }, [filters]);

    const loadPlantings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status !== 'all') {
                params.status_filter = filters.status;
            }
            if (filters.search) {
                params.search = filters.search;
            }
            const response = await myGardenAPI.list(params);
            setPlantings(response.data);
        } catch (error) {
            console.error('Error loading plantings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await myGardenAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (estado) => {
        const badges = {
            'TRASPLANTADA': { className: 'mygarden-badge--transplanted', label: '🌱 Trasplantada' },
            'CRECIMIENTO': { className: 'mygarden-badge--growing', label: '🌿 Creciendo' },
            'COSECHA_CERCANA': { className: 'mygarden-badge--ready', label: '🌾 Lista para cosechar' },
            'COSECHADA': { className: 'mygarden-badge--harvested', label: '✅ Cosechada' },
        };
        const badge = badges[estado] || { className: 'mygarden-badge--default', label: estado };
        return (
            <span className={`mygarden-badge ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="mygarden-container">
                <div className="mygarden-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="mygarden-container">
            {/* Header */}
            <div className="mygarden-header">
                <h1 className="mygarden-header__title">
                    🌱 Mi Huerta
                </h1>
                <p className="mygarden-header__description text-gray">
                    Registra y monitorea tus plantaciones: fechas de siembra, trasplante, cosecha y ubicación.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="mygarden-stats">
                <div className="mygarden-stat-card">
                    <div className="mygarden-stat-card__icon">🌿</div>
                    <div className="mygarden-stat-card__value text-2xl font-bold">{stats.growing}</div>
                    <div className="mygarden-stat-card__label text-sm text-gray">En crecimiento</div>
                </div>
                <div className="mygarden-stat-card">
                    <div className="mygarden-stat-card__icon">🌾</div>
                    <div className="mygarden-stat-card__value text-2xl font-bold">{stats.ready_to_harvest}</div>
                    <div className="mygarden-stat-card__label text-sm text-gray">Listas para cosechar</div>
                </div>
                <div className="mygarden-stat-card">
                    <div className="mygarden-stat-card__icon">✅</div>
                    <div className="mygarden-stat-card__value text-2xl font-bold">{stats.harvested}</div>
                    <div className="mygarden-stat-card__label text-sm text-gray">Cosechadas</div>
                </div>
                <div className="mygarden-stat-card">
                    <div className="mygarden-stat-card__icon">📊</div>
                    <div className="mygarden-stat-card__value text-2xl font-bold">{stats.total}</div>
                    <div className="mygarden-stat-card__label text-sm text-gray">Total</div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="mygarden-filters card">
                <div className="mygarden-filters__content">
                    {/* Search */}
                    <div className="mygarden-filters__search">
                        <input
                            type="text"
                            placeholder="Buscar plantaciones..."
                            className="input"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="mygarden-filters__select input"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">Todos</option>
                        <option value="planted">Plantado</option>
                        <option value="growing">En crecimiento</option>
                        <option value="harvested">Cosechado</option>
                    </select>

                    {/* View Mode */}
                    <div className="mygarden-filters__view-toggle">
                        <button
                            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('list')}
                        >
                            Lista
                        </button>
                        <button
                            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            Cuadrícula
                        </button>
                    </div>

                    {/* Add Button */}
                    <button className="mygarden-filters__add-btn btn btn-primary">
                        + Nueva Plantación
                    </button>
                </div>
            </div>

            {/* Content */}
            {plantings.length === 0 ? (
                <div className="mygarden-empty card">
                    <div className="mygarden-empty__icon">🌿</div>
                    <h2 className="mygarden-empty__title text-xl font-semibold">
                        Aún no has registrado ninguna plantación
                    </h2>
                    <p className="mygarden-empty__description text-gray">
                        Comienza a registrar lo que plantas en tu huerta para llevar un control completo
                        de fechas, ubicaciones y cosechas.
                    </p>
                    <button className="mygarden-empty__action btn btn-primary">
                        + Registrar Primera Plantación
                    </button>
                </div>
            ) : (
                <div className={`mygarden-plantings ${viewMode === 'grid' ? 'mygarden-plantings--grid' : 'mygarden-plantings--list'}`}>
                    {plantings.map(planting => (
                        <div key={planting.id} className="mygarden-planting-card card">
                            {/* Header con estado */}
                            <div className="mygarden-planting-card__header">
                                <h3 className="mygarden-planting-card__title font-semibold">{planting.nombre_plantacion}</h3>
                                {getStatusBadge(planting.estado)}
                            </div>

                            {/* Información de especie/variedad */}
                            <div className="mygarden-planting-card__info">
                                <div className="mygarden-planting-card__species text-sm">
                                    {planting.especie_nombre}
                                </div>
                                {planting.variedad_nombre && (
                                    <div className="mygarden-planting-card__variety text-sm text-gray">
                                        Variedad: {planting.variedad_nombre}
                                    </div>
                                )}
                            </div>

                            {/* Detalles */}
                            <div className="mygarden-planting-card__details">
                                <div className="mygarden-planting-card__detail-row">
                                    <span className="text-gray">Sembrado:</span>
                                    <span className="font-medium">{formatDate(planting.fecha_siembra)}</span>
                                </div>
                                {planting.fecha_trasplante && (
                                    <div className="mygarden-planting-card__detail-row">
                                        <span className="text-gray">Trasplantado:</span>
                                        <span className="font-medium">{formatDate(planting.fecha_trasplante)}</span>
                                    </div>
                                )}
                                {planting.fecha_cosecha_estimada && (
                                    <div className="mygarden-planting-card__detail-row">
                                        <span className="text-gray">Cosecha estimada:</span>
                                        <span className="font-medium">{formatDate(planting.fecha_cosecha_estimada)}</span>
                                    </div>
                                )}
                                {planting.cantidad_semillas_plantadas && (
                                    <div className="mygarden-planting-card__detail-row">
                                        <span className="text-gray">Cantidad:</span>
                                        <span className="font-medium">{planting.cantidad_semillas_plantadas} plantas</span>
                                    </div>
                                )}
                                {planting.ubicacion_descripcion && (
                                    <div className="mygarden-planting-card__detail-row">
                                        <span className="text-gray">Ubicación:</span>
                                        <span className="font-medium">{planting.ubicacion_descripcion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {planting.notas && (
                                <div className="mygarden-planting-card__notes">
                                    {planting.notas}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mygarden-planting-card__actions">
                                <Link 
                                    to={`/my-garden/${planting.id}`}
                                    className="mygarden-planting-card__action-btn btn btn-secondary"
                                >
                                    Ver detalles
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <div className="mygarden-info-card card">
                <h3 className="mygarden-info-card__title font-semibold">
                    💡 ¿Qué puedes registrar?
                </h3>
                <ul className="mygarden-info-card__list">
                    <li>📅 Fecha de siembra</li>
                    <li>🌱 Fecha de trasplante</li>
                    <li>🎯 Ubicación en la huerta</li>
                    <li>📏 Cantidad plantada</li>
                    <li>🌾 Fecha de cosecha</li>
                    <li>📝 Notas y observaciones</li>
                </ul>
            </div>
        </div>
    );
}

export default MyGarden;
