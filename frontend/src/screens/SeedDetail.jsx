import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';

export function SeedDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seed, setSeed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState({ lote: false, variedad: false, especie: false, fotos: false });
    const [newPhotos, setNewPhotos] = useState([]);
    const [message, setMessage] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        loadSeed();
    }, [id]);

    const loadSeed = async () => {
        try {
            const response = await seedsAPI.getOne(id);
            setSeed(response.data);
            setEditData(response.data);
        } catch (error) {
            console.error('Error loading seed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta semilla?')) return;
        try {
            await seedsAPI.delete(id);
            navigate('/inventory');
        } catch (error) {
            console.error('Error deleting seed:', error);
        }
    };

    const updateLoteField = (field, value) => {
        setEditData((prev) => ({ ...prev, [field]: value }));
    };

    const updateVariedadField = (field, value) => {
        setEditData((prev) => ({
            ...prev,
            variedad: { ...prev?.variedad, [field]: value }
        }));
    };

    const updateEspecieField = (field, value) => {
        setEditData((prev) => ({
            ...prev,
            variedad: {
                ...prev?.variedad,
                especie: { ...prev?.variedad?.especie, [field]: value }
            }
        }));
    };

    const parseNumber = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        return Number.isNaN(num) ? null : num;
    };

    const formatDateInput = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    };

    const handleSaveLote = async () => {
        if (!editData) return;
        setSaving((prev) => ({ ...prev, lote: true }));
        setMessage(null);
        try {
            if (!editData.nombre_comercial?.trim()) {
                setMessage({ type: 'error', text: 'El nombre comercial es obligatorio.' });
                return;
            }
            const payload = {
                nombre_comercial: editData.nombre_comercial,
                marca: editData.marca,
                numero_lote: editData.numero_lote,
                cantidad_estimada: parseNumber(editData.cantidad_estimada),
                cantidad_restante: parseNumber(editData.cantidad_restante),
                anno_produccion: parseNumber(editData.anno_produccion),
                origen: editData.origen,
                generacion: editData.generacion,
                fecha_adquisicion: editData.fecha_adquisicion || null,
                fecha_vencimiento: editData.fecha_vencimiento || null,
                lugar_almacenamiento: editData.lugar_almacenamiento,
                temperatura_almacenamiento_c: parseNumber(editData.temperatura_almacenamiento_c),
                humedad_relativa: parseNumber(editData.humedad_relativa),
                estado: editData.estado,
                notas: editData.notas
            };
            await seedsAPI.update(id, payload);
            await loadSeed();
            setMessage({ type: 'success', text: 'Lote actualizado correctamente.' });
        } catch (error) {
            console.error('Error updating lote:', error);
            setMessage({ type: 'error', text: 'No se pudo guardar el lote.' });
        } finally {
            setSaving((prev) => ({ ...prev, lote: false }));
        }
    };

    const handleSaveVariedad = async () => {
        if (!editData?.variedad?.id) return;
        setSaving((prev) => ({ ...prev, variedad: true }));
        setMessage(null);
        try {
            if (!editData.variedad.nombre_variedad?.trim()) {
                setMessage({ type: 'error', text: 'El nombre de la variedad es obligatorio.' });
                return;
            }
            const payload = {
                nombre_variedad: editData.variedad.nombre_variedad,
                descripcion: editData.variedad.descripcion,
                color_fruto: editData.variedad.color_fruto,
                sabor: editData.variedad.sabor,
                tamanio_planta: editData.variedad.tamanio_planta,
                profundidad_siembra_cm: parseNumber(editData.variedad.profundidad_siembra_cm),
                distancia_plantas_cm: parseNumber(editData.variedad.distancia_plantas_cm),
                distancia_surcos_cm: parseNumber(editData.variedad.distancia_surcos_cm),
                dias_germinacion_min: parseNumber(editData.variedad.dias_germinacion_min),
                dias_germinacion_max: parseNumber(editData.variedad.dias_germinacion_max),
                dias_hasta_cosecha_min: parseNumber(editData.variedad.dias_hasta_cosecha_min),
                dias_hasta_cosecha_max: parseNumber(editData.variedad.dias_hasta_cosecha_max),
                resistencias: editData.variedad.resistencias || [],
                es_hija_f1: !!editData.variedad.es_hija_f1,
                es_variedad_antigua: !!editData.variedad.es_variedad_antigua,
                tipo_origen: editData.variedad.tipo_origen,
                procedencia: editData.variedad.procedencia,
                anno_recoleccion: parseNumber(editData.variedad.anno_recoleccion),
                generacion: editData.variedad.generacion,
                tipo_polinizacion: editData.variedad.tipo_polinizacion
            };
            await seedsAPI.updateVariedad(editData.variedad.id, payload);
            await loadSeed();
            setMessage({ type: 'success', text: 'Variedad actualizada correctamente.' });
        } catch (error) {
            console.error('Error updating variedad:', error);
            setMessage({ type: 'error', text: 'No se pudo guardar la variedad.' });
        } finally {
            setSaving((prev) => ({ ...prev, variedad: false }));
        }
    };

    const handleSaveEspecie = async () => {
        if (!editData?.variedad?.especie?.id) return;
        setSaving((prev) => ({ ...prev, especie: true }));
        setMessage(null);
        try {
            if (!editData.variedad.especie.nombre_comun?.trim()) {
                setMessage({ type: 'error', text: 'El nombre común es obligatorio.' });
                return;
            }
            const payload = {
                nombre_comun: editData.variedad.especie.nombre_comun,
                nombre_cientifico: editData.variedad.especie.nombre_cientifico,
                familia_botanica: editData.variedad.especie.familia_botanica,
                genero: editData.variedad.especie.genero,
                descripcion: editData.variedad.especie.descripcion,
                tipo_cultivo: editData.variedad.especie.tipo_cultivo,
                profundidad_siembra_cm: parseNumber(editData.variedad.especie.profundidad_siembra_cm),
                distancia_plantas_cm: parseNumber(editData.variedad.especie.distancia_plantas_cm),
                distancia_surcos_cm: parseNumber(editData.variedad.especie.distancia_surcos_cm),
                frecuencia_riego: editData.variedad.especie.frecuencia_riego,
                exposicion_solar: editData.variedad.especie.exposicion_solar,
                dias_germinacion_min: parseNumber(editData.variedad.especie.dias_germinacion_min),
                dias_germinacion_max: parseNumber(editData.variedad.especie.dias_germinacion_max),
                dias_hasta_trasplante: parseNumber(editData.variedad.especie.dias_hasta_trasplante),
                dias_hasta_cosecha_min: parseNumber(editData.variedad.especie.dias_hasta_cosecha_min),
                dias_hasta_cosecha_max: parseNumber(editData.variedad.especie.dias_hasta_cosecha_max),
                meses_siembra_interior: editData.variedad.especie.meses_siembra_interior || [],
                meses_siembra_exterior: editData.variedad.especie.meses_siembra_exterior || [],
                temperatura_minima_c: parseNumber(editData.variedad.especie.temperatura_minima_c),
                temperatura_maxima_c: parseNumber(editData.variedad.especie.temperatura_maxima_c),
                zonas_climaticas_preferidas: editData.variedad.especie.zonas_climaticas_preferidas || []
            };
            await seedsAPI.updateEspecie(editData.variedad.especie.id, payload);
            await loadSeed();
            setMessage({ type: 'success', text: 'Especie actualizada correctamente.' });
        } catch (error) {
            console.error('Error updating especie:', error);
            setMessage({ type: 'error', text: 'No se pudo guardar la especie.' });
        } finally {
            setSaving((prev) => ({ ...prev, especie: false }));
        }
    };

    const handleAddPhotos = async () => {
        if (!newPhotos.length) return;
        setSaving((prev) => ({ ...prev, fotos: true }));
        setMessage(null);
        try {
            const formData = new FormData();
            newPhotos.forEach((file) => formData.append('files', file));
            await seedsAPI.addPhotos(id, formData);
            setNewPhotos([]);
            await loadSeed();
            setMessage({ type: 'success', text: 'Fotos añadidas correctamente.' });
        } catch (error) {
            console.error('Error adding photos:', error);
            setMessage({ type: 'error', text: 'No se pudieron subir las fotos.' });
        } finally {
            setSaving((prev) => ({ ...prev, fotos: false }));
        }
    };

    const handleRemovePhoto = async (photoPath) => {
        if (!confirm('¿Eliminar esta foto?')) return;
        setSaving((prev) => ({ ...prev, fotos: true }));
        setMessage(null);
        try {
            await seedsAPI.deletePhoto(id, photoPath);
            await loadSeed();
            setCurrentPhotoIndex(0);
            setMessage({ type: 'success', text: 'Foto eliminada correctamente.' });
        } catch (error) {
            console.error('Error removing photo:', error);
            setMessage({ type: 'error', text: 'No se pudo eliminar la foto.' });
        } finally {
            setSaving((prev) => ({ ...prev, fotos: false }));
        }
    };

    const handleSetPrincipalPhoto = async (photoPath) => {
        setSaving((prev) => ({ ...prev, fotos: true }));
        setMessage(null);
        try {
            await seedsAPI.setPhotoPrincipal(id, photoPath);
            setCurrentPhotoIndex(0);
            await loadSeed();
            setMessage({ type: 'success', text: 'Foto principal actualizada.' });
        } catch (error) {
            console.error('Error setting principal photo:', error);
            setMessage({ type: 'error', text: 'No se pudo cambiar la foto principal.' });
        } finally {
            setSaving((prev) => ({ ...prev, fotos: false }));
        }
    };

    const nextPhoto = () => {
        if (seed?.fotos && seed.fotos.length > 0) {
            setCurrentPhotoIndex((prev) => (prev + 1) % seed.fotos.length);
        }
    };

    const prevPhoto = () => {
        if (seed?.fotos && seed.fotos.length > 0) {
            setCurrentPhotoIndex((prev) => (prev - 1 + seed.fotos.length) % seed.fotos.length);
        }
    };

    const getEstadoBadge = (estado) => {
        const badges = {
            'activo': { text: 'Activo', color: '#10b981', bg: '#d1fae5' },
            'agotado': { text: 'Agotado', color: '#6b7280', bg: '#e5e7eb' },
            'descartado': { text: 'Descartado', color: '#ef4444', bg: '#fecaca' },
            'vencido': { text: 'Vencido', color: '#f59e0b', bg: '#fed7aa' }
        };
        return badges[estado] || badges['activo'];
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!seed) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Semilla no encontrada</h2>
                <button onClick={() => navigate('/inventory')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Volver al inventario
                </button>
            </div>
        );
    }

    const estadoBadge = getEstadoBadge(seed.estado);

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f9fafb',
            paddingBottom: '100px'
        }}>
            {/* Header fijo */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    maxWidth: '768px',
                    margin: '0 auto'
                }}>
                    <button 
                        onClick={() => navigate('/inventory')} 
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#374151'
                        }}
                    >
                        ←
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!editing ? (
                            <>
                                <button 
                                    onClick={() => setEditing(true)} 
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    ✏️ Editar
                                </button>
                                <button 
                                    onClick={handleDelete} 
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑️
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setEditing(false)} 
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                ✖ Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div style={{ maxWidth: '768px', margin: '0 auto', padding: '1rem' }}>
                {/* Mensajes */}
                {message && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        backgroundColor: message.type === 'success' ? '#d1fae5' : '#fecaca',
                        color: message.type === 'success' ? '#065f46' : '#991b1b',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Slider de fotos moderno */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {seed.fotos && seed.fotos.length > 0 ? (
                        <>
                            {/* Foto principal */}
                            <div style={{ position: 'relative', backgroundColor: '#000' }}>
                                <img
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${seed.fotos[currentPhotoIndex]}`}
                                    alt={seed.nombre_comercial}
                                    style={{
                                        width: '100%',
                                        height: '350px',
                                        maxHeight: '350px',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                                
                                {/* Contador */}
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    left: '12px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    {currentPhotoIndex + 1} / {seed.fotos.length}
                                </div>

                                {/* Botón eliminar */}
                                {editing && (
                                    <button
                                        onClick={() => handleRemovePhoto(seed.fotos[currentPhotoIndex])}
                                        disabled={saving.fotos}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            fontSize: '1.2rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            opacity: saving.fotos ? 0.5 : 1
                                        }}
                                    >
                                        ✖
                                    </button>
                                )}

                                {/* Flechas de navegación */}
                                {seed.fotos.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevPhoto}
                                            style={{
                                                position: 'absolute',
                                                left: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '44px',
                                                height: '44px',
                                                fontSize: '1.3rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: 'blur(4px)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'}
                                            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                        >
                                            ◀
                                        </button>
                                        <button
                                            onClick={nextPhoto}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '44px',
                                                height: '44px',
                                                fontSize: '1.3rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: 'blur(4px)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)'}
                                            onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                                        >
                                            ▶
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Miniaturas */}
                            {seed.fotos.length > 1 && (
                                <div style={{ 
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    overflowX: 'auto',
                                    scrollbarWidth: 'thin'
                                }}>
                                    {seed.fotos.map((photo, index) => (
                                        <div key={index} style={{ position: 'relative', flexShrink: 0 }}>
                                            <button
                                                onClick={() => {
                                                    if (editing && index !== 0) {
                                                        handleSetPrincipalPhoto(photo);
                                                    } else {
                                                        setCurrentPhotoIndex(index);
                                                    }
                                                }}
                                                disabled={saving.fotos || (editing && index === 0)}
                                                style={{
                                                    width: '70px',
                                                    height: '70px',
                                                    borderRadius: '12px',
                                                    border: currentPhotoIndex === index ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                                                    padding: '0',
                                                    cursor: (editing && index === 0) ? 'default' : 'pointer',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.2s',
                                                    transform: currentPhotoIndex === index ? 'scale(1.05)' : 'scale(1)',
                                                    opacity: saving.fotos ? 0.5 : 1,
                                                    backgroundColor: editing && index !== 0 ? '#eff6ff' : 'transparent'
                                                }}
                                            >
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                                    alt={`Miniatura ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                {index === 0 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 5px',
                                                        borderRadius: '4px',
                                                        fontWeight: '700',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                    }}>
                                                        ⭐
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Subir fotos (modo edición) */}
                            {editing && (
                                <div style={{ 
                                    padding: '1rem', 
                                    borderTop: '1px solid #e5e7eb',
                                    backgroundColor: '#f9fafb'
                                }}>
                                    <label style={{ 
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#374151',
                                        marginBottom: '0.5rem'
                                    }}>
                                        📸 Añadir más fotos
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    {newPhotos.length > 0 && (
                                        <button
                                            onClick={handleAddPhotos}
                                            disabled={saving.fotos}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                opacity: saving.fotos ? 0.5 : 1
                                            }}
                                        >
                                            {saving.fotos ? '⏳ Subiendo...' : `📤 Subir ${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ 
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            backgroundColor: '#f9fafb'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
                            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Sin fotos</p>
                            {editing && (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            marginBottom: '0.5rem'
                                        }}
                                    />
                                    {newPhotos.length > 0 && (
                                        <button
                                            onClick={handleAddPhotos}
                                            disabled={saving.fotos}
                                            style={{
                                                width: '100%',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {saving.fotos ? '⏳ Subiendo...' : `📤 Subir ${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''}`}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Título y estado */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{ 
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '0.75rem'
                    }}>
                        {seed.nombre_comercial}
                    </h1>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                            backgroundColor: estadoBadge.bg,
                            color: estadoBadge.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                        }}>
                            {estadoBadge.text}
                        </span>
                        {seed.variedad?.especie?.nombre_comun && (
                            <span style={{
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                🌿 {seed.variedad.especie.nombre_comun}
                            </span>
                        )}
                        {seed.variedad?.nombre_variedad && (
                            <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                🌾 {seed.variedad.nombre_variedad}
                            </span>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 1: LOTE */}
                <CollapsibleSection
                    title="📦 Información del Lote"
                    isExpanded={expandedSection === 'lote'}
                    onToggle={() => toggleSection('lote')}
                    color="#10b981"
                    bgColor="#d1fae5"
                    editing={editing}
                    saving={saving.lote}
                    onSave={handleSaveLote}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        <Field label="Nombre Comercial" fullWidth>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.nombre_comercial || ''}
                                    onChange={(e) => updateLoteField('nombre_comercial', e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            ) : (
                                <p style={valueStyle}>{seed.nombre_comercial}</p>
                            )}
                        </Field>

                        <Field label="Marca">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.marca || ''}
                                    onChange={(e) => updateLoteField('marca', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>{seed.marca || '—'}</p>
                            )}
                        </Field>

                        <Field label="Número Lote">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.numero_lote || ''}
                                    onChange={(e) => updateLoteField('numero_lote', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>{seed.numero_lote || '—'}</p>
                            )}
                        </Field>

                        <Field label="Origen">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.origen || ''}
                                    onChange={(e) => updateLoteField('origen', e.target.value)}
                                    style={inputStyle}
                                    placeholder="Ej: Huerta Urtzi"
                                />
                            ) : (
                                <p style={valueStyle}>{seed.origen || '—'}</p>
                            )}
                        </Field>

                        <Field label="Generación">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.generacion || ''}
                                    onChange={(e) => updateLoteField('generacion', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>{seed.generacion || '—'}</p>
                            )}
                        </Field>

                        <Field label="Estado">
                            {editing ? (
                                <select
                                    value={editData?.estado || 'activo'}
                                    onChange={(e) => updateLoteField('estado', e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="activo">Activo</option>
                                    <option value="agotado">Agotado</option>
                                    <option value="vencido">Vencido</option>
                                    <option value="descartado">Descartado</option>
                                </select>
                            ) : (
                                <p style={valueStyle}>{estadoBadge.text}</p>
                            )}
                        </Field>

                        <Field label="Cantidad Restante">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.cantidad_restante ?? ''}
                                    onChange={(e) => updateLoteField('cantidad_restante', e.target.value)}
                                    style={inputStyle}
                                    min="0"
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.cantidad_restante ?? '—'} {seed.cantidad_restante && 'semillas'}
                                </p>
                            )}
                        </Field>

                        <Field label="Cantidad Estimada">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.cantidad_estimada ?? ''}
                                    onChange={(e) => updateLoteField('cantidad_estimada', e.target.value)}
                                    style={inputStyle}
                                    min="0"
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.cantidad_estimada ?? '—'} {seed.cantidad_estimada && 'semillas'}
                                </p>
                            )}
                        </Field>

                        <Field label="Año Producción">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.anno_produccion ?? ''}
                                    onChange={(e) => updateLoteField('anno_produccion', e.target.value)}
                                    style={inputStyle}
                                    min="1900"
                                    max="2100"
                                />
                            ) : (
                                <p style={valueStyle}>{seed.anno_produccion || '—'}</p>
                            )}
                        </Field>

                        <Field label="Fecha Adquisición">
                            {editing ? (
                                <input
                                    type="date"
                                    value={formatDateInput(editData?.fecha_adquisicion)}
                                    onChange={(e) => updateLoteField('fecha_adquisicion', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.fecha_adquisicion ? new Date(seed.fecha_adquisicion).toLocaleDateString('es-ES') : '—'}
                                </p>
                            )}
                        </Field>

                        <Field label="Fecha Vencimiento">
                            {editing ? (
                                <input
                                    type="date"
                                    value={formatDateInput(editData?.fecha_vencimiento)}
                                    onChange={(e) => updateLoteField('fecha_vencimiento', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.fecha_vencimiento ? new Date(seed.fecha_vencimiento).toLocaleDateString('es-ES') : '—'}
                                </p>
                            )}
                        </Field>

                        <Field label="Lugar Almacenamiento" fullWidth>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.lugar_almacenamiento || ''}
                                    onChange={(e) => updateLoteField('lugar_almacenamiento', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>{seed.lugar_almacenamiento || '—'}</p>
                            )}
                        </Field>

                        <Field label="Temperatura (°C)">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.temperatura_almacenamiento_c ?? ''}
                                    onChange={(e) => updateLoteField('temperatura_almacenamiento_c', e.target.value)}
                                    style={inputStyle}
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.temperatura_almacenamiento_c ?? '—'}{seed.temperatura_almacenamiento_c !== null && '°C'}
                                </p>
                            )}
                        </Field>

                        <Field label="Humedad (%)">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.humedad_relativa ?? ''}
                                    onChange={(e) => updateLoteField('humedad_relativa', e.target.value)}
                                    style={inputStyle}
                                    min="0"
                                    max="100"
                                />
                            ) : (
                                <p style={valueStyle}>
                                    {seed.humedad_relativa ?? '—'}{seed.humedad_relativa !== null && '%'}
                                </p>
                            )}
                        </Field>

                        <Field label="Notas" fullWidth>
                            {editing ? (
                                <textarea
                                    value={editData?.notas || ''}
                                    onChange={(e) => updateLoteField('notas', e.target.value)}
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                />
                            ) : (
                                <p style={{ ...valueStyle, whiteSpace: 'pre-wrap' }}>{seed.notas || '—'}</p>
                            )}
                        </Field>
                    </div>
                </CollapsibleSection>

                {/* SECCIÓN 2: VARIEDAD */}
                {seed.variedad && (
                    <CollapsibleSection
                        title={`🌾 ${seed.variedad.nombre_variedad || 'Variedad'}`}
                        isExpanded={expandedSection === 'variedad'}
                        onToggle={() => toggleSection('variedad')}
                        color="#d97706"
                        bgColor="#fef3c7"
                        editing={editing}
                        saving={saving.variedad}
                        onSave={handleSaveVariedad}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <Field label="Nombre Variedad" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.nombre_variedad || ''}
                                        onChange={(e) => updateVariedadField('nombre_variedad', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.nombre_variedad}</p>
                                )}
                            </Field>

                            <Field label="Color Fruto">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.color_fruto || ''}
                                        onChange={(e) => updateVariedadField('color_fruto', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.color_fruto || '—'}</p>
                                )}
                            </Field>

                            <Field label="Sabor">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.sabor || ''}
                                        onChange={(e) => updateVariedadField('sabor', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.sabor || '—'}</p>
                                )}
                            </Field>

                            <Field label="Tamaño Planta">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.tamanio_planta || ''}
                                        onChange={(e) => updateVariedadField('tamanio_planta', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.tamanio_planta || '—'}</p>
                                )}
                            </Field>

                            <Field label="Procedencia">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.procedencia || ''}
                                        onChange={(e) => updateVariedadField('procedencia', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.procedencia ? `📍 ${seed.variedad.procedencia}` : '—'}</p>
                                )}
                            </Field>

                            <Field label="Profundidad Siembra (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.profundidad_siembra_cm ?? ''}
                                        onChange={(e) => updateVariedadField('profundidad_siembra_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.profundidad_siembra_cm ?? '—'} {seed.variedad.profundidad_siembra_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Plantas (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.distancia_plantas_cm ?? ''}
                                        onChange={(e) => updateVariedadField('distancia_plantas_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.distancia_plantas_cm ?? '—'} {seed.variedad.distancia_plantas_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Surcos (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.distancia_surcos_cm ?? ''}
                                        onChange={(e) => updateVariedadField('distancia_surcos_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.distancia_surcos_cm ?? '—'} {seed.variedad.distancia_surcos_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Días Germinación">
                                {editing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_germinacion_min ?? ''}
                                            onChange={(e) => updateVariedadField('dias_germinacion_min', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_germinacion_max ?? ''}
                                            onChange={(e) => updateVariedadField('dias_germinacion_max', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.dias_germinacion_min && seed.variedad.dias_germinacion_max
                                            ? `${seed.variedad.dias_germinacion_min} - ${seed.variedad.dias_germinacion_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Días hasta Cosecha">
                                {editing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_hasta_cosecha_min ?? ''}
                                            onChange={(e) => updateVariedadField('dias_hasta_cosecha_min', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_hasta_cosecha_max ?? ''}
                                            onChange={(e) => updateVariedadField('dias_hasta_cosecha_max', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.dias_hasta_cosecha_min && seed.variedad.dias_hasta_cosecha_max
                                            ? `${seed.variedad.dias_hasta_cosecha_min} - ${seed.variedad.dias_hasta_cosecha_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Tipo Polinización">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.tipo_polinizacion || ''}
                                        onChange={(e) => updateVariedadField('tipo_polinizacion', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={{ ...valueStyle, textTransform: 'capitalize' }}>{seed.variedad.tipo_polinizacion || '—'}</p>
                                )}
                            </Field>

                            <Field label="Generación">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.generacion || ''}
                                        onChange={(e) => updateVariedadField('generacion', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.generacion || '—'}</p>
                                )}
                            </Field>

                            <Field label="Resistencias" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.resistencias || []).join(', ')}
                                        onChange={(e) => updateVariedadField('resistencias', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                                        style={inputStyle}
                                        placeholder="Separar con comas"
                                    />
                                ) : (
                                    <p style={valueStyle}>{(seed.variedad.resistencias || []).join(', ') || '—'}</p>
                                )}
                            </Field>

                            <Field label="Descripción" fullWidth>
                                {editing ? (
                                    <textarea
                                        value={editData?.variedad?.descripcion || ''}
                                        onChange={(e) => updateVariedadField('descripcion', e.target.value)}
                                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                    />
                                ) : (
                                    <p style={{ ...valueStyle, whiteSpace: 'pre-wrap' }}>{seed.variedad.descripcion || '—'}</p>
                                )}
                            </Field>

                            <Field fullWidth>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {editing ? (
                                        <>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!editData?.variedad?.es_hija_f1}
                                                    onChange={(e) => updateVariedadField('es_hija_f1', e.target.checked)}
                                                />
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Híbrido F1</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!editData?.variedad?.es_variedad_antigua}
                                                    onChange={(e) => updateVariedadField('es_variedad_antigua', e.target.checked)}
                                                />
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Variedad Antigua</span>
                                            </label>
                                        </>
                                    ) : (
                                        <>
                                            {seed.variedad.es_hija_f1 && (
                                                <span style={{
                                                    backgroundColor: '#dbeafe',
                                                    color: '#1e40af',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Híbrido F1
                                                </span>
                                            )}
                                            {seed.variedad.es_variedad_antigua && (
                                                <span style={{
                                                    backgroundColor: '#fed7aa',
                                                    color: '#92400e',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Variedad Antigua
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Field>
                        </div>
                    </CollapsibleSection>
                )}

                {/* SECCIÓN 3: PLANTACIÓN (ESPECIE) */}
                {seed.variedad?.especie && (
                    <CollapsibleSection
                        title={`🌱 Plantación (${seed.variedad.especie.nombre_comun || 'Especie'})`}
                        isExpanded={expandedSection === 'plantacion'}
                        onToggle={() => toggleSection('plantacion')}
                        color="#8b5cf6"
                        bgColor="#ede9fe"
                        editing={editing}
                        saving={saving.especie}
                        onSave={handleSaveEspecie}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <Field label="Nombre Común" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_comun || ''}
                                        onChange={(e) => updateEspecieField('nombre_comun', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.nombre_comun}</p>
                                )}
                            </Field>

                            <Field label="Nombre Científico" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_cientifico || ''}
                                        onChange={(e) => updateEspecieField('nombre_cientifico', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={{ ...valueStyle, fontStyle: 'italic' }}>{seed.variedad.especie.nombre_cientifico || '—'}</p>
                                )}
                            </Field>

                            <Field label="Familia Botánica">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.familia_botanica || ''}
                                        onChange={(e) => updateEspecieField('familia_botanica', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.familia_botanica || '—'}</p>
                                )}
                            </Field>

                            <Field label="Género">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.genero || ''}
                                        onChange={(e) => updateEspecieField('genero', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.genero || '—'}</p>
                                )}
                            </Field>

                            <Field label="Tipo Cultivo">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.tipo_cultivo || ''}
                                        onChange={(e) => updateEspecieField('tipo_cultivo', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.tipo_cultivo || '—'}</p>
                                )}
                            </Field>

                            <Field label="Exposición Solar">
                                {editing ? (
                                    <select
                                        value={editData?.variedad?.especie?.exposicion_solar || ''}
                                        onChange={(e) => updateEspecieField('exposicion_solar', e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="total">☀️ Total</option>
                                        <option value="parcial">⛅ Parcial</option>
                                        <option value="sombra">🌑 Sombra</option>
                                    </select>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.especie.exposicion_solar === 'total' && '☀️ Total'}
                                        {seed.variedad.especie.exposicion_solar === 'parcial' && '⛅ Parcial'}
                                        {seed.variedad.especie.exposicion_solar === 'sombra' && '🌑 Sombra'}
                                        {!seed.variedad.especie.exposicion_solar && '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Frecuencia Riego">
                                {editing ? (
                                    <select
                                        value={editData?.variedad?.especie?.frecuencia_riego || ''}
                                        onChange={(e) => updateEspecieField('frecuencia_riego', e.target.value)}
                                        style={inputStyle}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="diario">💧 Diario</option>
                                        <option value="cada_dos_dias">💧💧 Cada 2 días</option>
                                        <option value="semanal">📅 Semanal</option>
                                        <option value="cada_dos_semanas">📅📅 Cada 2 semanas</option>
                                        <option value="mensual">🗓️ Mensual</option>
                                    </select>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.especie.frecuencia_riego === 'diario' && '💧 Diario'}
                                        {seed.variedad.especie.frecuencia_riego === 'cada_dos_dias' && '💧💧 Cada 2 días'}
                                        {seed.variedad.especie.frecuencia_riego === 'semanal' && '📅 Semanal'}
                                        {seed.variedad.especie.frecuencia_riego === 'cada_dos_semanas' && '📅📅 Cada 2 semanas'}
                                        {seed.variedad.especie.frecuencia_riego === 'mensual' && '🗓️ Mensual'}
                                        {!seed.variedad.especie.frecuencia_riego && '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Profundidad Siembra (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.profundidad_siembra_cm ?? ''}
                                        onChange={(e) => updateEspecieField('profundidad_siembra_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.profundidad_siembra_cm ?? '—'} {seed.variedad.especie.profundidad_siembra_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Plantas (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.distancia_plantas_cm ?? ''}
                                        onChange={(e) => updateEspecieField('distancia_plantas_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.distancia_plantas_cm ?? '—'} {seed.variedad.especie.distancia_plantas_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Surcos (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.distancia_surcos_cm ?? ''}
                                        onChange={(e) => updateEspecieField('distancia_surcos_cm', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.distancia_surcos_cm ?? '—'} {seed.variedad.especie.distancia_surcos_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Días Germinación">
                                {editing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_germinacion_min ?? ''}
                                            onChange={(e) => updateEspecieField('dias_germinacion_min', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_germinacion_max ?? ''}
                                            onChange={(e) => updateEspecieField('dias_germinacion_max', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.especie.dias_germinacion_min && seed.variedad.especie.dias_germinacion_max
                                            ? `${seed.variedad.especie.dias_germinacion_min} - ${seed.variedad.especie.dias_germinacion_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Días hasta Trasplante">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.dias_hasta_trasplante ?? ''}
                                        onChange={(e) => updateEspecieField('dias_hasta_trasplante', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.dias_hasta_trasplante ?? '—'} {seed.variedad.especie.dias_hasta_trasplante && 'días'}</p>
                                )}
                            </Field>

                            <Field label="Días hasta Cosecha">
                                {editing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_hasta_cosecha_min ?? ''}
                                            onChange={(e) => updateEspecieField('dias_hasta_cosecha_min', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_hasta_cosecha_max ?? ''}
                                            onChange={(e) => updateEspecieField('dias_hasta_cosecha_max', e.target.value)}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p style={valueStyle}>
                                        {seed.variedad.especie.dias_hasta_cosecha_min && seed.variedad.especie.dias_hasta_cosecha_max
                                            ? `${seed.variedad.especie.dias_hasta_cosecha_min} - ${seed.variedad.especie.dias_hasta_cosecha_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Temperatura Mínima (°C)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.temperatura_minima_c ?? ''}
                                        onChange={(e) => updateEspecieField('temperatura_minima_c', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.temperatura_minima_c ?? '—'}{seed.variedad.especie.temperatura_minima_c !== null && '°C'}</p>
                                )}
                            </Field>

                            <Field label="Temperatura Máxima (°C)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.temperatura_maxima_c ?? ''}
                                        onChange={(e) => updateEspecieField('temperatura_maxima_c', e.target.value)}
                                        style={inputStyle}
                                    />
                                ) : (
                                    <p style={valueStyle}>{seed.variedad.especie.temperatura_maxima_c ?? '—'}{seed.variedad.especie.temperatura_maxima_c !== null && '°C'}</p>
                                )}
                            </Field>

                            <Field label="Meses Siembra Interior" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.especie?.meses_siembra_interior || []).join(', ')}
                                        onChange={(e) => updateEspecieField('meses_siembra_interior', e.target.value.split(',').map(m => parseInt(m.trim())).filter(n => !isNaN(n)))}
                                        style={inputStyle}
                                        placeholder="1-12 separados por coma"
                                    />
                                ) : (
                                    <p style={valueStyle}>
                                        {(seed.variedad.especie.meses_siembra_interior || []).length > 0 
                                            ? seed.variedad.especie.meses_siembra_interior.map(m => {
                                                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                                return meses[m - 1] || m;
                                            }).join(', ')
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Meses Siembra Exterior" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.especie?.meses_siembra_exterior || []).join(', ')}
                                        onChange={(e) => updateEspecieField('meses_siembra_exterior', e.target.value.split(',').map(m => parseInt(m.trim())).filter(n => !isNaN(n)))}
                                        style={inputStyle}
                                        placeholder="1-12 separados por coma"
                                    />
                                ) : (
                                    <p style={valueStyle}>
                                        {(seed.variedad.especie.meses_siembra_exterior || []).length > 0 
                                            ? seed.variedad.especie.meses_siembra_exterior.map(m => {
                                                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                                return meses[m - 1] || m;
                                            }).join(', ')
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Zonas Climáticas" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.especie?.zonas_climaticas_preferidas || []).join(', ')}
                                        onChange={(e) => updateEspecieField('zonas_climaticas_preferidas', e.target.value.split(',').map(z => z.trim()).filter(Boolean))}
                                        style={inputStyle}
                                        placeholder="Separar con comas"
                                    />
                                ) : (
                                    <p style={valueStyle}>{(seed.variedad.especie.zonas_climaticas_preferidas || []).join(', ') || '—'}</p>
                                )}
                            </Field>

                            <Field label="Descripción" fullWidth>
                                {editing ? (
                                    <textarea
                                        value={editData?.variedad?.especie?.descripcion || ''}
                                        onChange={(e) => updateEspecieField('descripcion', e.target.value)}
                                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                    />
                                ) : (
                                    <p style={{ ...valueStyle, whiteSpace: 'pre-wrap' }}>{seed.variedad.especie.descripcion || '—'}</p>
                                )}
                            </Field>
                        </div>
                    </CollapsibleSection>
                )}
            </div>
        </div>
    );
}

// Componente Sección Colapsable
function CollapsibleSection({ title, isExpanded, onToggle, color, bgColor, children, editing, saving, onSave }) {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            marginBottom: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
        }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.25rem',
                    backgroundColor: isExpanded ? bgColor : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                }}
            >
                <span style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: color
                }}>
                    {title}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {editing && onSave && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            disabled={saving}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: saving ? 0.5 : 1
                            }}
                        >
                            {saving ? '⏳' : '💾 Guardar'}
                        </button>
                    )}
                    <span style={{
                        fontSize: '1.2rem',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                        display: 'flex'
                    }}>
                        ▼
                    </span>
                </div>
            </button>
            <div style={{
                maxHeight: isExpanded ? '5000px' : '0',
                opacity: isExpanded ? '1' : '0',
                overflow: isExpanded ? 'visible' : 'hidden',
                transition: 'all 0.3s ease',
                padding: isExpanded ? '1.25rem' : '0 1.25rem'
            }}>
                {children}
            </div>
        </div>
    );
}

// Componente Campo
function Field({ label, children, fullWidth }) {
    return (
        <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.35rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                }}>
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}

// Estilos compartidos
const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    transition: 'all 0.2s',
    outline: 'none'
};

const valueStyle = {
    fontSize: '0.95rem',
    color: '#111827',
    margin: 0,
    lineHeight: '1.6'
};

export default SeedDetail;
