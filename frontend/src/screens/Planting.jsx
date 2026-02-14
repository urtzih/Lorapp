import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * SFG Guide Screen - Guía de Square Foot Gardening
 * 
 * Funcionalidades:
 * - Guía de Square Foot Gardening conectada a base de datos
 * - Buscador rápido de plantas por nombre
 * - Vista de tabla responsive mobile-first
 * - Densidades de plantación por métodos (Original, Multisiembra, Macizo)
 */
export function Planting() {
    const [plantingGuide, setPlantingGuide] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredGuide, setFilteredGuide] = useState([]);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

    // Cargar guía de plantación desde el backend
    useEffect(() => {
        loadPlantingGuide();
    }, []);

    // Filtrar guía cuando cambia el searchQuery
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredGuide(plantingGuide);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = plantingGuide.filter(plant => 
                plant.nombre_comun.toLowerCase().includes(query) ||
                (plant.nombre_cientifico && plant.nombre_cientifico.toLowerCase().includes(query)) ||
                (plant.tipo_cultivo && plant.tipo_cultivo.toLowerCase().includes(query))
            );
            setFilteredGuide(filtered);
        }
    }, [searchQuery, plantingGuide]);

    const loadPlantingGuide = async () => {
        try {
            setLoading(true);
            const response = await api.get('/planting/guide');
            setPlantingGuide(response.data);
            setFilteredGuide(response.data);
        } catch (error) {
            console.error('Error loading planting guide:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPlantIcon = (tipoCultivo) => {
        const icons = {
            'hortaliza': '🥬',
            'hierba': '🌿',
            'fruta': '🍅',
            'flor': '🌸',
            'legumbre': '🫘',
            'tuberculo': '🥕',
            'aromática': '🌿',
            'verdura': '🥦'
        };
        return icons[tipoCultivo?.toLowerCase()] || '🌱';
    };

    return (
        <div className="container" style={{ padding: 'var(--space-3)', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className="screen-header" style={{ marginBottom: 'var(--space-3)' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: 'var(--space-2)' }}>
                    📐 Guía SFG
                </h1>
                <p className="text-gray" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    Densidades de plantación Square Foot Gardening
                </p>
            </div>

            {/* Square Foot Gardening Info */}
            <div className="card" style={{ 
                marginBottom: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
                color: 'white',
                borderRadius: 'var(--radius-lg)'
            }}>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
                    📐 Square Foot Gardening
                </h2>
                <p style={{ margin: 0, lineHeight: '1.5', opacity: 0.95, fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    Divide el espacio en cuadrados de <strong>30×30cm</strong> para maximizar producción en espacios reducidos.
                </p>
            </div>

            {/* Buscador y View Toggle */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar planta..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            padding: 'var(--space-2)',
                            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                            border: '2px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--card-background)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <button
                        onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                        style={{
                            padding: 'var(--space-2) var(--space-3)',
                            border: '2px solid var(--border-color)',
                            background: 'var(--card-background)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            fontSize: '1.25rem'
                        }}
                        title={viewMode === 'table' ? 'Vista tarjetas' : 'Vista tabla'}
                    >
                        {viewMode === 'table' ? '📋' : '🔲'}
                    </button>
                </div>
                {searchQuery && (
                    <div style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--text-gray)',
                        paddingLeft: 'var(--space-2)'
                    }}>
                        {filteredGuide.length} resultado{filteredGuide.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="screen-content">
                {loading ? (
                    <div className="flex items-center justify-center" style={{ padding: 'var(--space-8)' }}>
                        <div className="spinner"></div>
                    </div>
                ) : filteredGuide.length === 0 ? (
                    <div className="card" style={{ 
                        textAlign: 'center', 
                        padding: 'var(--space-6)',
                        background: 'var(--card-background)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🔍</div>
                        <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>No se encontraron resultados</h3>
                        <p className="text-gray" style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem' }}>
                            {searchQuery 
                                ? `No hay plantas que coincidan con "${searchQuery}"`
                                : 'No hay información de plantación disponible'}
                        </p>
                    </div>
                ) : viewMode === 'table' ? (
                    /* Vista Tabla - Mobile First */
                    <div className="planting-guide">
                        <div style={{ 
                            background: 'var(--card-background)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)'
                        }}>
                            {/* Header de tabla - Sticky */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-2)',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                <div>Planta</div>
                                <div style={{ textAlign: 'center' }}>Original</div>
                                <div style={{ textAlign: 'center' }}>Multi</div>
                                <div style={{ textAlign: 'center' }}>Macizo</div>
                            </div>

                            {/* Filas de tabla */}
                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {filteredGuide.map((plant, index) => (
                                    <div key={plant.id}>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                                gap: 'var(--space-2)',
                                                padding: 'var(--space-2)',
                                                borderBottom: '1px solid var(--border-color)',
                                                background: index % 2 === 0 ? 'var(--card-background)' : 'var(--background)',
                                                alignItems: 'center',
                                                fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => {
                                                // Toggle detalles
                                                const detailsRow = document.getElementById(`details-${plant.id}`);
                                                if (detailsRow) {
                                                    detailsRow.style.display = detailsRow.style.display === 'none' ? 'block' : 'none';
                                                }
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--card-background)' : 'var(--background)'}
                                        >
                                            {/* Nombre de planta */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <span style={{ fontSize: '1.5rem' }}>
                                                    {getPlantIcon(plant.tipo_cultivo)}
                                                </span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontWeight: 600,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {plant.nombre_comun}
                                                    </div>
                                                    {plant.tipo_cultivo && (
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--text-gray)',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {plant.tipo_cultivo}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Columnas de densidad */}
                                            <div style={{ 
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: plant.square_foot_gardening?.plantas_original ? 'var(--text-primary)' : 'var(--text-gray)'
                                            }}>
                                                {plant.square_foot_gardening?.plantas_original || '-'}
                                            </div>
                                            <div style={{ 
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: plant.square_foot_gardening?.plantas_multisow ? 'var(--text-primary)' : 'var(--text-gray)'
                                            }}>
                                                {plant.square_foot_gardening?.plantas_multisow || '-'}
                                            </div>
                                            <div style={{ 
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: plant.square_foot_gardening?.plantas_macizo ? 'var(--text-primary)' : 'var(--text-gray)'
                                            }}>
                                                {plant.square_foot_gardening?.plantas_macizo || '-'}
                                            </div>
                                        </div>

                                        {/* Fila de detalles expandible (oculta por defecto) */}
                                        <div
                                            id={`details-${plant.id}`}
                                            style={{
                                                display: 'none',
                                                padding: 'var(--space-3)',
                                                background: 'var(--background)',
                                                borderBottom: '1px solid var(--border-color)',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {plant.nombre_cientifico && (
                                                <div style={{ fontStyle: 'italic', color: 'var(--text-gray)', marginBottom: 'var(--space-2)' }}>
                                                    {plant.nombre_cientifico}
                                                </div>
                                            )}
                                            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                                                {plant.square_foot_gardening?.espaciado_cm && (
                                                    <div>📏 Espaciado: <strong>{plant.square_foot_gardening.espaciado_cm} cm</strong></div>
                                                )}
                                                {plant.profundidad_siembra_cm && (
                                                    <div>⬇️ Profundidad: <strong>{plant.profundidad_siembra_cm} cm</strong></div>
                                                )}
                                                {(plant.dias_hasta_cosecha_min || plant.dias_hasta_cosecha_max) && (
                                                    <div>⏱️ Cosecha: <strong>
                                                        {plant.dias_hasta_cosecha_min && plant.dias_hasta_cosecha_max
                                                            ? `${plant.dias_hasta_cosecha_min}-${plant.dias_hasta_cosecha_max} días`
                                                            : plant.dias_hasta_cosecha_min 
                                                                ? `${plant.dias_hasta_cosecha_min} días`
                                                                : `${plant.dias_hasta_cosecha_max} días`
                                                        }
                                                    </strong></div>
                                                )}
                                                {plant.square_foot_gardening?.notas && (
                                                    <div style={{ 
                                                        marginTop: 'var(--space-2)',
                                                        padding: 'var(--space-2)',
                                                        background: 'var(--card-background)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: 'var(--text-gray)'
                                                    }}>
                                                        💡 {plant.square_foot_gardening.notas}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leyenda */}
                        <div style={{ 
                            marginTop: 'var(--space-3)',
                            padding: 'var(--space-3)',
                            background: 'var(--card-background)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '0.85rem',
                            color: 'var(--text-gray)'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                📊 Métodos de siembra por cuadrado (30×30cm):
                            </div>
                            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                                <div><strong>Original:</strong> Método tradicional SFG</div>
                                <div><strong>Multi:</strong> Multisiembra (varias semillas por hoyo)</div>
                                <div><strong>Macizo:</strong> Siembra densa en todo el cuadrado</div>
                            </div>
                            <div style={{ marginTop: 'var(--space-2)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                💡 Toca cualquier fila para ver más detalles
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vista Cards - Para tablets/desktop */
                    <div style={{
                        display: 'grid',
                        gap: 'var(--space-4)',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                    }}>
                        {filteredGuide.map(plant => (
                            <div 
                                key={plant.id}
                                className="card"
                                style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--card-background)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-color)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'start',
                                    marginBottom: 'var(--space-3)',
                                    gap: 'var(--space-3)'
                                }}>
                                    <div style={{ fontSize: '3rem' }}>
                                        {getPlantIcon(plant.tipo_cultivo)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 var(--space-1) 0' }}>
                                            {plant.nombre_comun}
                                        </h3>
                                        {plant.nombre_cientifico && (
                                            <div style={{ 
                                                fontSize: '0.85rem',
                                                fontStyle: 'italic',
                                                color: 'var(--text-gray)'
                                            }}>
                                                {plant.nombre_cientifico}
                                            </div>
                                        )}
                                        {plant.tipo_cultivo && (
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: 'var(--space-2)',
                                                padding: 'var(--space-1) var(--space-2)',
                                                background: 'var(--color-primary)',
                                                color: 'white',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                textTransform: 'capitalize'
                                            }}>
                                                {plant.tipo_cultivo}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {plant.square_foot_gardening && (
                                    <div style={{
                                        padding: 'var(--space-3)',
                                        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--space-3)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-2)', opacity: 0.9 }}>
                                            📐 Métodos SFG (plantas/cuadrado 30x30cm)
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'space-around' }}>
                                            {plant.square_foot_gardening.plantas_original && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                        {plant.square_foot_gardening.plantas_original}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Original</div>
                                                </div>
                                            )}
                                            {plant.square_foot_gardening.plantas_multisow && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                        {plant.square_foot_gardening.plantas_multisow}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Multisiembra</div>
                                                </div>
                                            )}
                                            {plant.square_foot_gardening.plantas_macizo && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                        {plant.square_foot_gardening.plantas_macizo}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Macizo</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: 'var(--space-2)',
                                    fontSize: '0.9rem'
                                }}>
                                    {plant.square_foot_gardening?.espaciado_cm && (
                                        <div className="text-gray">
                                            📏 Espaciado: <strong>{plant.square_foot_gardening.espaciado_cm} cm</strong>
                                        </div>
                                    )}
                                    {plant.profundidad_siembra_cm && (
                                        <div className="text-gray">
                                            ⬇️ Profundidad: <strong>{plant.profundidad_siembra_cm} cm</strong>
                                        </div>
                                    )}
                                    {(plant.dias_hasta_cosecha_min || plant.dias_hasta_cosecha_max) && (
                                        <div className="text-gray">
                                            ⏱️ Cosecha: <strong>
                                                {plant.dias_hasta_cosecha_min && plant.dias_hasta_cosecha_max
                                                    ? `${plant.dias_hasta_cosecha_min}-${plant.dias_hasta_cosecha_max} días`
                                                    : plant.dias_hasta_cosecha_min 
                                                        ? `${plant.dias_hasta_cosecha_min} días`
                                                        : `${plant.dias_hasta_cosecha_max} días`
                                                }
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                {plant.square_foot_gardening?.notas && (
                                    <div style={{
                                        marginTop: 'var(--space-3)',
                                        padding: 'var(--space-3)',
                                        background: 'var(--background)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-gray)',
                                        lineHeight: '1.5'
                                    }}>
                                        💡 {plant.square_foot_gardening.notas}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Planting;
