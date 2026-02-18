import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mySeedlingAPI } from '../services/api';

import '../styles/SeedlingDetail.css';

export default function SeedlingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seedling, setSeedling] = useState(null);
    const [varietiesInBatch, setVarietiesInBatch] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingVarietyId, setEditingVarietyId] = useState(null);
    const [updatingVarietyId, setUpdatingVarietyId] = useState(null);
    const [isEditingSeedling, setIsEditingSeedling] = useState(false);
    const [editSeedlingData, setEditSeedlingData] = useState({});
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    useEffect(() => {
        loadSeedling();
    }, [id]);

    const loadSeedling = async () => {
        try {
            setLoading(true);
            // Cargar la variedad específica
            const response = await mySeedlingAPI.getOne(id);
            const mainSeedling = response.data;
            setSeedling(mainSeedling);

            // Cargar todas las variedades del mismo lote (misma fecha + ubicación + notas)
            const allResponse = await mySeedlingAPI.list();
            const allSeedlings = allResponse.data;

            // Normalizar las fechas para comparación (tomar solo la parte de fecha YYYY-MM-DD)
            const mainDate = mainSeedling.fecha_siembra ? mainSeedling.fecha_siembra.split('T')[0] : '';
            const mainUbicacion = mainSeedling.ubicacion_descripcion || '';
            const mainNotas = mainSeedling.notas || '';

            // Filtrar por las que tengan la misma fecha + ubicación + notas
            const batchVarieties = allSeedlings.filter(s => {
                const sDate = s.fecha_siembra ? s.fecha_siembra.split('T')[0] : '';
                const sUbicacion = s.ubicacion_descripcion || '';
                const sNotas = s.notas || '';
                
                return sDate === mainDate && 
                       sUbicacion === mainUbicacion && 
                       sNotas === mainNotas;
            });

            setVarietiesInBatch(batchVarieties);
        } catch (error) {
            console.error('Error loading seedling:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este semillero?')) {
            return;
        }
        try {
            await mySeedlingAPI.delete(id);
            navigate('/my-seedling');
        } catch (error) {
            console.error('Error deleting seedling:', error);
            alert('Error al eliminar el semillero');
        }
    };

    const toggleEditVariety = (varietyId) => {
        setEditingVarietyId(editingVarietyId === varietyId ? null : varietyId);
    };

    const handleVarietyStatusChange = async (varietyId, newStatus) => {
        setUpdatingVarietyId(varietyId);
        try {
            const updateData = { estado: newStatus };
            
            // Si el estado es "GERMINADA" y no hay fecha de germinación, llenarla con hoy
            const variety = varietiesInBatch.find(v => v.id === varietyId);
            if (newStatus === 'GERMINADA' && !variety?.fecha_germinacion) {
                const today = new Date().toISOString().split('T')[0];
                updateData.fecha_germinacion = today;
            }
            
            await mySeedlingAPI.update(varietyId, updateData);
            
            // Actualizar el estado local inmediatamente
            setVarietiesInBatch(prev => prev.map(v => 
                v.id === varietyId ? { ...v, estado: newStatus } : v
            ));
            
            if (updateData.fecha_germinacion) {
                setVarietiesInBatch(prev => prev.map(v =>
                    v.id === varietyId ? { ...v, fecha_germinacion: updateData.fecha_germinacion } : v
                ));
            }
            
            setEditingVarietyId(null);
        } catch (error) {
            console.error('Error updating variety status:', error);
            alert('Error al actualizar el estado');
            loadSeedling(); // Reload si falla
        } finally {
            setUpdatingVarietyId(null);
        }
    };

    const handleDeleteVariety = async (varietyId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta variedad del semillero?')) {
            return;
        }
        try {
            await mySeedlingAPI.delete(varietyId);
            // Si solo queda una variedad, ir a mi-semillero
            if (varietiesInBatch.length === 1) {
                navigate('/my-seedling');
            } else {
                loadSeedling();
            }
        } catch (error) {
            console.error('Error deleting variety:', error);
            alert('Error al eliminar la variedad');
        }
    };

    const handleVarietyDateChange = async (varietyId, newDate) => {
        setUpdatingVarietyId(varietyId);
        try {
            await mySeedlingAPI.update(varietyId, { fecha_germinacion: newDate || null });
            loadSeedling();
            setEditingVarietyId(null);
        } catch (error) {
            console.error('Error updating germination date:', error);
            alert('Error al actualizar fecha');
        } finally {
            setUpdatingVarietyId(null);
        }
    };

    const handleSaveSeedlingEdit = async () => {
        try {
            await mySeedlingAPI.update(id, editSeedlingData);
            setIsEditingSeedling(false);
            loadSeedling();
        } catch (error) {
            console.error('Error updating seedling:', error);
            alert('Error al actualizar semillero');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getDaysFromDate = (dateString) => {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getVarietyProgressPercentage = (variety) => {
        // Progreso desde siembra hasta trasplante
        const daysGerminating = getDaysFromDate(variety.fecha_siembra);
        const maxDays = 60; // 8-9 semanas normales
        return Math.min((daysGerminating / maxDays) * 100, 100);
    };

    const getVarietyProgressStage = (variety) => {
        if (variety.estado === 'TRASPLANTADA') return 100;
        if (variety.fecha_germinacion) return 60;
        return getDaysFromDate(variety.fecha_siembra) > 7 ? 30 : 15;
    };

    if (loading) {
        return (
            <div className="seedling-detail-container">
                <div className="seedling-detail-loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!seedling) {
        return (
            <div className="seedling-detail-container">
                <div className="seedling-detail-error">
                    <h2>Semillero no encontrado</h2>
                    <button onClick={() => navigate('/my-seedling')} className="btn btn-primary">
                        Volver a Mi Semillero
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="seedling-detail-container">
            {/* Header */}
            <div className="seedling-detail-header">
                <button 
                    onClick={() => navigate('/my-seedling')}
                    className="btn-back"
                    title="Volver atrás"
                >
                    ← Volver
                </button>
                <div className="seedling-detail-title-section">
                    <h1 className="seedling-detail-title">
                        Lote del {formatDate(seedling.fecha_siembra)}
                    </h1>
                    <p className="seedling-detail-subtitle">
                        {varietiesInBatch.length} {varietiesInBatch.length === 1 ? 'variedad' : 'variedades'} • {seedling.ubicacion_descripcion || 'Sin ubicación'}
                    </p>
                </div>
                <div className="seedling-detail-actions">
                    <button 
                        onClick={() => {
                            setIsEditingSeedling(!isEditingSeedling);
                            setEditSeedlingData({
                                fecha_siembra: seedling.fecha_siembra ? seedling.fecha_siembra.split('T')[0] : '',
                                ubicacion_descripcion: seedling.ubicacion_descripcion || '',
                                notas: seedling.notas || ''
                            });
                        }}
                        className={`btn-icon btn-icon--edit ${isEditingSeedling ? 'btn-icon--edit-active' : ''}`}
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="btn-icon btn-icon--delete"
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="seedling-detail-card card">
                {!isEditingSeedling ? (
                    <div className="seedling-detail-info">
                        <div className="seedling-detail-row">
                            <span className="seedling-detail-label">Estado del Lote</span>
                            <span className="seedling-detail-value">
                                {seedling && seedling.estado === 'SEMBRADA' && '🌱 Sembrado'}
                                {seedling && seedling.estado === 'GERMINADA' && '🌱 Germinando'}
                                {seedling && seedling.estado === 'LISTA' && '🌿 Listo para trasplantar'}
                                {seedling && seedling.estado === 'TRASPLANTADA' && '🪴 Trasplantado'}
                                {!seedling?.estado && '—'}
                            </span>
                        </div>

                        <div className="seedling-detail-row">
                            <span className="seedling-detail-label">Fecha de siembra</span>
                            <span className="seedling-detail-value">{formatDate(seedling.fecha_siembra)}</span>
                        </div>

                        {seedling.ubicacion_descripcion && (
                            <div className="seedling-detail-row">
                                <span className="seedling-detail-label">Ubicación</span>
                                <span className="seedling-detail-value">{seedling.ubicacion_descripcion}</span>
                            </div>
                        )}

                        {seedling.notas && (
                            <div className="seedling-detail-row">
                                <span className="seedling-detail-label">Notas</span>
                                <span className="seedling-detail-value">{seedling.notas}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="seedling-detail-edit-form">
                        <div className="seedling-detail-form-group">
                            <label>Fecha de siembra</label>
                            <input
                                type="date"
                                value={editSeedlingData.fecha_siembra || ''}
                                onChange={(e) => setEditSeedlingData({...editSeedlingData, fecha_siembra: e.target.value})}
                                className="input"
                            />
                        </div>
                        <div className="seedling-detail-form-group">
                            <label>Ubicación</label>
                            <input
                                type="text"
                                value={editSeedlingData.ubicacion_descripcion || ''}
                                onChange={(e) => setEditSeedlingData({...editSeedlingData, ubicacion_descripcion: e.target.value})}
                                placeholder="Ej: Semillero, Bandeja 1"
                                className="input"
                            />
                        </div>
                        <div className="seedling-detail-form-group">
                            <label>Notas</label>
                            <textarea
                                value={editSeedlingData.notas || ''}
                                onChange={(e) => setEditSeedlingData({...editSeedlingData, notas: e.target.value})}
                                placeholder="Observaciones sobre el semillero..."
                                className="input"
                                rows="2"
                            />
                        </div>
                        <div className="seedling-detail-edit-actions">
                            <button
                                onClick={() => setIsEditingSeedling(false)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSeedlingEdit}
                                className="btn btn-primary"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Variedades del Lote */}
            {varietiesInBatch.length > 0 && (
                <div className="seedling-detail-card card">
                    <h3 className="seedling-detail-section-title">
                        Variedades en este Lote ({varietiesInBatch.length})
                    </h3>
                    <div className="seedling-detail-varieties">
                        {varietiesInBatch.map((variety, idx) => (
                            <div key={variety.id} className="seedling-detail-variety-item">
                                <div className="seedling-detail-variety-header">
                                    <div className="seedling-detail-variety-names">
                                        {variety.especie_nombre && (
                                            <span className="seedling-detail-variety-especie">
                                                {variety.especie_nombre}
                                            </span>
                                        )}
                                        <span className="seedling-detail-variety-name">
                                            {variety.variedad_nombre}
                                        </span>
                                    </div>
                                    {variety.origen && (
                                        <span className="seedling-detail-variety-origin">
                                            {variety.origen}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => toggleEditVariety(variety.id)}
                                        className={`seedling-detail-variety-status-btn ${editingVarietyId === variety.id ? 'seedling-detail-variety-status-btn--active' : ''}`}
                                        title={editingVarietyId === variety.id ? "Cancelar" : "Editar estado"}
                                    >
                                        {editingVarietyId === variety.id ? '✕' : '✏️'}
                                    </button>
                                </div>

                                {/* Inline Editor */}
                                {editingVarietyId === variety.id && (
                                    <div className="seedling-detail-variety-inline-editor">
                                        <div className="seedling-detail-variety-status-options">
                                            <button
                                                onClick={() => handleVarietyStatusChange(variety.id, 'SEMBRADA')}
                                                disabled={updatingVarietyId === variety.id || variety.estado === 'SEMBRADA'}
                                                className={`seedling-detail-status-option seedling-detail-status-option--sown ${variety.estado === 'SEMBRADA' ? 'seedling-detail-status-option--selected' : ''}`}
                                            >
                                                🌱 Sembrado
                                            </button>
                                            <button
                                                onClick={() => handleVarietyStatusChange(variety.id, 'GERMINADA')}
                                                disabled={updatingVarietyId === variety.id || variety.estado === 'GERMINADA'}
                                                className={`seedling-detail-status-option seedling-detail-status-option--germinating ${variety.estado === 'GERMINADA' ? 'seedling-detail-status-option--selected' : ''}`}
                                            >
                                                🌱 Germinando
                                            </button>
                                            <button
                                                onClick={() => handleVarietyStatusChange(variety.id, 'LISTA')}
                                                disabled={updatingVarietyId === variety.id || variety.estado === 'LISTA'}
                                                className={`seedling-detail-status-option seedling-detail-status-option--ready ${variety.estado === 'LISTA' ? 'seedling-detail-status-option--selected' : ''}`}
                                            >
                                                🌿 Listo
                                            </button>
                                            <button
                                                onClick={() => handleVarietyStatusChange(variety.id, 'TRASPLANTADA')}
                                                disabled={updatingVarietyId === variety.id || variety.estado === 'TRASPLANTADA'}
                                                className={`seedling-detail-status-option seedling-detail-status-option--transplanted ${variety.estado === 'TRASPLANTADA' ? 'seedling-detail-status-option--selected' : ''}`}
                                            >
                                                🪴 Trasplantado
                                            </button>
                                        </div>
                                        <div className="seedling-detail-germination-editor">
                                            <label className="seedling-detail-germination-label">Fecha de germinación</label>
                                            <input
                                                type="date"
                                                value={variety.fecha_germinacion ? variety.fecha_germinacion.split('T')[0] : ''}
                                                onChange={(e) => handleVarietyDateChange(variety.id, e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div className="seedling-detail-variety-editor-actions">
                                            <button
                                                onClick={() => handleDeleteVariety(variety.id)}
                                                className="btn-icon btn-icon--delete btn-sm"
                                                title="Eliminar esta variedad"
                                                disabled={updatingVarietyId === variety.id}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        {updatingVarietyId === variety.id && (
                                            <div className="seedling-detail-variety-updating">Actualizando...</div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Timeline horizontal por variedad (sin Trasplantado) */}
                                <div className="seedling-variety-timeline-wrapper">
                                    <div className="seedling-variety-horizontal-timeline">
                                        <div className="seedling-variety-timeline-item seedling-variety-timeline-item--active">
                                            <div className="seedling-variety-timeline-dot"></div>
                                            <div className="seedling-variety-timeline-stage">
                                                <div className="seedling-variety-timeline-stage-title">Sembrado</div>
                                                <div className="seedling-variety-timeline-stage-date">{formatDate(variety.fecha_siembra)}</div>
                                            </div>
                                        </div>

                                        <div className={`seedling-variety-timeline-connector ${variety.fecha_germinacion ? 'seedling-variety-timeline-connector--completed' : ''}`}></div>

                                        <div className={`seedling-variety-timeline-item ${variety.fecha_germinacion ? 'seedling-variety-timeline-item--active' : ''}`}>
                                            <div className="seedling-variety-timeline-dot"></div>
                                            <div className="seedling-variety-timeline-stage">
                                                <div className="seedling-variety-timeline-stage-title">Germinación</div>
                                                <div className="seedling-variety-timeline-stage-date">
                                                    {variety.fecha_germinacion ? formatDate(variety.fecha_germinacion) : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`seedling-variety-timeline-connector ${variety.estado === 'LISTA' || variety.estado === 'TRASPLANTADA' ? 'seedling-variety-timeline-connector--completed' : ''}`}></div>

                                        <div className={`seedling-variety-timeline-item ${variety.estado === 'LISTA' || variety.estado === 'TRASPLANTADA' ? 'seedling-variety-timeline-item--active' : ''}`}>
                                            <div className="seedling-variety-timeline-dot"></div>
                                            <div className="seedling-variety-timeline-stage">
                                                <div className="seedling-variety-timeline-stage-title">Listo</div>
                                                <div className="seedling-variety-timeline-stage-date">
                                                    {variety.estado === 'LISTA' || variety.estado === 'TRASPLANTADA' ? '✓' : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {variety.estado === 'TRASPLANTADA' && (
                                        <div className="seedling-variety-transplanted-badge">🪴 Trasplantado</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            {seedling.notas && (
                <div className="seedling-detail-card card">
                    <h3 className="seedling-detail-section-title">Notas</h3>
                    <p className="seedling-detail-notes">{seedling.notas}</p>
                </div>
            )}

            {/* Photos Section */}
            {seedling.fotos && seedling.fotos.length > 0 && (
                <div className="seedling-detail-card card">
                    <h3 className="seedling-detail-section-title">📸 Fotos del Lote</h3>
                    <div className="seedling-detail-photos-carousel">
                        {/* Main Photo Display */}
                        <div className="seedling-detail-carousel-viewport">
                            <img 
                                src={typeof seedling.fotos[currentPhotoIndex] === 'string' 
                                    ? seedling.fotos[currentPhotoIndex]
                                    : seedling.fotos[currentPhotoIndex].url}
                                alt={`Foto ${currentPhotoIndex + 1}`}
                                className="seedling-detail-carousel-image"
                            />
                            {seedling.fotos.length > 1 && (
                                <>
                                    <button 
                                        className="seedling-detail-carousel-btn seedling-detail-carousel-btn--prev"
                                        onClick={() => setCurrentPhotoIndex((currentPhotoIndex - 1 + seedling.fotos.length) % seedling.fotos.length)}
                                    >
                                        ◀
                                    </button>
                                    <button 
                                        className="seedling-detail-carousel-btn seedling-detail-carousel-btn--next"
                                        onClick={() => setCurrentPhotoIndex((currentPhotoIndex + 1) % seedling.fotos.length)}
                                    >
                                        ▶
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {seedling.fotos.length > 1 && (
                            <div className="seedling-detail-carousel-thumbnails">
                                {seedling.fotos.map((foto, idx) => {
                                    const fotoUrl = typeof foto === 'string' ? foto : foto.url;
                                    return (
                                        <img
                                            key={idx}
                                            src={fotoUrl}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className={`seedling-detail-carousel-thumbnail ${idx === currentPhotoIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentPhotoIndex(idx)}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Counter */}
                        {seedling.fotos.length > 1 && (
                            <div className="seedling-detail-carousel-counter">
                                {currentPhotoIndex + 1} / {seedling.fotos.length}
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}
