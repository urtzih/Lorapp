import { useState, useEffect, useRef } from 'react';
import { seedsAPI, mySeedlingAPI } from '../services/api';
import Modal from './shared/Modal';
import '../styles/CreateSeedlingModal.css';

/**
 * Modal para crear un nuevo semillero
 * Permite seleccionar una variedad, tomar foto y registrar la siembra
 */
export function CreateSeedlingModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState('search'); // 'search', 'photo', 'edit'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    
    // Búsqueda de variedades
    const [seeds, setSeeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSeeds, setFilteredSeeds] = useState([]);
    const [selectedSeeds, setSelectedSeeds] = useState([]); // Cambiado a array para multiselección
    
    // Foto
    const cameraRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [photoData, setPhotoData] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    
    // Datos del semillero
    const [seedlingData, setSeedlingData] = useState({
        lote_semillas_id: null,
        nombre_plantacion: '',
        fecha_siembra: new Date().toISOString().split('T')[0],
        ubicacion_descripcion: 'Semillero',
        cantidad_semillas_plantadas: null,
        notas: ''
    });

    // Cargar semillas disponibles
    useEffect(() => {
        if (isOpen) {
            loadSeeds();
        }
    }, [isOpen]);

    // Filtrar semillas cuando se busca
    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = seeds.filter(seed =>
                seed.variedad?.nombre_variedad?.toLowerCase().includes(query) ||
                seed.variedad?.especie?.nombre_comun?.toLowerCase().includes(query) ||
                seed.nombre_comercial?.toLowerCase().includes(query)
            );
            setFilteredSeeds(filtered);
        } else {
            setFilteredSeeds(seeds);
        }
    }, [searchQuery, seeds]);

    const loadSeeds = async () => {
        try {
            setLoading(true);
            const response = await seedsAPI.list({ limit: 1000 });
            // Filtrar solo semillas con cantidad disponible
            const availableSeeds = response.data.filter(seed => seed.cantidad_restante > 0);
            setSeeds(availableSeeds);
            setFilteredSeeds(availableSeeds);
        } catch (error) {
            console.error('Error loading seeds:', error);
            setMessage({ type: 'error', text: 'Error cargando semillas' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSeed = (seed) => {
        setSelectedSeeds(prev => {
            const isSelected = prev.find(s => s.id === seed.id);
            if (isSelected) {
                // Deseleccionar
                return prev.filter(s => s.id !== seed.id);
            } else {
                // Seleccionar
                return [...prev, seed];
            }
        });
    };

    const proceedToPhoto = () => {
        if (selectedSeeds.length === 0) {
            setMessage({ type: 'error', text: 'Selecciona al menos una variedad' });
            return;
        }
        setMessage(null);
        setStep('photo');
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (cameraRef.current) {
                cameraRef.current.srcObject = stream;
                setCameraActive(true);
                setUseCamera(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setMessage({ type: 'error', text: 'Error accediendo a la cámara' });
        }
    };

    const stopCamera = () => {
        if (cameraRef.current?.srcObject) {
            cameraRef.current.srcObject.getTracks().forEach(track => track.stop());
            setCameraActive(false);
        }
    };

    const capturePhoto = () => {
        const video = cameraRef.current;
        const canvas = canvasRef.current;
        
        if (canvas && video) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            setPhotoData(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotoData(event.target.result);
                setUseCamera(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const proceedToEdit = () => {
        setStep('edit');
    };

    const updateField = (field, value) => {
        setSeedlingData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (selectedSeeds.length === 0) {
                setMessage({ type: 'error', text: 'Selecciona al menos una variedad' });
                return;
            }
            if (!seedlingData.ubicacion_descripcion?.trim()) {
                setMessage({ type: 'error', text: 'La ubicación es obligatoria' });
                return;
            }

            setLoading(true);
            setMessage(null);

            // Crear un semillero para cada variedad seleccionada
            const promises = selectedSeeds.map(seed => {
                const data = {
                    lote_semillas_id: seed.id,
                    nombre_plantacion: `${seed.variedad?.nombre_variedad} - ${new Date().toLocaleDateString()}`,
                    fecha_siembra: seedlingData.fecha_siembra,
                    ubicacion_descripcion: seedlingData.ubicacion_descripcion,
                    cantidad_semillas_plantadas: seedlingData.cantidad_semillas_plantadas,
                    notas: seedlingData.notas
                };
                return mySeedlingAPI.create(data);
            });

            await Promise.all(promises);

            setMessage({ type: 'success', text: `${selectedSeeds.length} semillero(s) creado(s) correctamente` });
            setTimeout(() => {
                handleClose();
                onSuccess?.();
            }, 1500);
        } catch (error) {
            console.error('Error creating seedlings:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Error creando los semilleros'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        stopCamera();
        setStep('search');
        setSearchQuery('');
        setSelectedSeeds([]);
        setPhotoData(null);
        setUseCamera(false);
        setSeedlingData({
            lote_semillas_id: null,
            nombre_plantacion: '',
            fecha_siembra: new Date().toISOString().split('T')[0],
            ubicacion_descripcion: 'Semillero',
            cantidad_semillas_plantadas: null,
            notas: ''
        });
        setMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Semillero">
            <div className="create-seedling-modal">
                {/* Step 1: Search Seeds */}
                {step === 'search' && (
                    <div className="csm-step csm-step--search">
                        <div className="csm-search-box">
                            <input
                                type="text"
                                placeholder="Busca variedad, especie..."
                                className="input csm-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {message && (
                            <div className={`csm-message csm-message--${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        {loading ? (
                            <div className="csm-loading">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredSeeds.length === 0 ? (
                            <div className="csm-empty">
                                <div className="csm-empty__icon">🌱</div>
                                <p>No hay semillas disponibles</p>
                            </div>
                        ) : (
                            <>
                                {selectedSeeds.length > 0 && (
                                    <div className="csm-selected-count">
                                        {selectedSeeds.length} variedad(es) seleccionada(s)
                                    </div>
                                )}
                                <div className="csm-seeds-list">
                                    {filteredSeeds.map(seed => {
                                        const isSelected = selectedSeeds.find(s => s.id === seed.id);
                                        return (
                                            <div
                                                key={seed.id}
                                                className={`csm-seed-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelectSeed(seed)}
                                            >
                                                <div className="csm-seed-item__checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        readOnly
                                                    />
                                                </div>
                                                <div className="csm-seed-item__content">
                                                    <div className="csm-seed-item__name">
                                                        {seed.variedad?.nombre_variedad}
                                                    </div>
                                                    <div className="csm-seed-item__variety">
                                                        {seed.variedad?.especie?.nombre_comun}
                                                    </div>
                                                    <div className="csm-seed-item__details">
                                                        {seed.origen && <span>📍 {seed.origen}</span>}
                                                        {seed.fecha_recoleccion && (
                                                            <span>📅 {new Date(seed.fecha_recoleccion).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                                                        )}
                                                        <span>💧 {seed.cantidad_restante} semillas</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedSeeds.length > 0 && (
                                    <button
                                        className="btn btn-primary csm-continue-btn"
                                        onClick={proceedToPhoto}
                                    >
                                        Continuar con {selectedSeeds.length} variedad(es)
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Photo */}
                {step === 'photo' && selectedSeeds.length > 0 && (
                    <div className="csm-step csm-step--photo">
                        <div className="csm-selected-seed">
                            <div className="csm-selected-seed__title">
                                Variedades seleccionadas ({selectedSeeds.length}):
                            </div>
                            <div className="csm-selected-seeds-list">
                                {selectedSeeds.map(seed => (
                                    <div key={seed.id} className="csm-selected-seed__item">
                                        • {seed.variedad?.nombre_variedad}
                                    </div>
                                ))}
                            </div>
                            <button
                                className="csm-change-btn"
                                onClick={() => {
                                    setStep('search');
                                }}
                            >
                                Cambiar selección
                            </button>
                        </div>

                        {!photoData ? (
                            <div className="csm-photo-options">
                                {!useCamera ? (
                                    <>
                                        <button
                                            className="csm-photo-btn csm-photo-btn--camera"
                                            onClick={startCamera}
                                        >
                                            📷 Tomar Foto
                                        </button>
                                        <div className="csm-divider">o</div>
                                        <label className="csm-photo-btn csm-photo-btn--upload">
                                            📁 Subir Foto
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        <button
                                            className="csm-photo-btn csm-photo-btn--skip"
                                            onClick={proceedToEdit}
                                        >
                                            ⏭️ Continuar sin Foto
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <video
                                            ref={cameraRef}
                                            autoPlay
                                            playsInline
                                            className="csm-camera-preview"
                                        />
                                        <div className="csm-camera-controls">
                                            <button
                                                className="csm-capture-btn"
                                                onClick={capturePhoto}
                                            >
                                                📸 Capturar
                                            </button>
                                            <button
                                                className="csm-cancel-btn"
                                                onClick={stopCamera}
                                            >
                                                ✕ Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="csm-photo-preview">
                                <img src={photoData} alt="Preview" className="csm-photo-image" />
                                <div className="csm-photo-actions">
                                    <button
                                        className="csm-photo-btn csm-photo-btn--retake"
                                        onClick={() => setPhotoData(null)}
                                    >
                                        🔄 Retomar Foto
                                    </button>
                                    <button
                                        className="csm-photo-btn csm-photo-btn--continue"
                                        onClick={proceedToEdit}
                                    >
                                        ✓ Continuar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Edit Details */}
                {step === 'edit' && (
                    <div className="csm-step csm-step--edit">
                        {message && (
                            <div className={`csm-message csm-message--${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="csm-info-note">
                            ℹ️ Se creará un semillero para cada una de las {selectedSeeds.length} variedad(es) seleccionadas
                        </div>

                        <div className="csm-form-group">
                            <label>Fecha de Siembra</label>
                            <input
                                type="date"
                                className="input csm-input"
                                value={seedlingData.fecha_siembra}
                                onChange={(e) =>
                                    updateField('fecha_siembra', e.target.value)
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="csm-form-group">
                            <label>Ubicación*</label>
                            <input
                                type="text"
                                placeholder="Ej: Semillero bandeja A"
                                className="input csm-input"
                                value={seedlingData.ubicacion_descripcion}
                                onChange={(e) =>
                                    updateField('ubicacion_descripcion', e.target.value)
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="csm-form-group">
                            <label>Cantidad de Semillas Plantadas</label>
                            <input
                                type="number"
                                placeholder="Ej: 50"
                                className="input csm-input"
                                value={seedlingData.cantidad_semillas_plantadas || ''}
                                onChange={(e) =>
                                    updateField(
                                        'cantidad_semillas_plantadas',
                                        e.target.value ? parseInt(e.target.value) : null
                                    )
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="csm-form-group">
                            <label>Notas</label>
                            <textarea
                                placeholder="Ej: Condiciones de germinación, observaciones..."
                                className="input csm-textarea"
                                value={seedlingData.notas}
                                onChange={(e) => updateField('notas', e.target.value)}
                                disabled={loading}
                                rows="3"
                            />
                        </div>

                        {photoData && (
                            <div className="csm-form-group">
                                <label>Foto Capturada</label>
                                <img src={photoData} alt="Seedling" className="csm-form-photo" />
                            </div>
                        )}

                        <div className="csm-form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setStep('photo')}
                                disabled={loading}
                            >
                                ← Atrás
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : '✓ Crear Semillero'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default CreateSeedlingModal;
