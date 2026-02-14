import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { myGardenAPI } from '../services/api';

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
            'TRASPLANTADA': { bg: '#DBEAFE', color: '#1E40AF', label: '🌱 Trasplantada' },
            'CRECIMIENTO': { bg: '#D1FAE5', color: '#065F46', label: '🌿 Creciendo' },
            'COSECHA_CERCANA': { bg: '#FEF3C7', color: '#92400E', label: '🌾 Lista para cosechar' },
            'COSECHADA': { bg: '#E0E7FF', color: '#3730A3', label: '✅ Cosechada' },
        };
        const badge = badges[estado] || { bg: '#F3F4F6', color: '#1F2937', label: estado };
        return (
            <span style={{
                background: badge.bg,
                color: badge.color,
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontWeight: '500'
            }}>
                {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h1 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-2)' }}>
                    🌱 Mi Huerta
                </h1>
                <p className="text-gray">
                    Registra y monitorea tus plantaciones: fechas de siembra, trasplante, cosecha y ubicación.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🌿</div>
                    <div className="text-2xl font-bold">{stats.growing}</div>
                    <div className="text-sm text-gray">En crecimiento</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🌾</div>
                    <div className="text-2xl font-bold">{stats.ready_to_harvest}</div>
                    <div className="text-sm text-gray">Listas para cosechar</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>✅</div>
                    <div className="text-2xl font-bold">{stats.harvested}</div>
                    <div className="text-sm text-gray">Cosechadas</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>📊</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-gray">Total</div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ flex: '1', minWidth: '250px' }}>
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
                        className="input"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Todos</option>
                        <option value="planted">Plantado</option>
                        <option value="growing">En crecimiento</option>
                        <option value="harvested">Cosechado</option>
                    </select>

                    {/* View Mode */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
                    <button className="btn btn-primary">
                        + Nueva Plantación
                    </button>
                </div>
            </div>

            {/* Content */}
            {plantings.length === 0 ? (
                <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>🌿</div>
                    <h2 className="text-xl font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                        Aún no has registrado ninguna plantación
                    </h2>
                    <p className="text-gray" style={{ marginBottom: 'var(--space-4)' }}>
                        Comienza a registrar lo que plantas en tu huerta para llevar un control completo
                        de fechas, ubicaciones y cosechas.
                    </p>
                    <button className="btn btn-primary">
                        + Registrar Primera Plantación
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'} 
                     style={{ gap: 'var(--space-3)' }}>
                    {plantings.map(planting => (
                        <div key={planting.id} className="card" style={{ padding: 'var(--space-3)' }}>
                            {/* Header con estado */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-2)' }}>
                                <h3 className="font-semibold" style={{ flex: 1 }}>{planting.nombre_plantacion}</h3>
                                {getStatusBadge(planting.estado)}
                            </div>

                            {/* Información de especie/variedad */}
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <div className="text-sm" style={{ color: 'var(--primary)' }}>
                                    {planting.especie_nombre}
                                </div>
                                {planting.variedad_nombre && (
                                    <div className="text-sm text-gray">
                                        Variedad: {planting.variedad_nombre}
                                    </div>
                                )}
                            </div>

                            {/* Detalles */}
                            <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                    <span className="text-gray">Sembrado:</span>
                                    <span className="font-medium">{formatDate(planting.fecha_siembra)}</span>
                                </div>
                                {planting.fecha_trasplante && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Trasplantado:</span>
                                        <span className="font-medium">{formatDate(planting.fecha_trasplante)}</span>
                                    </div>
                                )}
                                {planting.fecha_cosecha_estimada && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Cosecha estimada:</span>
                                        <span className="font-medium">{formatDate(planting.fecha_cosecha_estimada)}</span>
                                    </div>
                                )}
                                {planting.cantidad_semillas_plantadas && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Cantidad:</span>
                                        <span className="font-medium">{planting.cantidad_semillas_plantadas} plantas</span>
                                    </div>
                                )}
                                {planting.ubicacion_descripcion && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="text-gray">Ubicación:</span>
                                        <span className="font-medium">{planting.ubicacion_descripcion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {planting.notas && (
                                <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    {planting.notas}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto' }}>
                                <Link 
                                    to={`/my-garden/${planting.id}`}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem' }}
                                >
                                    Ver detalles
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                    💡 ¿Qué puedes registrar?
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
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
