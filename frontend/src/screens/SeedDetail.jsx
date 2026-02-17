import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';
import '../styles/SeedDetail.css';

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
                codigo_interno: editData.variedad.codigo_interno,
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
                es_hibrido_f1: !!editData.variedad.es_hibrido_f1,
                es_variedad_antigua: !!editData.variedad.es_variedad_antigua
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
            'activo': { text: 'Activo', className: 'seeddetail-badge--status seeddetail-badge--activo' },
            'agotado': { text: 'Agotado', className: 'seeddetail-badge--status seeddetail-badge--agotado' },
            'descartado': { text: 'Descartado', className: 'seeddetail-badge--status seeddetail-badge--descartado' },
            'vencido': { text: 'Vencido', className: 'seeddetail-badge--status seeddetail-badge--vencido' }
        };
        return badges[estado] || badges['activo'];
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (loading) {
        return (
            <div className="seeddetail-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!seed) {
        return (
            <div className="seeddetail-empty">
                <h2>Semilla no encontrada</h2>
                <button onClick={() => navigate('/inventory')} className="btn btn-primary">
                    Volver al inventario
                </button>
            </div>
        );
    }

    const estadoBadge = getEstadoBadge(seed.estado);

    return (
        <div className="seeddetail-container">
            {/* Header fijo */}
            <div className="seeddetail-header">
                <div className="seeddetail-header__content">
                    <button 
                        onClick={() => navigate('/inventory')} 
                        className="seeddetail-header__back-btn"
                    >
                        ←
                    </button>
                    <div className="seeddetail-header__actions">
                        {!editing ? (
                            <>
                                <button 
                                    onClick={() => setEditing(true)} 
                                    className="seeddetail-header__edit-btn"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onClick={handleDelete} 
                                    className="seeddetail-header__delete-btn"
                                >
                                    🗑️
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setEditing(false)} 
                                className="seeddetail-header__exit-btn"
                            >
                                ✖ Salir
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="seeddetail-content">
                {/* Mensajes */}
                {message && (
                    <div className={`seeddetail-message ${message.type === 'success' ? 'seeddetail-message--success' : 'seeddetail-message--error'}`}>
                        {message.text}
                    </div>
                )}

                {/* Slider de fotos moderno */}
                <div className="seeddetail-gallery-card">
                    {seed.fotos && seed.fotos.length > 0 ? (
                        <>
                            {/* Foto principal */}
                            <div className="seeddetail-photo-main">
                                <img
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${seed.fotos[currentPhotoIndex]}`}
                                    alt={seed.nombre_comercial}
                                    className="seeddetail-photo-image"
                                />
                                
                                {/* Contador */}
                                <div className="seeddetail-photo-counter">
                                    {currentPhotoIndex + 1} / {seed.fotos.length}
                                </div>

                                {/* Botón eliminar */}
                                {editing && (
                                    <button
                                        onClick={() => handleRemovePhoto(seed.fotos[currentPhotoIndex])}
                                        disabled={saving.fotos}
                                        className="seeddetail-photo-delete"
                                    >
                                        ✖
                                    </button>
                                )}

                                {/* Flechas de navegación */}
                                {seed.fotos.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevPhoto}
                                            className="seeddetail-photo-nav seeddetail-photo-nav--prev"
                                        >
                                            ◀
                                        </button>
                                        <button
                                            onClick={nextPhoto}
                                            className="seeddetail-photo-nav seeddetail-photo-nav--next"
                                        >
                                            ▶
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Miniaturas */}
                            {seed.fotos.length > 1 && (
                                <div className="seeddetail-thumbnails">
                                    {seed.fotos.map((photo, index) => (
                                        <div key={index} className="seeddetail-thumbnail">
                                            <button
                                                onClick={() => {
                                                    if (editing && index !== 0) {
                                                        handleSetPrincipalPhoto(photo);
                                                    } else {
                                                        setCurrentPhotoIndex(index);
                                                    }
                                                }}
                                                disabled={saving.fotos || (editing && index === 0)}
                                                className={`seeddetail-thumbnail-btn ${currentPhotoIndex === index ? 'is-active' : ''} ${editing && index !== 0 ? 'is-editable' : ''}`}
                                            >
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                                    alt={`Miniatura ${index + 1}`}
                                                    className="seeddetail-thumbnail-img"
                                                />
                                                {index === 0 && (
                                                    <div className="seeddetail-thumbnail-star">
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
                                <div className="seeddetail-upload">
                                    <label className="seeddetail-upload__label">
                                        📸 Añadir más fotos
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
                                        className="seeddetail-upload__input"
                                    />
                                    {newPhotos.length > 0 && (
                                        <button
                                            onClick={handleAddPhotos}
                                            disabled={saving.fotos}
                                            className="seeddetail-upload__btn"
                                        >
                                            {saving.fotos ? '⏳ Subiendo...' : `📤 Subir ${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="seeddetail-empty-photos">
                            <div className="seeddetail-empty-photos__icon">📸</div>
                            <p className="seeddetail-empty-photos__text">Sin fotos</p>
                            {editing && (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setNewPhotos(Array.from(e.target.files || []))}
                                        className="seeddetail-upload__input"
                                    />
                                    {newPhotos.length > 0 && (
                                        <button
                                            onClick={handleAddPhotos}
                                            disabled={saving.fotos}
                                            className="seeddetail-upload__btn"
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
                <div className="seeddetail-summary">
                    <h1 className="seeddetail-summary__title">
                        {seed.nombre_comercial}
                    </h1>
                    <div className="seeddetail-summary__badges">
                        <span className={`seeddetail-badge ${estadoBadge.className}`}>
                            {estadoBadge.text}
                        </span>
                        {seed.variedad?.especie?.nombre_comun && (
                            <span className="seeddetail-badge seeddetail-badge--species">
                                🌿 {seed.variedad.especie.nombre_comun}
                            </span>
                        )}
                        {seed.variedad?.nombre_variedad && (
                            <span className="seeddetail-badge seeddetail-badge--variety">
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
                    variant="lote"
                    editing={editing}
                    saving={saving.lote}
                    onSave={handleSaveLote}
                >
                    <div className="seeddetail-grid seeddetail-grid--two">
                        <Field label="Nombre Comercial" fullWidth>
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.nombre_comercial || ''}
                                    onChange={(e) => updateLoteField('nombre_comercial', e.target.value)}
                                    className="seeddetail-input"
                                    required
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.nombre_comercial}</p>
                            )}
                        </Field>

                        <Field label="Marca">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.marca || ''}
                                    onChange={(e) => updateLoteField('marca', e.target.value)}
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.marca || '—'}</p>
                            )}
                        </Field>

                        <Field label="Número Lote">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.numero_lote || ''}
                                    onChange={(e) => updateLoteField('numero_lote', e.target.value)}
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.numero_lote || '—'}</p>
                            )}
                        </Field>

                        <Field label="Origen">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.origen || ''}
                                    onChange={(e) => updateLoteField('origen', e.target.value)}
                                    className="seeddetail-input"
                                    placeholder="Ej: Huerta Urtzi"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.origen || '—'}</p>
                            )}
                        </Field>

                        <Field label="Generación">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editData?.generacion || ''}
                                    onChange={(e) => updateLoteField('generacion', e.target.value)}
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.generacion || '—'}</p>
                            )}
                        </Field>

                        <Field label="Estado">
                            {editing ? (
                                <select
                                    value={editData?.estado || 'activo'}
                                    onChange={(e) => updateLoteField('estado', e.target.value)}
                                    className="seeddetail-input"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="agotado">Agotado</option>
                                    <option value="vencido">Vencido</option>
                                    <option value="descartado">Descartado</option>
                                </select>
                            ) : (
                                <p className="seeddetail-value">{estadoBadge.text}</p>
                            )}
                        </Field>

                        <Field label="Cantidad Restante">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.cantidad_restante ?? ''}
                                    onChange={(e) => updateLoteField('cantidad_restante', e.target.value)}
                                    className="seeddetail-input"
                                    min="0"
                                />
                            ) : (
                                <p className="seeddetail-value">
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
                                    className="seeddetail-input"
                                    min="0"
                                />
                            ) : (
                                <p className="seeddetail-value">
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
                                    className="seeddetail-input"
                                    min="1900"
                                    max="2100"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.anno_produccion || '—'}</p>
                            )}
                        </Field>

                        <Field label="Fecha Adquisición">
                            {editing ? (
                                <input
                                    type="date"
                                    value={formatDateInput(editData?.fecha_adquisicion)}
                                    onChange={(e) => updateLoteField('fecha_adquisicion', e.target.value)}
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">
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
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">
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
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">{seed.lugar_almacenamiento || '—'}</p>
                            )}
                        </Field>

                        <Field label="Temperatura (°C)">
                            {editing ? (
                                <input
                                    type="number"
                                    value={editData?.temperatura_almacenamiento_c ?? ''}
                                    onChange={(e) => updateLoteField('temperatura_almacenamiento_c', e.target.value)}
                                    className="seeddetail-input"
                                />
                            ) : (
                                <p className="seeddetail-value">
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
                                    className="seeddetail-input"
                                    min="0"
                                    max="100"
                                />
                            ) : (
                                <p className="seeddetail-value">
                                    {seed.humedad_relativa ?? '—'}{seed.humedad_relativa !== null && '%'}
                                </p>
                            )}
                        </Field>

                        <Field label="Notas" fullWidth>
                            {editing ? (
                                <textarea
                                    value={editData?.notas || ''}
                                    onChange={(e) => updateLoteField('notas', e.target.value)}
                                    className="seeddetail-input seeddetail-input--textarea"
                                />
                            ) : (
                                <p className="seeddetail-value seeddetail-value--prewrap">{seed.notas || '—'}</p>
                            )}
                        </Field>
                    </div>
                </CollapsibleSection>

                {/* SECCIÓN 2: VARIEDAD */}
                {seed.variedad && (
                    <CollapsibleSection
                        title={`🌾 Detalles (${seed.variedad.nombre_variedad || 'Variedad'})`}
                        isExpanded={expandedSection === 'variedad'}
                        onToggle={() => toggleSection('variedad')}
                        variant="variedad"
                        editing={editing}
                        saving={saving.variedad}
                        onSave={handleSaveVariedad}
                    >
                        <div className="seeddetail-grid seeddetail-grid--two">
                            <Field label="Nombre Variedad" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.nombre_variedad || ''}
                                        onChange={(e) => updateVariedadField('nombre_variedad', e.target.value)}
                                        className="seeddetail-input"
                                        required
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.nombre_variedad}</p>
                                )}
                            </Field>

                            <Field label="Código Interno">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.codigo_interno || ''}
                                        onChange={(e) => updateVariedadField('codigo_interno', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.codigo_interno || '—'}</p>
                                )}
                            </Field>

                            <Field label="Color Fruto">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.color_fruto || ''}
                                        onChange={(e) => updateVariedadField('color_fruto', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.color_fruto || '—'}</p>
                                )}
                            </Field>

                            <Field label="Sabor">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.sabor || ''}
                                        onChange={(e) => updateVariedadField('sabor', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.sabor || '—'}</p>
                                )}
                            </Field>

                            <Field label="Tamaño Planta">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.tamanio_planta || ''}
                                        onChange={(e) => updateVariedadField('tamanio_planta', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.tamanio_planta || '—'}</p>
                                )}
                            </Field>

                            <Field label="Profundidad Siembra (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.profundidad_siembra_cm ?? ''}
                                        onChange={(e) => updateVariedadField('profundidad_siembra_cm', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.profundidad_siembra_cm ?? '—'} {seed.variedad.profundidad_siembra_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Plantas (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.distancia_plantas_cm ?? ''}
                                        onChange={(e) => updateVariedadField('distancia_plantas_cm', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.distancia_plantas_cm ?? '—'} {seed.variedad.distancia_plantas_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Surcos (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.distancia_surcos_cm ?? ''}
                                        onChange={(e) => updateVariedadField('distancia_surcos_cm', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.distancia_surcos_cm ?? '—'} {seed.variedad.distancia_surcos_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Días Germinación">
                                {editing ? (
                                    <div className="seeddetail-inline-row">
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_germinacion_min ?? ''}
                                            onChange={(e) => updateVariedadField('dias_germinacion_min', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_germinacion_max ?? ''}
                                            onChange={(e) => updateVariedadField('dias_germinacion_max', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p className="seeddetail-value">
                                        {seed.variedad.dias_germinacion_min && seed.variedad.dias_germinacion_max
                                            ? `${seed.variedad.dias_germinacion_min} - ${seed.variedad.dias_germinacion_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Días hasta Cosecha">
                                {editing ? (
                                    <div className="seeddetail-inline-row">
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_hasta_cosecha_min ?? ''}
                                            onChange={(e) => updateVariedadField('dias_hasta_cosecha_min', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.dias_hasta_cosecha_max ?? ''}
                                            onChange={(e) => updateVariedadField('dias_hasta_cosecha_max', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p className="seeddetail-value">
                                        {seed.variedad.dias_hasta_cosecha_min && seed.variedad.dias_hasta_cosecha_max
                                            ? `${seed.variedad.dias_hasta_cosecha_min} - ${seed.variedad.dias_hasta_cosecha_max} días`
                                            : '—'}
                                    </p>
                                )}
                            </Field>

                            <Field label="Resistencias" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.resistencias || []).join(', ')}
                                        onChange={(e) => updateVariedadField('resistencias', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                                        className="seeddetail-input"
                                        placeholder="Separar con comas"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{(seed.variedad.resistencias || []).join(', ') || '—'}</p>
                                )}
                            </Field>

                            <Field label="Descripción" fullWidth>
                                {editing ? (
                                    <textarea
                                        value={editData?.variedad?.descripcion || ''}
                                        onChange={(e) => updateVariedadField('descripcion', e.target.value)}
                                        className="seeddetail-input seeddetail-input--textarea"
                                    />
                                ) : (
                                    <p className="seeddetail-value seeddetail-value--prewrap">{seed.variedad.descripcion || '—'}</p>
                                )}
                            </Field>

                            <Field fullWidth>
                                <div className="seeddetail-toggle-row">
                                    {editing ? (
                                        <>
                                            <label className="seeddetail-toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={!!editData?.variedad?.es_hibrido_f1}
                                                    onChange={(e) => updateVariedadField('es_hibrido_f1', e.target.checked)}
                                                />
                                                <span className="seeddetail-toggle-text">Híbrido F1</span>
                                            </label>
                                            <label className="seeddetail-toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={!!editData?.variedad?.es_variedad_antigua}
                                                    onChange={(e) => updateVariedadField('es_variedad_antigua', e.target.checked)}
                                                />
                                                <span className="seeddetail-toggle-text">Variedad Antigua</span>
                                            </label>
                                        </>
                                    ) : (
                                        <>
                                            {seed.variedad.es_hibrido_f1 && (
                                                <span className="seeddetail-badge seeddetail-badge--hybrid">
                                                    Híbrido F1
                                                </span>
                                            )}
                                            {seed.variedad.es_variedad_antigua && (
                                                <span className="seeddetail-badge seeddetail-badge--heritage">
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
                        title={`Plantación (${seed.variedad.nombre_variedad || 'Variedad'})`}
                        isExpanded={expandedSection === 'plantacion'}
                        onToggle={() => toggleSection('plantacion')}
                        variant="plantacion"
                        editing={editing}
                        saving={saving.especie}
                        onSave={handleSaveEspecie}
                    >
                        <div className="seeddetail-grid seeddetail-grid--two">
                            <Field label="Nombre Común" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_comun || ''}
                                        onChange={(e) => updateEspecieField('nombre_comun', e.target.value)}
                                        className="seeddetail-input"
                                        required
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.nombre_comun}</p>
                                )}
                            </Field>

                            <Field label="Nombre Científico" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_cientifico || ''}
                                        onChange={(e) => updateEspecieField('nombre_cientifico', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value seeddetail-value--italic">{seed.variedad.especie.nombre_cientifico || '—'}</p>
                                )}
                            </Field>

                            <Field label="Familia Botánica">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.familia_botanica || ''}
                                        onChange={(e) => updateEspecieField('familia_botanica', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.familia_botanica || '—'}</p>
                                )}
                            </Field>

                            <Field label="Género">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.genero || ''}
                                        onChange={(e) => updateEspecieField('genero', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.genero || '—'}</p>
                                )}
                            </Field>

                            <Field label="Tipo Cultivo">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.tipo_cultivo || ''}
                                        onChange={(e) => updateEspecieField('tipo_cultivo', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.tipo_cultivo || '—'}</p>
                                )}
                            </Field>

                            <Field label="Exposición Solar">
                                {editing ? (
                                    <select
                                        value={editData?.variedad?.especie?.exposicion_solar || ''}
                                        onChange={(e) => updateEspecieField('exposicion_solar', e.target.value)}
                                        className="seeddetail-input"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="total">☀️ Total</option>
                                        <option value="parcial">⛅ Parcial</option>
                                        <option value="sombra">🌑 Sombra</option>
                                    </select>
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="diario">💧 Diario</option>
                                        <option value="cada_dos_dias">💧💧 Cada 2 días</option>
                                        <option value="semanal">📅 Semanal</option>
                                        <option value="cada_dos_semanas">📅📅 Cada 2 semanas</option>
                                        <option value="mensual">🗓️ Mensual</option>
                                    </select>
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.profundidad_siembra_cm ?? '—'} {seed.variedad.especie.profundidad_siembra_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Plantas (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.distancia_plantas_cm ?? ''}
                                        onChange={(e) => updateEspecieField('distancia_plantas_cm', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.distancia_plantas_cm ?? '—'} {seed.variedad.especie.distancia_plantas_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Distancia Surcos (cm)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.distancia_surcos_cm ?? ''}
                                        onChange={(e) => updateEspecieField('distancia_surcos_cm', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.distancia_surcos_cm ?? '—'} {seed.variedad.especie.distancia_surcos_cm && 'cm'}</p>
                                )}
                            </Field>

                            <Field label="Días Germinación">
                                {editing ? (
                                    <div className="seeddetail-inline-row">
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_germinacion_min ?? ''}
                                            onChange={(e) => updateEspecieField('dias_germinacion_min', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_germinacion_max ?? ''}
                                            onChange={(e) => updateEspecieField('dias_germinacion_max', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.dias_hasta_trasplante ?? '—'} {seed.variedad.especie.dias_hasta_trasplante && 'días'}</p>
                                )}
                            </Field>

                            <Field label="Días hasta Cosecha">
                                {editing ? (
                                    <div className="seeddetail-inline-row">
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_hasta_cosecha_min ?? ''}
                                            onChange={(e) => updateEspecieField('dias_hasta_cosecha_min', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Min"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={editData?.variedad?.especie?.dias_hasta_cosecha_max ?? ''}
                                            onChange={(e) => updateEspecieField('dias_hasta_cosecha_max', e.target.value)}
                                            className="seeddetail-input seeddetail-input--flex"
                                            placeholder="Max"
                                        />
                                    </div>
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.temperatura_minima_c ?? '—'}{seed.variedad.especie.temperatura_minima_c !== null && '°C'}</p>
                                )}
                            </Field>

                            <Field label="Temperatura Máxima (°C)">
                                {editing ? (
                                    <input
                                        type="number"
                                        value={editData?.variedad?.especie?.temperatura_maxima_c ?? ''}
                                        onChange={(e) => updateEspecieField('temperatura_maxima_c', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.temperatura_maxima_c ?? '—'}{seed.variedad.especie.temperatura_maxima_c !== null && '°C'}</p>
                                )}
                            </Field>

                            <Field label="Meses Siembra Interior" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={(editData?.variedad?.especie?.meses_siembra_interior || []).join(', ')}
                                        onChange={(e) => updateEspecieField('meses_siembra_interior', e.target.value.split(',').map(m => parseInt(m.trim())).filter(n => !isNaN(n)))}
                                        className="seeddetail-input"
                                        placeholder="1-12 separados por coma"
                                    />
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                        placeholder="1-12 separados por coma"
                                    />
                                ) : (
                                    <p className="seeddetail-value">
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
                                        className="seeddetail-input"
                                        placeholder="Separar con comas"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{(seed.variedad.especie.zonas_climaticas_preferidas || []).join(', ') || '—'}</p>
                                )}
                            </Field>

                            <Field label="Descripción" fullWidth>
                                {editing ? (
                                    <textarea
                                        value={editData?.variedad?.especie?.descripcion || ''}
                                        onChange={(e) => updateEspecieField('descripcion', e.target.value)}
                                        className="seeddetail-input seeddetail-input--textarea"
                                    />
                                ) : (
                                    <p className="seeddetail-value seeddetail-value--prewrap">{seed.variedad.especie.descripcion || '—'}</p>
                                )}
                            </Field>
                        </div>

                        {/* Subsección: Square Foot Gardening */}
                        {(seed.variedad.especie.square_foot_plants || editing) && (
                            <div className="seeddetail-sfg">
                                <h3 className="seeddetail-sfg__title">
                                    📐 Square Foot Gardening
                                </h3>
                                
                                <div className="seeddetail-sfg__grid">
                                    <div className="seeddetail-sfg__card">
                                        {editing ? (
                                            <>
                                                <label className="seeddetail-sfg__label">
                                                    Plantas por cuadrado
                                                </label>
                                                <input
                                                    type="number"
                                                    value={editData?.variedad?.especie?.square_foot_plants ?? ''}
                                                    onChange={(e) => updateEspecieField('square_foot_plants', e.target.value)}
                                                    className="seeddetail-input seeddetail-sfg__input"
                                                    placeholder="0"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="seeddetail-sfg__value">
                                                    {seed.variedad.especie.square_foot_plants || '—'}
                                                </div>
                                                <div className="seeddetail-sfg__meta">
                                                    planta{seed.variedad.especie.square_foot_plants !== 1 ? 's' : ''} / 30x30cm
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="seeddetail-sfg__card">
                                        {editing ? (
                                            <>
                                                <label className="seeddetail-sfg__label">
                                                    Espaciado (cm)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={editData?.variedad?.especie?.square_foot_spacing ?? ''}
                                                    onChange={(e) => updateEspecieField('square_foot_spacing', e.target.value)}
                                                    className="seeddetail-input seeddetail-sfg__input"
                                                    placeholder="0"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="seeddetail-sfg__value">
                                                    {seed.variedad.especie.square_foot_spacing || '—'}
                                                </div>
                                                <div className="seeddetail-sfg__meta">
                                                    cm entre plantas
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(seed.variedad.especie.square_foot_notes || editing) && (
                                    <div className="seeddetail-sfg__notes">
                                        {editing ? (
                                            <>
                                                <label className="seeddetail-sfg__notes-title">
                                                    💡 Notas SFG
                                                </label>
                                                <textarea
                                                    value={editData?.variedad?.especie?.square_foot_notes || ''}
                                                    onChange={(e) => updateEspecieField('square_foot_notes', e.target.value)}
                                                    className="seeddetail-input seeddetail-sfg__notes-input"
                                                    placeholder="Notas especiales para Square Foot Gardening..."
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <div className="seeddetail-sfg__notes-title">
                                                    💡 Notas:
                                                </div>
                                                <div className="seeddetail-sfg__notes-text">
                                                    {seed.variedad.especie.square_foot_notes}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="seeddetail-sfg-note">
                                    ℹ️ Square Foot Gardening: método de cultivo intensivo en cuadrados de 30x30cm
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                {/* SECCIÓN 4: ESPECIE */}
                {seed.variedad?.especie && (
                    <CollapsibleSection
                        title={`🧬 Especie (${seed.variedad.especie.nombre_comun || 'Especie'})`}
                        isExpanded={expandedSection === 'especie'}
                        onToggle={() => toggleSection('especie')}
                        variant="especie"
                        editing={editing}
                        saving={saving.especie}
                        onSave={handleSaveEspecie}
                    >
                        <div className="seeddetail-grid seeddetail-grid--two">
                            <Field label="Nombre Común" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_comun || ''}
                                        onChange={(e) => updateEspecieField('nombre_comun', e.target.value)}
                                        className="seeddetail-input"
                                        required
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.nombre_comun}</p>
                                )}
                            </Field>

                            <Field label="Nombre Científico" fullWidth>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.nombre_cientifico || ''}
                                        onChange={(e) => updateEspecieField('nombre_cientifico', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value seeddetail-value--italic">{seed.variedad.especie.nombre_cientifico || '—'}</p>
                                )}
                            </Field>

                            <Field label="Familia Botánica">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.familia_botanica || ''}
                                        onChange={(e) => updateEspecieField('familia_botanica', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.familia_botanica || '—'}</p>
                                )}
                            </Field>

                            <Field label="Género">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.genero || ''}
                                        onChange={(e) => updateEspecieField('genero', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.genero || '—'}</p>
                                )}
                            </Field>

                            <Field label="Tipo Cultivo">
                                {editing ? (
                                    <input
                                        type="text"
                                        value={editData?.variedad?.especie?.tipo_cultivo || ''}
                                        onChange={(e) => updateEspecieField('tipo_cultivo', e.target.value)}
                                        className="seeddetail-input"
                                    />
                                ) : (
                                    <p className="seeddetail-value">{seed.variedad.especie.tipo_cultivo || '—'}</p>
                                )}
                            </Field>

                            <Field label="Descripción" fullWidth>
                                {editing ? (
                                    <textarea
                                        value={editData?.variedad?.especie?.descripcion || ''}
                                        onChange={(e) => updateEspecieField('descripcion', e.target.value)}
                                        className="seeddetail-input seeddetail-input--textarea"
                                    />
                                ) : (
                                    <p className="seeddetail-value seeddetail-value--prewrap">{seed.variedad.especie.descripcion || '—'}</p>
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
function CollapsibleSection({ title, isExpanded, onToggle, variant, children, editing, saving, onSave }) {
    return (
        <div className={`seeddetail-section seeddetail-section--${variant}`}>
            <button
                onClick={onToggle}
                className={`seeddetail-section__toggle ${isExpanded ? 'is-expanded' : ''}`}
            >
                <span className="seeddetail-section__title">
                    {title}
                </span>
                <div className="seeddetail-section__actions">
                    {editing && onSave && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            disabled={saving}
                            className="seeddetail-section__save"
                        >
                            {saving ? '⏳' : '💾 Guardar'}
                        </button>
                    )}
                    <span className={`seeddetail-section__chevron ${isExpanded ? 'is-expanded' : ''}`}>
                        ▼
                    </span>
                </div>
            </button>
            <div className={`seeddetail-section__content ${isExpanded ? 'is-expanded' : ''}`}>
                {children}
            </div>
        </div>
    );
}

// Componente Campo
function Field({ label, children, fullWidth }) {
    return (
        <div className={`seeddetail-field ${fullWidth ? 'seeddetail-field--full' : ''}`}>
            {label && (
                <label className="seeddetail-field__label">
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}

export default SeedDetail;
