import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Inventory.css';

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
        origen: ''
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

    // Filtrar semillas localmente por especie, familia, marca, origen
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
            <Link to={`/seeds/${seed.id}`} className="inventory-seed-card">
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
                            {seed.origen && (
                                <span className="badge badge-success" title="Origen del Lote">
                                    🏠 {seed.origen}
                                </span>
                            )}
                        </div>

                        <div className="inventory-seed-details">
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
            <Link to={`/seeds/${seed.id}`} className="inventory-seed-list-item">
                <div className="card inventory-seed-list-item__card">
                    <div className="inventory-seed-list-item__content">
                        <div className="inventory-seed-list-item__info">
                            <h4 className="inventory-seed-list-item__title">
                                {seed.nombre_comercial}
                            </h4>
                            {seed.variedad && (
                                <p className="inventory-seed-list-item__variety">
                                    {seed.variedad.nombre_variedad}
                                </p>
                            )}
                            <div className="inventory-seed-list-item__tags">
                                {seed.marca && <span>🏷️ {seed.marca}</span>}
                                {seed.variedad?.especie?.familia_botanica && <span>🌿 {seed.variedad.especie.familia_botanica}</span>}
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
        <div className="container section inventory-container">
            {/* Header Section */}
            <h1 className="inventory-header__title">Mi Inventario</h1>
            <div className="inventory-header__controls">
                <div>
                    <p className="inventory-header__stats">
                        {seeds.length} semilla{seeds.length !== 1 ? 's' : ''} registrada{seeds.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="inventory-header__actions">
                    {/* View Mode Toggle */}
                    {seeds.length > 0 && (
                        <div className="inventory-view-toggle">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`inventory-view-toggle__btn btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                title="Vista cuadrícula"
                            >
                                ⊞
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`inventory-view-toggle__btn btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
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
                <div className="inventory-filters">
                    {/* Filters Header */}
                    <button
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="inventory-filters__toggle"
                    >
                        <span className="inventory-filters__toggle-text">
                            🔍 Filtros
                            {(filters.search || filters.especie || filters.familia || filters.brand || filters.origen || filters.is_planted !== null) && (
                                <span className="inventory-filters__toggle-count badge badge-primary">
                                    activos
                                </span>
                            )}
                        </span>
                        <span className={`inventory-filters__toggle-icon ${filtersExpanded ? 'inventory-filters__toggle-icon--expanded' : ''}`}>
                            ▼
                        </span>
                    </button>

                    {/* Filters Content */}
                    {filtersExpanded && (
                        <div className="inventory-filters__content">
                        <div className="inventory-filters__group">
                            <label className="inventory-filters__label form-label" htmlFor="filter-search">🔍 Buscar</label>
                            <input
                                type="text"
                                className="input inventory-filters__input"
                                id="filter-search"
                                placeholder="Nombre o marca..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>

                        <div className="inventory-filters__group">
                            <label className="inventory-filters__label form-label" htmlFor="filter-especie">🌱 Especie</label>
                            <select
                                className="input inventory-filters__input"
                                id="filter-especie"
                                value={filters.especie}
                                onChange={(e) => setFilters({ ...filters, especie: e.target.value })}
                            >
                                <option value="">Todas las especies</option>
                                {getUniqueSpecies().map(species => (
                                    <option key={species} value={species}>{species}</option>
                                ))}
                            </select>
                        </div>

                        <div className="inventory-filters__group">
                            <label className="inventory-filters__label form-label" htmlFor="filter-familia">🌿 Familia Botánica</label>
                            <select
                                className="input inventory-filters__input"
                                id="filter-familia"
                                value={filters.familia}
                                onChange={(e) => setFilters({ ...filters, familia: e.target.value })}
                            >
                                <option value="">Todas las familias</option>
                                {getUniqueFamilies().map(family => (
                                    <option key={family} value={family}>{family}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="inventory-filters__group">
                            <label className="inventory-filters__label form-label" htmlFor="filter-estado">🌾 Estado</label>
                            <select
                                className="input inventory-filters__input"
                                id="filter-estado"
                                value={filters.is_planted || ''}
                                onChange={(e) => setFilters({ ...filters, is_planted: e.target.value ? e.target.value === 'true' : null })}
                            >
                                <option value="">Todas las semillas</option>
                                <option value="false">Sin plantar</option>
                                <option value="true">Plantadas</option>
                            </select>
                        </div>

                        <div className="inventory-filters__group">
                            <label className="inventory-filters__label form-label" htmlFor="filter-origen">🏠 Origen del Lote</label>
                            <select
                                className="input inventory-filters__input"
                                id="filter-origen"
                                value={filters.origen}
                                onChange={(e) => setFilters({ ...filters, origen: e.target.value })}
                            >
                                <option value="">Todos los orígenes</option>
                                {getUniqueOrig().map(origen => (
                                    <option key={origen} value={origen}>{origen}</option>
                                ))}
                            </select>
                        </div>

                        {/* Botón para limpiar filtros */}
                        {(filters.search || filters.especie || filters.familia || filters.brand || filters.origen || filters.is_planted !== null) && (
                            <div className="inventory-filters__clear">
                                <button 
                                    onClick={() => setFilters({ search: '', especie: '', familia: '', brand: '', origen: '', is_planted: null })}
                                    className="inventory-filters__clear-btn btn btn-secondary btn-sm"
                                >
                                    ✖ Limpiar filtros
                                </button>
                            </div>
                        )}
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="inventory-loading">
                    <div className="spinner"></div>
                </div>
            ) : seeds.length === 0 ? (
                /* Empty State - Sin semillas en total */
                <div className="inventory-empty empty-state">
                    <div className="inventory-empty__icon empty-state-icon">🌱</div>
                    <h2 className="inventory-empty__title">No tienes semillas aún</h2>
                    <p className="inventory-empty__description text-gray">Comienza escaneando tu primer sobre de semillas</p>
                    <button 
                        onClick={() => navigate('/scan')} 
                        className="inventory-empty__action btn btn-primary btn-lg"
                    >
                        📸 Escanear primera semilla
                    </button>
                </div>
            ) : Object.keys(groupSeedsBySpecies()).length === 0 ? (
                /* Empty State - Con filtros activos pero sin resultados */
                <div className="inventory-empty empty-state">
                    <div className="inventory-empty__icon empty-state-icon">🔍</div>
                    <h2 className="inventory-empty__title">No se encontraron semillas</h2>
                    <p className="inventory-empty__description text-gray">Intenta ajustar los filtros de búsqueda</p>
                    <button 
                        onClick={() => setFilters({ search: '', especie: '', familia: '', brand: '', is_planted: null })}
                        className="inventory-empty__action btn btn-secondary"
                    >
                        ✖ Limpiar filtros
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                /* Seeds Grid - Grouped by Species */
                <div className="inventory-species-group">
                    {Object.entries(groupSeedsBySpecies()).map(([speciesName, speciesSeeds]) => (
                        <div key={speciesName} className="inventory-species-group__section">
                            <h3 className="inventory-species-header">
                                {speciesName} <span className="inventory-species-header__count">({speciesSeeds.length} {speciesSeeds.length === 1 ? 'variedad' : 'variedades'})</span>
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
                <div className="inventory-species-group">
                    {Object.entries(groupSeedsBySpecies()).map(([speciesName, speciesSeeds]) => (
                        <div key={speciesName} className="inventory-species-group__section">
                            <h3 className="inventory-species-header">
                                {speciesName} <span className="inventory-species-header__count">({speciesSeeds.length} {speciesSeeds.length === 1 ? 'variedad' : 'variedades'})</span>
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
