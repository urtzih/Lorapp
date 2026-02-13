import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Inventory() {
    const [seeds, setSeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
    const [fabOpen, setFabOpen] = useState(false);
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        crop_family: '',
        brand: '',
        is_planted: null,
        especie: '',
        familia: '',
        origen: '',
        generacion: ''
    });

    const navigate = useNavigate();
    const { user } = useAuth();

    console.log('[Inventory] Component mounted/rendered');

    useEffect(() => {
        console.log('[Inventory] useEffect triggered, loading seeds...');
        loadSeeds();
    }, [filters]);

    const loadSeeds = async () => {
        try {
            console.log('[Inventory] loadSeeds called with filters:', filters);
            setLoading(true);
            const response = await seedsAPI.list(filters);
            console.log('[Inventory] Seeds loaded successfully:', response.data.length, 'seeds');
            setSeeds(response.data);
        } catch (error) {
            console.error('[Inventory] Error loading seeds:', error.response?.status, error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar semillas por especie
    const groupSeedsBySpecies = () => {
        const grouped = {};
        const filteredSeeds = getFilteredSeeds();
        filteredSeeds.forEach(seed => {
            const speciesName = seed.variedad?.especie?.nombre_comun || 'Sin Especie';
            if (!grouped[speciesName]) {
                grouped[speciesName] = [];
            }
            grouped[speciesName].push(seed);
        });
        return grouped;
    };

    // Filtrar semillas localmente por especie, familia, marca, origen y generación
    const getFilteredSeeds = () => {
        return seeds.filter(seed => {
            // Filtro por especie
            if (filters.especie && seed.variedad?.especie?.nombre_comun !== filters.especie) {
                return false;
            }
            // Filtro por familia
            if (filters.familia && seed.variedad?.especie?.familia_botanica !== filters.familia) {
                return false;
            }
            // Filtro por marca
            if (filters.brand && seed.marca !== filters.brand) {
                return false;
            }
            // Filtro por origen
            if (filters.origen && seed.origen !== filters.origen) {
                return false;
            }
            // Filtro por generación
            if (filters.generacion && seed.generacion !== filters.generacion) {
                return false;
            }
            return true;
        });
    };

    // Obtener opciones únicas para filtros
    const getUniqueSpecies = () => {
        const species = new Set();
        seeds.forEach(seed => {
            if (seed.variedad?.especie?.nombre_comun) {
                species.add(seed.variedad.especie.nombre_comun);
            }
        });
        return Array.from(species).sort();
    };

    const getUniqueFamilies = () => {
        const families = new Set();
        seeds.forEach(seed => {
            if (seed.variedad?.especie?.familia_botanica) {
                families.add(seed.variedad.especie.familia_botanica);
            }
        });
        return Array.from(families).sort();
    };

    const getUniqueBrands = () => {
        const brands = new Set();
        seeds.forEach(seed => {
            if (seed.marca) {
                brands.add(seed.marca);
            }
        });
        return Array.from(brands).sort();
    };

    const getUniqueOrig = () => {
        const origenes = new Set();
        seeds.forEach(seed => {
            if (seed.origen) {
                origenes.add(seed.origen);
            }
        });
        return Array.from(origenes).sort();
    };

    const getUniqueGenerations = () => {
        const generaciones = new Set();
        seeds.forEach(seed => {
            if (seed.generacion) {
                generaciones.add(seed.generacion);
            }
        });
        return Array.from(generaciones).sort();
    };

    const handleCreateList = () => {
        alert('Crear lista estara disponible pronto.');
    };

    const SeedCard = ({ seed }) => {
        // Estado badge basado en el estado del lote
        const getEstadoBadge = (estado) => {
            const badges = {
                'activo': { text: 'Activo', class: 'badge-success' },
                'agotado': { text: 'Agotado', class: 'badge-secondary' },
                'descartado': { text: 'Descartado', class: 'badge-danger' }
            };
            return badges[estado] || badges['activo'];
        };
        
        // Obtener mes promedio de siembra
        const getMesesSiembra = () => {
            if (!seed.variedad?.especie) return null;
            const meses = seed.variedad.especie.meses_siembra_exterior || seed.variedad.especie.meses_siembra_interior || [];
            if (meses.length === 0) return null;
            const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return meses.map(m => mesesNombres[m - 1]).join(', ');
        };
        
        const estadoBadge = getEstadoBadge(seed.estado);
        const mesesSiembra = getMesesSiembra();
        
        return (
            <Link to={`/seeds/${seed.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card seed-card">
                    {/* Image Container */}
                    <div className="seed-image-container">
                        {seed.fotos && seed.fotos.length > 0 ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/uploads/${seed.fotos[0]}`}
                                alt={seed.nombre_comercial}
                                className="seed-image"
                            />
                        ) : (
                            <div className="seed-placeholder">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-4 3-4 6c0 2 2 4 4 4s4-2 4-4C16 5 12 2 12 2M12 12c-3 0-5 2-5 5c0 3 2 5 5 5s5-2 5-5C17 14 15 12 12 12M10 18h4v2h-4z"/></svg>
                            </div>
                        )}
                        <div className={`seed-badge-planted ${estadoBadge.class}`}>
                            {estadoBadge.text}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="seed-content">
                        <h3 className="seed-name">{seed.nombre_comercial}</h3>

                        {seed.variedad && (
                            <p className="seed-variety">{seed.variedad.nombre_variedad}</p>
                        )}

                        <div className="seed-tags">
                            {seed.marca && (
                                <span className="badge badge-primary">{seed.marca}</span>
                            )}
                            {seed.variedad?.especie?.familia_botanica && (
                                <span className="badge badge-info" title="Familia Botánica">
                                    🌿 {seed.variedad.especie.familia_botanica}
                                </span>
                            )}
                            {seed.variedad?.procedencia && (
                                <span className="badge badge-info" title="Origen de la Variedad">
                                    📍 {seed.variedad.procedencia}
                                </span>
                            )}
                            {seed.origen && (
                                <span className="badge badge-success" title="Origen del Lote">
                                    🏠 {seed.origen}
                                </span>
                            )}
                            {seed.generacion && (
                                <span className="badge badge-warning" title="Generación">
                                    🔄 {seed.generacion}
                                </span>
                            )}
                        </div>

                        <div style={{ marginTop: 'var(--space-3)', fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                            {seed.variedad?.anno_recoleccion && (
                                <div>📅 Recolección: {seed.variedad.anno_recoleccion}</div>
                            )}
                            {mesesSiembra && (
                                <div>🌱 Siembra: {mesesSiembra}</div>
                            )}
                        </div>

                        {seed.fecha_vencimiento && (
                            <p className="seed-expiration">
                                Caduca: {new Date(seed.fecha_vencimiento).toLocaleDateString('es-ES')}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        );
    };

    const SeedListItem = ({ seed }) => {
        const getEstadoBadge = (estado) => {
            const badges = {
                'activo': { text: 'Activo', class: 'badge-success' },
                'agotado': { text: 'Agotado', class: 'badge-secondary' },
                'descartado': { text: 'Descartado', class: 'badge-danger' }
            };
            return badges[estado] || badges['activo'];
        };
        
        const getMesesSiembra = () => {
            if (!seed.variedad?.especie) return null;
            const meses = seed.variedad.especie.meses_siembra_exterior || seed.variedad.especie.meses_siembra_interior || [];
            if (meses.length === 0) return null;
            const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return meses.map(m => mesesNombres[m - 1]).join(', ');
        };
        
        const estadoBadge = getEstadoBadge(seed.estado);
        const mesesSiembra = getMesesSiembra();
        
        return (
            <Link to={`/seeds/${seed.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ padding: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, marginBottom: 'var(--space-1)', fontSize: '1rem' }}>
                                {seed.nombre_comercial}
                            </h4>
                            {seed.variedad && (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                                    {seed.variedad.nombre_variedad}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                {seed.marca && <span>🏷️ {seed.marca}</span>}
                                {seed.variedad?.especie?.familia_botanica && <span>🌿 {seed.variedad.especie.familia_botanica}</span>}
                                {seed.variedad?.procedencia && <span>📍 {seed.variedad.procedencia}</span>}
                                {seed.variedad?.anno_recoleccion && <span>📅 {seed.variedad.anno_recoleccion}</span>}
                                {mesesSiembra && <span>🌱 {mesesSiembra}</span>}
                            </div>
                        </div>
                        <div>
                            <span className={`badge ${estadoBadge.class}`}>{estadoBadge.text}</span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="container section" style={{ padding: 'var(--space-4)', paddingBottom: '150px' }}>
            {/* Header Section */}
            <h1 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Mi Inventario</h1>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <p className="text-gray text-sm" style={{ margin: 0 }}>
                        {seeds.length} semilla{seeds.length !== 1 ? 's' : ''} registrada{seeds.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {/* View Mode Toggle */}
                    {seeds.length > 0 && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)', backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                style={{ padding: '6px 12px', minHeight: 'unset' }}
                                title="Vista cuadrícula"
                            >
                                ⊞
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                                style={{ padding: '6px 12px', minHeight: 'unset' }}
                                title="Vista lista"
                            >
                                ≡
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters Section */}
            {seeds.length > 0 && (
                <div className="filters-panel" style={{ 
                    backgroundColor: '#f9fafb',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                }}>
                    {/* Filters Header */}
                    <button
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="filters-header"
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--space-4)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--color-gray-800)',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            🔍 Filtros
                            {(filters.search || filters.especie || filters.familia || filters.brand || filters.origen || filters.generacion || filters.is_planted !== null) && (
                                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                    activos
                                </span>
                            )}
                        </span>
                        <span style={{ 
                            fontSize: '1.2rem',
                            transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }}>
                            ▼
                        </span>
                    </button>

                    {/* Filters Content */}
                    <div 
                        className="filters-content"
                        style={{
                            maxHeight: filtersExpanded ? '1000px' : '0',
                            opacity: filtersExpanded ? '1' : '0',
                            transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
                            padding: filtersExpanded ? 'var(--space-4)' : '0 var(--space-4)',
                            paddingTop: filtersExpanded ? '0' : '0',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: 'var(--space-3)'
                        }}>
                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-search" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🔍 Buscar</label>
                            <input
                                type="text"
                                className="input"
                                id="filter-search"
                                placeholder="Nombre o marca..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>

                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-especie" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🌱 Especie</label>
                            <select
                                className="input"
                                id="filter-especie"
                                value={filters.especie}
                                onChange={(e) => setFilters({ ...filters, especie: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="">Todas las especies</option>
                                {getUniqueSpecies().map(species => (
                                    <option key={species} value={species}>{species}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-familia" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🌿 Familia Botánica</label>
                            <select
                                className="input"
                                id="filter-familia"
                                value={filters.familia}
                                onChange={(e) => setFilters({ ...filters, familia: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="">Todas las familias</option>
                                {getUniqueFamilies().map(family => (
                                    <option key={family} value={family}>{family}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-estado" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🌾 Estado</label>
                            <select
                                className="input"
                                id="filter-estado"
                                value={filters.is_planted || ''}
                                onChange={(e) => setFilters({ ...filters, is_planted: e.target.value ? e.target.value === 'true' : null })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="">Todas las semillas</option>
                                <option value="false">Sin plantar</option>
                                <option value="true">Plantadas</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-origen" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🏠 Origen del Lote</label>
                            <select
                                className="input"
                                id="filter-origen"
                                value={filters.origen}
                                onChange={(e) => setFilters({ ...filters, origen: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="">Todos los orígenes</option>
                                {getUniqueOrig().map(origen => (
                                    <option key={origen} value={origen}>{origen}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="form-label" htmlFor="filter-generacion" style={{ fontSize: '0.85rem', fontWeight: '600' }}>🔄 Generación</label>
                            <select
                                className="input"
                                id="filter-generacion"
                                value={filters.generacion}
                                onChange={(e) => setFilters({ ...filters, generacion: e.target.value })}
                                style={{ fontSize: '0.9rem' }}
                            >
                                <option value="">Todas las generaciones</option>
                                {getUniqueGenerations().map(gen => (
                                    <option key={gen} value={gen}>{gen}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                        {/* Botón para limpiar filtros */}
                        {(filters.search || filters.especie || filters.familia || filters.brand || filters.origen || filters.generacion || filters.is_planted !== null) && (
                            <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
                                <button 
                                    onClick={() => setFilters({ search: '', especie: '', familia: '', brand: '', origen: '', generacion: '', is_planted: null })}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    ✖ Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center" style={{ height: '300px' }}>
                    <div className="spinner"></div>
                </div>
            ) : seeds.length === 0 ? (
                /* Empty State - Sin semillas en total */
                <div className="empty-state">
                    <div className="empty-state-icon">🌱</div>
                    <h2>No tienes semillas aún</h2>
                    <p className="text-gray">Comienza escaneando tu primer sobre de semillas</p>
                    <button 
                        onClick={() => navigate('/scan')} 
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: 'var(--space-6)' }}
                    >
                        📸 Escanear primera semilla
                    </button>
                </div>
            ) : Object.keys(groupSeedsBySpecies()).length === 0 ? (
                /* Empty State - Con filtros activos pero sin resultados */
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h2>No se encontraron semillas</h2>
                    <p className="text-gray">Intenta ajustar los filtros de búsqueda</p>
                    <button 
                        onClick={() => setFilters({ search: '', especie: '', familia: '', brand: '', is_planted: null })}
                        className="btn btn-secondary"
                        style={{ marginTop: 'var(--space-4)' }}
                    >
                        ✖ Limpiar filtros
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                /* Seeds Grid - Grouped by Species */
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    {Object.entries(groupSeedsBySpecies()).map(([speciesName, speciesSeeds]) => (
                        <div key={speciesName} style={{ marginBottom: 'var(--space-8)' }}>
                            <h3 style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                marginBottom: 'var(--space-4)',
                                color: 'var(--color-primary)',
                                borderBottom: '2px solid var(--color-primary)',
                                paddingBottom: 'var(--space-2)'
                            }}>
                                {speciesName} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>({speciesSeeds.length} {speciesSeeds.length === 1 ? 'variedad' : 'variedades'})</span>
                            </h3>
                            <div className="grid grid-cols-3 mb-8 inventory-grid">
                                {speciesSeeds.map(seed => (
                                    <SeedCard key={seed.id} seed={seed} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Seeds List - Grouped by Species */
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    {Object.entries(groupSeedsBySpecies()).map(([speciesName, speciesSeeds]) => (
                        <div key={speciesName} style={{ marginBottom: 'var(--space-6)' }}>
                            <h3 style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: '600', 
                                marginBottom: 'var(--space-4)',
                                color: 'var(--color-primary)',
                                borderBottom: '2px solid var(--color-primary)',
                                paddingBottom: 'var(--space-2)'
                            }}>
                                {speciesName} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>({speciesSeeds.length} {speciesSeeds.length === 1 ? 'variedad' : 'variedades'})</span>
                            </h3>
                            {speciesSeeds.map(seed => (
                                <SeedListItem key={seed.id} seed={seed} />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Action Button */}
            {!loading && seeds.length > 0 && (
                <>
                    {fabOpen && (
                        <button
                            className="fab-backdrop"
                            onClick={() => setFabOpen(false)}
                            aria-label="Cerrar menu"
                        />
                    )}
                    <div className="fab-container">
                        <div className={`fab-menu ${fabOpen ? 'open' : ''}`} id="fab-menu" role="menu">
                            <button className="fab-action" onClick={() => { setFabOpen(false); navigate('/scan'); }} role="menuitem">
                                ➕ Añadir semilla
                            </button>
                            <button className="fab-action" onClick={() => { setFabOpen(false); navigate('/csv-manager'); }} role="menuitem">
                                📊 Gestionar CSV
                            </button>
                            <button className="fab-action" onClick={() => { setFabOpen(false); handleCreateList(); }} role="menuitem">
                                🗂️ Crear lista
                            </button>
                        </div>
                        <button
                            onClick={() => setFabOpen((prev) => !prev)}
                            className={`fab ${fabOpen ? 'open' : ''}`}
                            title="Acciones"
                            aria-expanded={fabOpen}
                            aria-controls="fab-menu"
                        >
                            +
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Inventory;
