import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mySeedlingAPI } from '../services/api';
import EditSeedlingModal from '../components/EditSeedlingModal';
import EditVarietyStatusModal from '../components/EditVarietyStatusModal';
import '../styles/SeedlingDetail.css';

export default function SeedlingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seedling, setSeedling] = useState(null);
    const [varietiesInBatch, setVarietiesInBatch] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedVariety, setSelectedVariety] = useState(null);

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

            // Filtrar por las que tengan la misma fecha + ubicación + notas
            const batchVarieties = allSeedlings.filter(s =>
                s.fecha_siembra === mainSeedling.fecha_siembra &&
                s.ubicacion_descripcion === mainSeedling.ubicacion_descripcion &&
                s.notas === mainSeedling.notas
            );

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

    const openStatusModal = (variety) => {
        setSelectedVariety(variety);
        setIsStatusModalOpen(true);
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
        if (variety.estado === 'transplanted') return 100;
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
                    className="seedling-detail-back"
                    title="Volver atrás"
                >
                    ← Volver
                </button>
                <div className="seedling-detail-title-section">
                    <h1 className="seedling-detail-title">
                        🌱 Lote del {formatDate(seedling.fecha_siembra)}
                    </h1>
                    <p className="seedling-detail-subtitle">
                        {varietiesInBatch.length} {varietiesInBatch.length === 1 ? 'variedad' : 'variedades'} • {seedling.ubicacion_descripcion || 'Sin ubicación'}
                    </p>
                </div>
                <div className="seedling-detail-actions">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="seedling-detail-btn seedling-detail-btn--edit"
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="seedling-detail-btn seedling-detail-btn--delete"
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="seedling-detail-card card">
                <div className="seedling-detail-info">
                    <div className="seedling-detail-row">
                        <span className="seedling-detail-label">Estado</span>
                        <span className="seedling-detail-value">
                            {seedling.estado === 'germinating' && '🌱 Germinando'}
                            {seedling.estado === 'ready' && '🌿 Listo para trasplantar'}
                            {seedling.estado === 'transplanted' && '🪴 Trasplantado'}
                            {seedling.estado === 'planned' && '📋 Planificado'}
                        </span>
                    </div>

                    <div className="seedling-detail-row">
                        <span className="seedling-detail-label">Fecha de siembra</span>
                        <span className="seedling-detail-value">{formatDate(seedling.fecha_siembra)}</span>
                    </div>

                    {seedling.fecha_germinacion && (
                        <div className="seedling-detail-row">
                            <span className="seedling-detail-label">Germinó el</span>
                            <span className="seedling-detail-value">{formatDate(seedling.fecha_germinacion)}</span>
                        </div>
                    )}

                    {seedling.cantidad_semillas_plantadas && (
                        <div className="seedling-detail-row">
                            <span className="seedling-detail-label">Cantidad de semillas</span>
                            <span className="seedling-detail-value">{seedling.cantidad_semillas_plantadas}</span>
                        </div>
                    )}

                    {seedling.ubicacion_descripcion && (
                        <div className="seedling-detail-row">
                            <span className="seedling-detail-label">Ubicación</span>
                            <span className="seedling-detail-value">{seedling.ubicacion_descripcion}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline / Progress */}
            <div className="seedling-detail-card card">
                <h3 className="seedling-detail-section-title">Progreso del Semillero</h3>
                
                <div className="seedling-timeline">
                    <div className="seedling-timeline-item">
                        <div className="seedling-timeline-dot seedling-timeline-dot--active"></div>
                        <div className="seedling-timeline-content">
                            <div className="seedling-timeline-title">Sembrado</div>
                            <div className="seedling-timeline-date">{formatDate(seedling.fecha_siembra)}</div>
                            <div className="seedling-timeline-days">Hace {getDaysFromDate(seedling.fecha_siembra)} días</div>
                        </div>
                    </div>

                    <div className={`seedling-timeline-item ${seedling.fecha_germinacion ? 'seedling-timeline-item--completed' : ''}`}>
                        <div className={`seedling-timeline-dot ${seedling.fecha_germinacion ? 'seedling-timeline-dot--active' : ''}`}></div>
                        <div className="seedling-timeline-content">
                            <div className="seedling-timeline-title">Germinación</div>
                            {seedling.fecha_germinacion ? (
                                <>
                                    <div className="seedling-timeline-date">{formatDate(seedling.fecha_germinacion)}</div>
                                    <div className="seedling-timeline-days">
                                        Tardó {Math.floor((new Date(seedling.fecha_germinacion) - new Date(seedling.fecha_siembra)) / (1000 * 60 * 60 * 24))} días
                                    </div>
                                </>
                            ) : (
                                <div className="seedling-timeline-days text-gray">Aún no germinado</div>
                            )}
                        </div>
                    </div>

                    <div className={`seedling-timeline-item ${seedling.estado === 'ready' || seedling.estado === 'transplanted' ? 'seedling-timeline-item--completed' : ''}`}>
                        <div className={`seedling-timeline-dot ${seedling.estado === 'ready' || seedling.estado === 'transplanted' ? 'seedling-timeline-dot--active' : ''}`}></div>
                        <div className="seedling-timeline-content">
                            <div className="seedling-timeline-title">Listo para trasplantar</div>
                            {seedling.estado === 'ready' || seedling.estado === 'transplanted' ? (
                                <div className="seedling-timeline-days">✓ Completado</div>
                            ) : (
                                <div className="seedling-timeline-days text-gray">Pendiente</div>
                            )}
                        </div>
                    </div>

                    <div className={`seedling-timeline-item ${seedling.estado === 'transplanted' ? 'seedling-timeline-item--completed' : ''}`}>
                        <div className={`seedling-timeline-dot ${seedling.estado === 'transplanted' ? 'seedling-timeline-dot--active' : ''}`}></div>
                        <div className="seedling-timeline-content">
                            <div className="seedling-timeline-title">Trasplantado</div>
                            <div className="seedling-timeline-days">Pendiente</div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="seedling-progress-section">
                    <div className="seedling-progress-label">
                        Progreso general: {Math.floor(getVarietyProgressPercentage(seedling))}%
                    </div>
                    <div className="seedling-progress-bar">
                        <div 
                            className="seedling-progress-bar-fill"
                            style={{ width: `${getVarietyProgressPercentage(seedling)}%` }}
                        ></div>
                    </div>
                </div>
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
                                    <span className="seedling-detail-variety-name">
                                        {variety.variedad_nombre || variety.especie_nombre}
                                    </span>
                                    {variety.origen && (
                                        <span className="seedling-detail-variety-origin">
                                            {variety.origen}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => openStatusModal(variety)}
                                        className="seedling-detail-variety-status-btn"
                                        title="Editar estado"
                                    >
                                        ✏️
                                    </button>
                                </div>
                                {variety.cantidad_semillas_plantadas && (
                                    <div className="seedling-detail-variety-quantity">
                                        {variety.cantidad_semillas_plantadas} semillas
                                    </div>
                                )}
                                
                                {/* Timeline horizontal por variedad */}
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

                                    <div className={`seedling-variety-timeline-connector ${variety.estado === 'ready' || variety.estado === 'transplanted' ? 'seedling-variety-timeline-connector--completed' : ''}`}></div>

                                    <div className={`seedling-variety-timeline-item ${variety.estado === 'ready' || variety.estado === 'transplanted' ? 'seedling-variety-timeline-item--active' : ''}`}>
                                        <div className="seedling-variety-timeline-dot"></div>
                                        <div className="seedling-variety-timeline-stage">
                                            <div className="seedling-variety-timeline-stage-title">Listo</div>
                                            <div className="seedling-variety-timeline-stage-date">
                                                {variety.estado === 'ready' || variety.estado === 'transplanted' ? '✓' : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`seedling-variety-timeline-connector ${variety.estado === 'transplanted' ? 'seedling-variety-timeline-connector--completed' : ''}`}></div>

                                    <div className={`seedling-variety-timeline-item ${variety.estado === 'transplanted' ? 'seedling-variety-timeline-item--active' : ''}`}>
                                        <div className="seedling-variety-timeline-dot"></div>
                                        <div className="seedling-variety-timeline-stage">
                                            <div className="seedling-variety-timeline-stage-title">Trasplantado</div>
                                            <div className="seedling-variety-timeline-stage-date">
                                                {variety.estado === 'transplanted' ? '✓' : '-'}
                                            </div>
                                        </div>
                                    </div>
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
                    <h3 className="seedling-detail-section-title">Fotos</h3>
                    <div className="seedling-detail-photos">
                        {seedling.fotos.map((foto, idx) => (
                            <img 
                                key={idx}
                                src={foto.url} 
                                alt={`Foto ${idx + 1}`}
                                className="seedling-detail-photo"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditSeedlingModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                seedling={seedling}
                onSuccess={() => {
                    loadSeedling();
                    setIsEditModalOpen(false);
                }}
            />

            {/* Edit Variety Status Modal */}
            <EditVarietyStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => {
                    setIsStatusModalOpen(false);
                    setSelectedVariety(null);
                }}
                variety={selectedVariety}
                seedling={seedling}
                onSuccess={() => {
                    loadSeedling();
                    setIsStatusModalOpen(false);
                    setSelectedVariety(null);
                }}
            />
        </div>
    );
}
