import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mySeedlingAPI } from '../services/api';
import CreateSeedlingModal from '../components/CreateSeedlingModal';
import EditSeedlingModal from '../components/EditSeedlingModal';
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [seedlingToEdit, setSeedlingToEdit] = useState(null);

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

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este semillero?')) {
            return;
        }
        try {
            await mySeedlingAPI.delete(id);
            loadSeedlings();
            loadStats();
        } catch (error) {
            console.error('Error deleting seedling:', error);
            alert('Error al eliminar el semillero');
        }
    };

    const handleEdit = (seedling) => {
        setSeedlingToEdit(seedling);
        setIsEditModalOpen(true);
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

    const groupSeedlingsByBatch = () => {
        const grouped = {};
        seedlings.forEach(seedling => {
            // Agrupar por fecha de siembra + ubicación + notas para agrupar semilleros del mismo "lote"
            const key = `${seedling.fecha_siembra}|${seedling.ubicacion_descripcion || 'sin ubicación'}|${seedling.notas || 'sin notas'}`;
            if (!grouped[key]) {
                // Generar nombre del grupo basado en la fecha
                const batchDate = new Date(seedling.fecha_siembra);
                const dateStr = batchDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
                grouped[key] = {
                    id: seedling.id, // Usar el primer ID del grupo
                    nombre_plantacion: `Semillero ${dateStr}`,
                    ubicacion_descripcion: seedling.ubicacion_descripcion,
                    notas: seedling.notas,
                    estado: seedling.estado,
                    fecha_siembra: seedling.fecha_siembra,
                    fecha_germinacion: seedling.fecha_germinacion,
                    variedades: []
                };
            }
            grouped[key].variedades.push({
                id: seedling.id,
                especie_nombre: seedling.especie_nombre,
                variedad_nombre: seedling.variedad_nombre,
                origen: seedling.origen,
                cantidad_semillas_plantadas: seedling.cantidad_semillas_plantadas,
                dias_desde_siembra: seedling.dias_desde_siembra
            });
        });
        return Object.values(grouped);
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
                        Crea tu primer semillero seleccionando las semillas que quieres plantar.
                        Podrás hacer seguimiento desde la germinación hasta el trasplante.
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="myseedling-empty__action btn btn-primary"
                    >
                        + Crear Semillero
                    </button>
                </div>
            ) : (
                <div className="myseedling-grid">
                    {groupSeedlingsByBatch().map(seedlingGroup => (
                        <div key={seedlingGroup.id} className="myseedling-card card">
                            {/* Header con estado */}
                            <div className="myseedling-card__header">
                                <h3 className="myseedling-card__title font-semibold">{seedlingGroup.nombre_plantacion}</h3>
                                {getStatusBadge(seedlingGroup.estado)}
                            </div>

                            {/* Detalles principales */}
                            <div className="myseedling-card__details">
                                <div className="myseedling-card__detail-row">
                                    <span className="text-gray">Sembrado:</span>
                                    <span className="font-medium">{formatDate(seedlingGroup.fecha_siembra)}</span>
                                </div>
                                {seedlingGroup.fecha_germinacion && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Germinó:</span>
                                        <span className="font-medium">{formatDate(seedlingGroup.fecha_germinacion)}</span>
                                    </div>
                                )}
                                {seedlingGroup.ubicacion_descripcion && (
                                    <div className="myseedling-card__detail-row">
                                        <span className="text-gray">Ubicación:</span>
                                        <span className="font-medium">{seedlingGroup.ubicacion_descripcion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Variedades sembrables */}
                            <div className="myseedling-card__varieties">
                                <div className="myseedling-varieties__title text-sm font-semibold text-gray">
                                    Variedades ({seedlingGroup.variedades.length})
                                </div>
                                <div className="myseedling-varieties__list">
                                    {seedlingGroup.variedades.map((variety, idx) => (
                                        <div key={idx} className="myseedling-variety-item">
                                            <div className="myseedling-variety-item__name">
                                                {variety.variedad_nombre || variety.especie_nombre}
                                            </div>
                                            <div className="myseedling-variety-item__info">
                                                {variety.origen && (
                                                    <span className="myseedling-variety-item__origin">{variety.origen}</span>
                                                )}
                                                {variety.cantidad_semillas_plantadas && (
                                                    <span className="myseedling-variety-item__quantity">{variety.cantidad_semillas_plantadas} semillas</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            {seedlingGroup.notas && (
                                <div className="myseedling-card__notes">
                                    {seedlingGroup.notas}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="myseedling-card__actions">
                                <button 
                                    onClick={() => handleEdit(seedlingGroup)}
                                    className="myseedling-card__action-btn myseedling-card__action-btn--edit"
                                    title="Editar semillero"
                                >
                                    ✏️
                                </button>
                                <Link 
                                    to={`/my-seedling/${seedlingGroup.id}`}
                                    className="myseedling-card__action-btn btn btn-secondary"
                                >
                                    Ver detalles
                                </Link>
                                <button 
                                    onClick={() => handleDelete(seedlingGroup.id)}
                                    className="myseedling-card__action-btn myseedling-card__action-btn--delete"
                                    title="Eliminar semillero"
                                >
                                    🗑️
                                </button>
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
                onClick={() => setIsModalOpen(true)}
            >
                +
            </button>

            {/* Modal */}
            <CreateSeedlingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadSeedlings();
                    loadStats();
                }}
            />

            {/* Edit Modal */}
            <EditSeedlingModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSeedlingToEdit(null);
                }}
                seedling={seedlingToEdit}
                onSuccess={() => {
                    loadSeedlings();
                    loadStats();
                }}
            />
        </div>
    );
}

export default MySeedling;
