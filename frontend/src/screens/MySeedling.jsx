import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mySeedlingAPI } from '../services/api';
import CreateSeedlingModal from '../components/CreateSeedlingModal';
import '../styles/MySeedling.css';

/**
 * Mi Semillero - Registro de siembras desde el inventario
 * Permite registrar qué semillas del inventario se están sembrando,
 * con fechas, ubicación en semillero, y seguimiento hasta trasplante
 */
export function MySeedling() {
    const [seedlings, setSeedlings] = useState([]);
    const [stats, setStats] = useState({ total: 0, germinating: 0, ready: 0, transplanted: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all', // 'all', 'germinating', 'ready', 'transplanted'
        search: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fabMenuOpen, setFabMenuOpen] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        loadSeedlings();
        loadStats();
    }, [filters]);

    const loadSeedlings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status !== 'all') {
                params.status_filter = filters.status;
            }
            if (filters.search) {
                params.search = filters.search;
            }
            const response = await mySeedlingAPI.list(params);
            setSeedlings(response.data);
        } catch (error) {
            console.error('Error loading seedlings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await mySeedlingAPI.getStats();
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
            'SEMBRADA': { className: 'myseedling-badge--germinating', label: '🌱 Germinando' },
            'GERMINADA': { className: 'myseedling-badge--germinated', label: '🌿 Germinada' },
            'PLANIFICADA': { className: 'myseedling-badge--planned', label: '📋 Planificada' },
        };
        const badge = badges[estado] || { className: 'myseedling-badge--default', label: estado };
        return (
            <span className={`myseedling-badge ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="myseedling-container">
                <div className="myseedling-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="myseedling-container">
            {/* Overlay para cerrar FAB menu */}
            {fabMenuOpen && (
                <div 
                    className="fab-overlay"
                    onClick={() => setFabMenuOpen(false)}
                />
            )}

            {/* Header */}
            <div className="myseedling-header">
                <h1 className="myseedling-header__title">
                    🌾 Mi Semillero
                </h1>
                <p className="myseedling-header__description text-gray">
                    Registra las semillas que vas sembrando de tu inventario y haz seguimiento hasta el trasplante.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="myseedling-stats">
                <div className="myseedling-stat-card">
                    <div className="myseedling-stat-card__icon">🌱</div>
                    <div className="myseedling-stat-card__value text-2xl font-bold">{stats.germinating}</div>
                    <div className="myseedling-stat-card__label text-sm text-gray">Germinando</div>
                </div>
                <div className="myseedling-stat-card">
                    <div className="myseedling-stat-card__icon">🌿</div>
                    <div className="myseedling-stat-card__value text-2xl font-bold">{stats.ready}</div>
                    <div className="myseedling-stat-card__label text-sm text-gray">Listas</div>
                </div>
                <div className="myseedling-stat-card">
                    <div className="myseedling-stat-card__icon">🪴</div>
                    <div className="myseedling-stat-card__value text-2xl font-bold">{stats.transplanted}</div>
                    <div className="myseedling-stat-card__label text-sm text-gray">Trasplantadas</div>
                </div>
                <div className="myseedling-stat-card">
                    <div className="myseedling-stat-card__icon">📦</div>
                    <div className="myseedling-stat-card__value text-2xl font-bold">{stats.total}</div>
                    <div className="myseedling-stat-card__label text-sm text-gray">Total Siembras</div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="myseedling-filters card">
                <div className="myseedling-filters__content">
                    {/* Search */}
                    <div className="myseedling-filters__search">
                        <input
                            type="text"
                            placeholder="Buscar en semillero..."
                            className="input"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="myseedling-filters__select input"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">Todos</option>
                        <option value="germinating">Germinando</option>
                        <option value="ready">Listos para trasplantar</option>
                        <option value="transplanted">Trasplantados</option>
                    </select>

                    {/* Add Button */}
                    <Link to="/inventory" className="myseedling-filters__add-btn btn btn-primary">
                        + Sembrar desde Inventario
                    </Link>
                </div>
            </div>

            {/* Content */}
            {seedlings.length === 0 ? (
                <div className="myseedling-empty card">
                    <div className="myseedling-empty__icon">🌱</div>
                    <h2 className="myseedling-empty__title text-xl font-semibold">
                        Tu semillero está vacío
                    </h2>
                    <p className="myseedling-empty__description text-gray">
                        Ve a tu inventario y selecciona semillas para empezar a sembrar.
                        Podrás hacer seguimiento desde la germinación hasta el trasplante.
                    </p>
                    <Link to="/inventory" className="myseedling-empty__action btn btn-primary">
                        Ir al Inventario
                    </Link>
                </div>
            ) : (
                <div className="myseedling-grid">
                    {seedlings.map(seedling => (
                        <div key={seedling.id} className="myseedling-card card">
                            {/* Header con estado */}
                            <div className="myseedling-card__header">
                                <h3 className="myseedling-card__title font-semibold">{seedling.nombre_plantacion}</h3>
                                {getStatusBadge(seedling.estado)}
                            </div>

                            {/* Información de especie/variedad */}
                            <div className="myseedling-card__info">
                                <div className="myseedling-card__species text-sm">
                                    {seedling.especie_nombre}
                                </div>
                                {seedling.variedad_nombre && (
                                    <div className="myseedling-card__variety text-sm text-gray">
                                        Variedad: {seedling.variedad_nombre}
                                    </div>
                                )}
                            </div>

                            {/* Detalles */}
                            <div className="myseedling-card__details">
                                <div className="myseedling-card__detail-row">
                                    <span className="text-gray">Sembrado:</span>
                                    <span className="font-medium">{formatDate(seedling.fecha_siembra)}</span>
                                </div>
                                {seedling.fecha_germinacion && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Germinó:</span>
                                        <span className="font-medium">{formatDate(seedling.fecha_germinacion)}</span>
                                    </div>
                                )}
                                {seedling.cantidad_semillas_plantadas && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Cantidad:</span>
                                        <span className="font-medium">{seedling.cantidad_semillas_plantadas} semillas</span>
                                    </div>
                                )}
                                {seedling.dias_desde_siembra !== null && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Días transcurridos:</span>
                                        <span className="font-medium">{seedling.dias_desde_siembra} días</span>
                                    </div>
                                )}
                                {seedling.ubicacion_descripcion && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Ubicación:</span>
                                        <span className="font-medium">{seedling.ubicacion_descripcion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {seedling.notas && (
                                <div className="myseedling-card__notes">
                                    {seedling.notas}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="myseedling-card__actions">
                                <Link 
                                    to={`/my-seedling/${seedling.id}`}
                                    className="myseedling-card__action-btn btn btn-secondary"
                                >
                                    Ver detalles
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips Card */}
            <div className="myseedling-tips-card card">
                <h3 className="myseedling-tips-card__title font-semibold">
                    💡 Consejos para tu semillero
                </h3>
                <ul className="myseedling-tips-card__list">
                    <li>🌡️ Mantén temperatura constante (18-25°C)</li>
                    <li>💧 Riega con pulverizador al inicio</li>
                    <li>☀️ Luz indirecta hasta germinar</li>
                    <li>📅 Anota fecha de siembra y germinación</li>
                    <li>🏷️ Etiqueta las bandejas claramente</li>
                    <li>🌱 Trasplanta cuando tengan 2-4 hojas verdaderas</li>
                </ul>
            </div>

            {/* FAB Button */}
            <button 
                className="fab" 
                title="Crear Semillero" 
                aria-expanded={fabMenuOpen}
                aria-controls="fab-menu"
                onClick={() => setFabMenuOpen(!fabMenuOpen)}
            >
                +
            </button>

            {/* FAB Menu */}
            {fabMenuOpen && (
                <div className="fab-menu" id="fab-menu">
                    <div 
                        className="fab-menu__item"
                        onClick={() => {
                            setIsModalOpen(true);
                            setFabMenuOpen(false);
                        }}
                    >
                        <span className="fab-menu__label">Crear Semillero</span>
                        <span>🌱</span>
                    </div>
                </div>
            )}

            {/* Modal */}
            <CreateSeedlingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadSeedlings();
                    loadStats();
                }}
            />
        </div>
    );
}

export default MySeedling;
