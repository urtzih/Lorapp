import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mySeedlingAPI } from '../services/api';

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
            'SEMBRADA': { bg: '#FEF3C7', color: '#92400E', label: '🌱 Germinando' },
            'GERMINADA': { bg: '#D1FAE5', color: '#065F46', label: '🌿 Germinada' },
            'PLANIFICADA': { bg: '#E0E7FF', color: '#3730A3', label: '📋 Planificada' },
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
                    🌾 Mi Semillero
                </h1>
                <p className="text-gray">
                    Registra las semillas que vas sembrando de tu inventario y haz seguimiento hasta el trasplante.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🌱</div>
                    <div className="text-2xl font-bold">{stats.germinating}</div>
                    <div className="text-sm text-gray">Germinando</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🌿</div>
                    <div className="text-2xl font-bold">{stats.ready}</div>
                    <div className="text-sm text-gray">Listas</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🪴</div>
                    <div className="text-2xl font-bold">{stats.transplanted}</div>
                    <div className="text-sm text-gray">Trasplantadas</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>📦</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-gray">Total Siembras</div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ flex: '1', minWidth: '250px' }}>
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
                        className="input"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Todos</option>
                        <option value="germinating">Germinando</option>
                        <option value="ready">Listos para trasplantar</option>
                        <option value="transplanted">Trasplantados</option>
                    </select>

                    {/* Add Button */}
                    <Link to="/inventory" className="btn btn-primary">
                        + Sembrar desde Inventario
                    </Link>
                </div>
            </div>

            {/* Content */}
            {seedlings.length === 0 ? (
                <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>🌱</div>
                    <h2 className="text-xl font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                        Tu semillero está vacío
                    </h2>
                    <p className="text-gray" style={{ marginBottom: 'var(--space-4)' }}>
                        Ve a tu inventario y selecciona semillas para empezar a sembrar.
                        Podrás hacer seguimiento desde la germinación hasta el trasplante.
                    </p>
                    <Link to="/inventory" className="btn btn-primary">
                        Ir al Inventario
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--space-3)' }}>
                    {seedlings.map(seedling => (
                        <div key={seedling.id} className="card" style={{ padding: 'var(--space-3)' }}>
                            {/* Header con estado */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-2)' }}>
                                <h3 className="font-semibold" style={{ flex: 1 }}>{seedling.nombre_plantacion}</h3>
                                {getStatusBadge(seedling.estado)}
                            </div>

                            {/* Información de especie/variedad */}
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <div className="text-sm" style={{ color: 'var(--primary)' }}>
                                    {seedling.especie_nombre}
                                </div>
                                {seedling.variedad_nombre && (
                                    <div className="text-sm text-gray">
                                        Variedad: {seedling.variedad_nombre}
                                    </div>
                                )}
                            </div>

                            {/* Detalles */}
                            <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                    <span className="text-gray">Sembrado:</span>
                                    <span className="font-medium">{formatDate(seedling.fecha_siembra)}</span>
                                </div>
                                {seedling.fecha_germinacion && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Germinó:</span>
                                        <span className="font-medium">{formatDate(seedling.fecha_germinacion)}</span>
                                    </div>
                                )}
                                {seedling.cantidad_semillas_plantadas && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Cantidad:</span>
                                        <span className="font-medium">{seedling.cantidad_semillas_plantadas} semillas</span>
                                    </div>
                                )}
                                {seedling.dias_desde_siembra !== null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                                        <span className="text-gray">Días transcurridos:</span>
                                        <span className="font-medium">{seedling.dias_desde_siembra} días</span>
                                    </div>
                                )}
                                {seedling.ubicacion_descripcion && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="text-gray">Ubicación:</span>
                                        <span className="font-medium">{seedling.ubicacion_descripcion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {seedling.notas && (
                                <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    {seedling.notas}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto' }}>
                                <Link 
                                    to={`/my-seedling/${seedling.id}`}
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

            {/* Tips Card */}
            <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                <h3 className="font-semibold" style={{ marginBottom: 'var(--space-2)' }}>
                    💡 Consejos para tu semillero
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-2)' }}>
                    <li>🌡️ Mantén temperatura constante (18-25°C)</li>
                    <li>💧 Riega con pulverizador al inicio</li>
                    <li>☀️ Luz indirecta hasta germinar</li>
                    <li>📅 Anota fecha de siembra y germinación</li>
                    <li>🏷️ Etiqueta las bandejas claramente</li>
                    <li>🌱 Trasplanta cuando tengan 2-4 hojas verdaderas</li>
                </ul>
            </div>
        </div>
    );
}

export default MySeedling;
