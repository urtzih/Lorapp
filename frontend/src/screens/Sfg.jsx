import { useState, useEffect } from 'react';
import api, { seedsAPI, myGardenAPI } from '../services/api';
import '../styles/Sfg.css';

/**
 * SFG Guide Screen - Guía de Square Foot Gardening
 * Componente profesional sin estilos inline
 */
function Sfg() {
    const [plantingGuide, setPlantingGuide] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredGuide, setFilteredGuide] = useState([]);
    const [userSpecies, setUserSpecies] = useState(new Set()); // Species en inventario del usuario
    const [plantedSpecies, setPlantedSpecies] = useState(new Set()); // Species plantadas en el huerto
    const [expandedRows, setExpandedRows] = useState(new Set()); // Track qué filas están expandidas
    const [showAddPlant, setShowAddPlant] = useState(false); // Modal para añadir planta
    const [newPlantName, setNewPlantName] = useState(''); // Nombre de nueva planta
    const [newPlantOriginal, setNewPlantOriginal] = useState(''); // Plantas original
    const [newPlantMulti, setNewPlantMulti] = useState(''); // Plantas multisiembra
    const [newPlantMacizo, setNewPlantMacizo] = useState(''); // Plantas macizo
    const [sortColumn, setSortColumn] = useState('nombre_comun'); // Columna para ordenar
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' o 'desc'

    // Cargar guía de plantación desde el backend
    useEffect(() => {
        loadPlantingGuide();
        loadUserInventory();
        loadPlantedSpecies();
    }, []);

    // Filtrar y ordenar guía cuando cambia el searchQuery o sortColumn
    useEffect(() => {
        let filtered = plantingGuide;
        
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = plantingGuide.filter(plant => 
                plant.nombre_comun.toLowerCase().includes(query) ||
                (plant.nombre_cientifico && plant.nombre_cientifico.toLowerCase().includes(query)) ||
                (plant.tipo_cultivo && plant.tipo_cultivo.toLowerCase().includes(query))
            );
        }
        
        // Función para obtener valor anidado
        const getNestedValue = (obj, path) => {
            return path.split('.').reduce((current, prop) => current?.[prop] ?? '', obj);
        };
        
        // Ordenar
        const sorted = [...filtered].sort((a, b) => {
            let aVal, bVal;
            
            // Columnas especiales para ordenar por estado
            if (sortColumn === 'has_seeds') {
                aVal = userSpecies.has(a.nombre_comun) ? 1 : 0;
                bVal = userSpecies.has(b.nombre_comun) ? 1 : 0;
            } else if (sortColumn === 'is_planted') {
                aVal = plantedSpecies.has(a.nombre_comun) ? 1 : 0;
                bVal = plantedSpecies.has(b.nombre_comun) ? 1 : 0;
            } else {
                aVal = getNestedValue(a, sortColumn);
                bVal = getNestedValue(b, sortColumn);
                
                // Si son strings, convertir a minúsculas
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                } else {
                    // Para valores numéricos o mixtos, convertir a número (null/undefined/'' = 0)
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                }
            }
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        setFilteredGuide(sorted);
    }, [searchQuery, plantingGuide, sortColumn, sortDirection, userSpecies, plantedSpecies]);

    const loadPlantingGuide = async () => {
        try {
            setLoading(true);
            const response = await api.get('/planting/guide');
            console.log('[SFG] Datos recibidos:', response.data);
            if (response.data.length > 0) {
                console.log('[SFG] Ejemplo de planta:', response.data[0]);
                console.log('[SFG] tipo_cultivo:', response.data[0].tipo_cultivo);
            }
            setPlantingGuide(response.data);
            setFilteredGuide(response.data);
        } catch (error) {
            console.error('Error loading planting guide:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserInventory = async () => {
        try {
            console.log('[Planting] Iniciando carga de inventario...');
            const response = await seedsAPI.list();
            console.log('[Planting] Respuesta del servidor:', response.data);
            
            const especies = new Set();
            if (!response.data || response.data.length === 0) {
                console.warn('[Planting] No hay datos de semillas en la respuesta');
                setUserSpecies(new Set());
                return;
            }
            
            response.data.forEach((seed, index) => {
                console.log(`[Planting] Semilla ${index}:`, seed);
                console.log(`[Planting]   - variedad:`, seed.variedad);
                console.log(`[Planting]   - especie:`, seed.variedad?.especie);
                console.log(`[Planting]   - nombre_comun:`, seed.variedad?.especie?.nombre_comun);
                
                if (seed.variedad?.especie?.nombre_comun) {
                    const nombreComun = seed.variedad.especie.nombre_comun;
                    console.log(`[Planting] ✅ Añadiendo especie:`, nombreComun);
                    especies.add(nombreComun);
                }
            });
            
            console.log('[Planting] Especies del usuario:', Array.from(especies));
            setUserSpecies(especies);
        } catch (error) {
            console.error('[Planting] Error loading user inventory:', error);
            setUserSpecies(new Set());
        }
    };
    const loadPlantedSpecies = async () => {
        try {
            console.log('[SFG] Cargando plantas del huerto...');
            const response = await myGardenAPI.list();
            console.log('[SFG] Plantas en huerto:', response.data);
            
            const especies = new Set();
            if (!response.data || response.data.length === 0) {
                console.warn('[SFG] No hay plantas en el huerto');
                setPlantedSpecies(new Set());
                return;
            }
            
            response.data.forEach(planta => {
                const nombreComun = planta.variedad?.especie?.nombre_comun || planta.nombre_comun;
                if (nombreComun) {
                    console.log(`[SFG] ✅ Añadiendo planta del huerto: ${nombreComun}`);
                    especies.add(nombreComun);
                }
            });
            
            console.log(`[SFG] Total plantas diferentes en huerto: ${especies.size}`);
            setPlantedSpecies(especies);
        } catch (error) {
            console.error('Error loading planted species:', error);
            setPlantedSpecies(new Set());
        }
    };
    const handleSort = (column) => {
        if (sortColumn === column) {
            // Si ya está ordenado por esta columna, cambiar dirección
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Nueva columna, ordenar ascendente
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const handleAddPlant = () => {
        const trimmedName = newPlantName.trim();
        
        // Validar que no esté vacío
        if (!trimmedName) {
            alert('Por favor ingresa un nombre de planta');
            return;
        }

        // Validar que no exista ya
        if (plantingGuide.some(p => p.nombre_comun.toLowerCase() === trimmedName.toLowerCase())) {
            alert(`"${trimmedName}" ya existe en la guía`);
            setNewPlantName('');
            return;
        }

        // Convertir valores a números (si están vacíos, usar null)
        const original = newPlantOriginal.trim() ? parseInt(newPlantOriginal) : null;
        const multi = newPlantMulti.trim() ? parseInt(newPlantMulti) : null;
        const macizo = newPlantMacizo.trim() ? parseInt(newPlantMacizo) : null;

        // Crear nueva planta
        const newPlant = {
            id: Math.max(...plantingGuide.map(p => p.id || 0), 0) + 1,
            nombre_comun: trimmedName,
            nombre_cientifico: '',
            tipo_cultivo: 'otra',
            descripcion: 'Planta agregada manualmente',
            square_foot_gardening: {
                plantas_original: original,
                plantas_multisow: multi,
                plantas_macizo: macizo,
                espaciado_cm: null,
                notas: 'Completa los datos de SFG si lo deseas'
            }
        };

        // Agregar a la guía
        const newGuide = [...plantingGuide, newPlant];
        setPlantingGuide(newGuide);
        setFilteredGuide(newGuide);

        console.log(`[Planting] ✅ Nueva planta agregada: ${trimmedName}`);

        // Limpiar modal
        setShowAddPlant(false);
        setNewPlantName('');

        // Mostrar mensaje de éxito
        alert(`✅ "${trimmedName}" ha sido agregada a la guía SFG`);
    };

    const getPlantIcon = (plant) => {
        // Log para debugging
        if (plant && plant.nombre_comun) {
            console.log(`[ICON] ${plant.nombre_comun} - familia: ${plant.familia_botanica || 'N/A'} - tipo: ${plant.tipo_cultivo || 'N/A'}`);
        }
        
        const nombre = plant?.nombre_comun?.toLowerCase() || '';
        const familia = plant?.familia_botanica?.toLowerCase() || '';
        
        // Mapeo por familia botánica (más confiable)
        if (familia.includes('solanácea')) return '🍅'; // Tomate, pimiento, berenjena
        if (familia.includes('cucurbitácea')) return '🥒'; // Pepino, calabaza, melón
        if (familia.includes('fabácea') || familia.includes('leguminosa')) return '🫘'; // Legumbres
        if (familia.includes('brasicácea') || familia.includes('crucífera')) return '🥬'; // Coles, brócoli, rábano
        if (familia.includes('apiácea') || familia.includes('umbelífera')) return '🥕'; // Zanahoria, perejil, apio
        if (familia.includes('asteraceae') || familia.includes('compuesta')) return '🌻'; // Lechuga, girasol
        if (familia.includes('amaryllidaceae') || familia.includes('liliácea')) return '🧅'; // Cebolla, ajo
        if (familia.includes('poaceae') || familia.includes('gramínea')) return '🌾'; // Maíz, trigo
        
        // Mapeo por nombre común (fallback)
        if (nombre.includes('tomat')) return '🍅';
        if (nombre.includes('pimient') || nombre.includes('chile') || nombre.includes('pepper')) return '🌶️';
        if (nombre.includes('berenji')) return '🍆';
        if (nombre.includes('pepin') || nombre.includes('calabaz') || nombre.includes('calabac') || nombre.includes('melón')) return '🥒';
        if (nombre.includes('judí') || nombre.includes('alubi') || nombre.includes('guisant') || nombre.includes('lentej') || nombre.includes('garbanzo')) return '🫘';
        if (nombre.includes('lechuga') || nombre.includes('escarola')) return '🥬';
        if (nombre.includes('repollo') || nombre.includes('col ') || nombre.includes('brócoli') || nombre.includes('coliflor')) return '🥦';
        if (nombre.includes('zanahoria')) return '🥕';
        if (nombre.includes('ceboll') || nombre.includes('ajo') || nombre.includes('puerro')) return '🧅';
        if (nombre.includes('patata') || nombre.includes('papa')) return '🥔';
        if (nombre.includes('rábano')) return '🌰';
        if (nombre.includes('maíz') || nombre.includes('maiz')) return '🌽';
        if (nombre.includes('fres') || nombre.includes('fram')) return '🍓';
        if (nombre.includes('flor') || nombre.includes('ornament')) return '🌸';
        if (nombre.includes('hierba') || nombre.includes('aromátic') || nombre.includes('perejil') || nombre.includes('cilantro') || nombre.includes('albahaca')) return '🌿';
        
        return '🌱'; // Default
    };

    return (
        <div className="sfg-container">
            {/* Header */}
            <div className="sfg-header">
                <h1 className="sfg-header__title">📐 Guía SFG</h1>
                <p className="sfg-header__subtitle">Densidades de plantación Square Foot Gardening</p>
                <div className="sfg-header__stats">
                    <span className="sfg-header__stats-label">Total de plantas en la guía:</span>
                    <span className="sfg-header__stats-value">{plantingGuide.length}</span>
                </div>
            </div>

            {/* Search Box */}
            <div className="sfg-search-container">
                <input
                    type="text"
                    placeholder="🔍 Buscar planta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sfg-search-container__input"
                />
                {searchQuery && (
                    <div className="sfg-search-container__results">
                        {filteredGuide.length} resultado{filteredGuide.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="screen-content">
                {loading ? (
                    <div className="sfg-loading">
                        <div className="spinner"></div>
                    </div>
                ) : filteredGuide.length === 0 ? (
                    <div className="sfg-empty-state">
                        <div className="sfg-empty-state__icon">🔍</div>
                        <h3 className="sfg-empty-state__title">No se encontraron resultados</h3>
                        <p className="sfg-empty-state__message">
                            {searchQuery 
                                ? `No hay plantas que coincidan con "${searchQuery}"`
                                : 'No hay información de plantación disponible'}
                        </p>
                    </div>
                ) : (
                    <div className="planting-guide">
                        <div className="sfg-table">
                            {/* Header */}
                            <div className="sfg-table__header">
                                <div 
                                    className="sfg-table__header-cell"
                                    onClick={() => handleSort('nombre_comun')}
                                >
                                    Planta {sortColumn === 'nombre_comun' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                    className="sfg-table__header-cell sfg-table__header-cell--center"
                                    onClick={() => handleSort('has_seeds')}
                                >
                                    🌾 {sortColumn === 'has_seeds' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                    className="sfg-table__header-cell sfg-table__header-cell--center"
                                    onClick={() => handleSort('is_planted')}
                                >
                                    🌱 {sortColumn === 'is_planted' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                    className="sfg-table__header-cell sfg-table__header-cell--center"
                                    onClick={() => handleSort('square_foot_gardening.plantas_original')}
                                >
                                    Orig. {sortColumn === 'square_foot_gardening.plantas_original' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                    className="sfg-table__header-cell sfg-table__header-cell--center"
                                    onClick={() => handleSort('square_foot_gardening.plantas_multisow')}
                                >
                                    Multi {sortColumn === 'square_foot_gardening.plantas_multisow' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                                <div 
                                    className="sfg-table__header-cell sfg-table__header-cell--center"
                                    onClick={() => handleSort('square_foot_gardening.plantas_macizo')}
                                >
                                    Macizo {sortColumn === 'square_foot_gardening.plantas_macizo' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="sfg-table__body">
                                {filteredGuide.map((plant, index) => (
                                    <div key={plant.id}>
                                        <div className="sfg-table__row">
                                            {/* Plant Name */}
                                            <div 
                                                className="sfg-table__cell--plant"
                                                onClick={() => {
                                                    const newExpanded = new Set(expandedRows);
                                                    if (newExpanded.has(plant.id)) {
                                                        newExpanded.delete(plant.id);
                                                    } else {
                                                        newExpanded.add(plant.id);
                                                    }
                                                    setExpandedRows(newExpanded);
                                                }}
                                            >
                                                <div className="sfg-plant-info">
                                                    <div className="sfg-plant-name-wrapper">
                                                        <span className="sfg-plant-icon">
                                                            {getPlantIcon(plant)}
                                                        </span>
                                                        <div className="sfg-plant-name">
                                                            {plant.nombre_comun}
                                                        </div>
                                                    </div>
                                                    {plant.tipo_cultivo && plant.tipo_cultivo.toLowerCase() !== 'sfg' && (
                                                        <div className="sfg-plant-type">
                                                            {plant.tipo_cultivo}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tengo Semilla */}
                                            <div className="sfg-table__cell--status">
                                                {userSpecies.has(plant.nombre_comun) ? (
                                                    <span className="sfg-status-icon sfg-status-icon--success" title="Tengo semillas">✓</span>
                                                ) : (
                                                    <span className="sfg-status-icon sfg-status-icon--empty">-</span>
                                                )}
                                            </div>

                                            {/* Plantada */}
                                            <div className="sfg-table__cell--status">
                                                {plantedSpecies.has(plant.nombre_comun) ? (
                                                    <span className="sfg-status-icon sfg-status-icon--planted" title="Tengo plantada">✓</span>
                                                ) : (
                                                    <span className="sfg-status-icon sfg-status-icon--empty">-</span>
                                                )}
                                            </div>

                                            {/* Plantas por cuadrado - Original */}
                                            <div className={`sfg-table__cell--value ${!plant.square_foot_gardening?.plantas_original ? 'sfg-table__cell--empty' : ''}`}>
                                                {plant.square_foot_gardening?.plantas_original || '-'}
                                            </div>

                                            {/* Plantas por cuadrado - MultiSow */}
                                            <div className={`sfg-table__cell--value ${!plant.square_foot_gardening?.plantas_multisow ? 'sfg-table__cell--empty' : ''}`}>
                                                {plant.square_foot_gardening?.plantas_multisow || '-'}
                                            </div>

                                            {/* Plantas por cuadrado - Macizo */}
                                            <div className={`sfg-table__cell--value ${!plant.square_foot_gardening?.plantas_macizo ? 'sfg-table__cell--empty' : ''}`}>
                                                {plant.square_foot_gardening?.plantas_macizo || '-'}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedRows.has(plant.id) && (
                                            <div className="sfg-details-container">
                                                {/* Basic Info */}
                                                <div className="sfg-details">
                                                    <div className="sfg-details__item">
                                                        <label className="sfg-details__label">Nombre Común</label>
                                                        <p className="sfg-details__value">{plant.nombre_comun}</p>
                                                    </div>

                                                    <div className="sfg-details__item">
                                                        <label className="sfg-details__label">Nombre Científico</label>
                                                        <p className="sfg-details__value sfg-details__value--italic">{plant.nombre_cientifico || '—'}</p>
                                                    </div>

                                                    <div>
                                                        <label className="sfg-details__label">Tipo Cultivo</label>
                                                        <p className="sfg-details__value">{plant.tipo_cultivo || '—'}</p>
                                                    </div>

                                                    <div className="sfg-details__item">
                                                        <label className="sfg-details__label">Descripción</label>
                                                        <p className="sfg-details__value sfg-details__value--prewrap">{plant.descripcion || '—'}</p>
                                                    </div>
                                                </div>

                                                {/* SFG Info */}
                                                {plant.square_foot_gardening && (
                                                    <div className="sfg-sgf-info">
                                                        <div className="sfg-sgf-info__title">
                                                            📐 Square Foot Gardening (plantas por cuadrado 30×30cm)
                                                        </div>
                                                        <div className="sfg-details__sfg-grid">
                                                            <div className="sfg-details__sfg-item">
                                                                <p className="sfg-details__sfg-value">
                                                                    {plant.square_foot_gardening.plantas_original || '—'}
                                                                </p>
                                                                <div className="sfg-details__sfg-label">Original</div>
                                                            </div>
                                                            <div className="sfg-details__sfg-item">
                                                                <p className="sfg-details__sfg-value">
                                                                    {plant.square_foot_gardening.plantas_multisow || '—'}
                                                                </p>
                                                                <div className="sfg-details__sfg-label">Multisiembra</div>
                                                            </div>
                                                            <div className="sfg-details__sfg-item">
                                                                <p className="sfg-details__sfg-value">
                                                                    {plant.square_foot_gardening.plantas_macizo || '—'}
                                                                </p>
                                                                <div className="sfg-details__sfg-label">Macizo</div>
                                                            </div>
                                                        </div>
                                                        {plant.square_foot_gardening.espaciado_cm && (
                                                            <div className="sfg-sgf-info__extra">
                                                                📏 Espaciado: <strong>{plant.square_foot_gardening.espaciado_cm} cm</strong>
                                                            </div>
                                                        )}
                                                        {plant.square_foot_gardening.notas && (
                                                            <div className="sfg-sgf-info__extra">
                                                                💡 {plant.square_foot_gardening.notas}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Extra Info */}
                                                <div className="sfg-details">
                                                    {plant.profundidad_siembra_cm && (
                                                        <div>
                                                            <label className="sfg-details__label">Profundidad Siembra</label>
                                                            <p className="sfg-details__value">{plant.profundidad_siembra_cm} cm</p>
                                                        </div>
                                                    )}
                                                    {(plant.dias_hasta_cosecha_min || plant.dias_hasta_cosecha_max) && (
                                                        <div>
                                                            <label className="sfg-details__label">Días hasta Cosecha</label>
                                                            <p className="sfg-details__value">
                                                                {plant.dias_hasta_cosecha_min && plant.dias_hasta_cosecha_max
                                                                    ? `${plant.dias_hasta_cosecha_min}-${plant.dias_hasta_cosecha_max} días`
                                                                    : plant.dias_hasta_cosecha_min 
                                                                        ? `${plant.dias_hasta_cosecha_min} días`
                                                                        : `${plant.dias_hasta_cosecha_max} días`
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="sfg-info-box">
                            <h2 className="sfg-info-box__title">📐 Square Foot Gardening</h2>
                            <p className="sfg-info-box__text">
                                Divide el espacio en cuadrados de <strong>30×30cm</strong> para maximizar producción en espacios reducidos.
                            </p>
                        </div>
                        {/* Leyenda */}
                        <div className="sfg-legend">
                            <div className="sfg-legend__section">
                                <div className="sfg-legend__title">📊 Métodos de siembra por cuadrado (30×30cm):</div>
                                <div className="sfg-legend__list">
                                    <div><strong>Original:</strong> Método tradicional SFG</div>
                                    <div><strong>Multi:</strong> Multisiembra (varias semillas por hoyo)</div>
                                    <div><strong>Macizo:</strong> Siembra densa en todo el cuadrado</div>
                                </div>
                            </div>
                            <div className="sfg-legend__section sfg-legend__section--border">
                                <div className="sfg-legend__title">✓ Plantas en tu inventario:</div>
                                <div className="sfg-legend__description">
                                    Las plantas que tienes en semillas aparecen con checkbox marcado en la primera columna
                                </div>
                            </div>
                            <div className="sfg-legend__tip">
                                💡 Toca cualquier fila para ver más detalles y información SFG
                            </div>
                        </div>
                    </div>
                )}

                {/* Botón FAB para agregar planta */}
                <button
                    onClick={() => setShowAddPlant(true)}
                    className="sfg-fab"
                    title="Agregar nueva planta a la guía SFG"
                >
                    +
                </button>

            {/* Modal para agregar planta */}
            {showAddPlant && (
                    <div className="sfg-modal__overlay" onClick={() => {
                        setShowAddPlant(false);
                        setNewPlantName('');
                        setNewPlantOriginal('');
                        setNewPlantMulti('');
                        setNewPlantMacizo('');
                    }}>
                        <div className="sfg-modal__content" onClick={(e) => e.stopPropagation()}>
                            <h2 className="sfg-modal__title">
                                🌱 Agregar Nueva Planta a la Guía SFG
                            </h2>

                            <div className="sfg-modal__form-group">
                                <label className="sfg-modal__label">
                                    Nombre de la Planta *
                                </label>
                                <input
                                    type="text"
                                    value={newPlantName}
                                    onChange={(e) => setNewPlantName(e.target.value)}
                                    placeholder="Ej: Acelga, Apio, Lechuga..."
                                    autoFocus
                                    className="sfg-modal__input"
                                />
                            </div>

                            <div className="sfg-modal__form-row">
                                <div className="sfg-modal__form-group">
                                    <label className="sfg-modal__label">
                                        Original
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlantOriginal}
                                        onChange={(e) => setNewPlantOriginal(e.target.value)}
                                        placeholder="1-16"
                                        min="1"
                                        max="100"
                                        className="sfg-modal__input"
                                    />
                                </div>

                                <div className="sfg-modal__form-group">
                                    <label className="sfg-modal__label">
                                        Multisiembra
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlantMulti}
                                        onChange={(e) => setNewPlantMulti(e.target.value)}
                                        placeholder="1-16"
                                        min="1"
                                        max="100"
                                        className="sfg-modal__input"
                                    />
                                </div>

                                <div className="sfg-modal__form-group">
                                    <label className="sfg-modal__label">
                                        Macizo
                                    </label>
                                    <input
                                        type="number"
                                        value={newPlantMacizo}
                                        onChange={(e) => setNewPlantMacizo(e.target.value)}
                                        placeholder="1-100"
                                        min="1"
                                        max="100"
                                        className="sfg-modal__input"
                                    />
                                </div>
                            </div>

                            <div className="sfg-modal__help">
                                💡 Los campos numéricos son opcionales. Indica cuántas plantas caben en un cuadrado de 30×30cm.
                            </div>

                            <div className="sfg-modal__footer">
                                <button
                                    onClick={() => {
                                        setShowAddPlant(false);
                                        setNewPlantName('');
                                        setNewPlantOriginal('');
                                        setNewPlantMulti('');
                                        setNewPlantMacizo('');
                                    }}
                                    className="sfg-modal__btn"
                                >
                                    ✕ Cancelar
                                </button>
                                <button
                                    onClick={handleAddPlant}
                                    disabled={!newPlantName.trim()}
                                    className="sfg-modal__btn sfg-modal__btn--primary"
                                >
                                    ✓ Agregar Planta
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sfg;
