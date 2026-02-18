import { useState, useEffect, useRef } from 'react';
import { mySeedlingAPI } from '../services/api';
import Modal from './shared/Modal';
import '../styles/EditSeedlingModal.css';

export default function EditSeedlingModal({ isOpen, onClose, seedling, onSuccess }) {
    const [formData, setFormData] = useState({
        fecha_siembra: '',
        fecha_germinacion: '',
        cantidad_semillas_plantadas: '',
        ubicacion_descripcion: '',
        notas: '',
        estado: 'germinating'
    });
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (seedling) {
            setFormData({
                fecha_siembra: seedling.fecha_siembra ? seedling.fecha_siembra.split('T')[0] : '',
                fecha_germinacion: seedling.fecha_germinacion ? seedling.fecha_germinacion.split('T')[0] : '',
                cantidad_semillas_plantadas: seedling.cantidad_semillas_plantadas || '',
                ubicacion_descripcion: seedling.ubicacion_descripcion || '',
                notas: seedling.notas || '',
                estado: seedling.estado || 'germinating'
            });
            // Cargar fotos existentes
            setPhotos(seedling.fotos || []);
        }
    }, [seedling]);

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotos(prev => [...prev, {
                    url: event.target.result,
                    file: file,
                    isNew: true
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Preparar datos con fotos
            const formDataToSend = new FormData();
            
            // Agregar datos del formulario
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });

            // Agregar solo fotos nuevas
            const newPhotos = photos.filter(p => p.isNew);
            newPhotos.forEach((photo, idx) => {
                if (photo.file) {
                    formDataToSend.append(`fotos`, photo.file);
                }
            });

            await mySeedlingAPI.update(seedling.id, formDataToSend);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating seedling:', error);
            alert('Error al actualizar el semillero');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            fecha_siembra: '',
            fecha_germinacion: '',
            cantidad_semillas_plantadas: '',
            ubicacion_descripcion: '',
            notas: '',
            estado: 'germinating'
        });
        setPhotos([]);
        onClose();
    };

    if (!seedling) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Editar Semillero">
            <div className="esm-container">
                {/* Seedling Info */}
                <div className="esm-info">
                    <h3 className="esm-info__title">{seedling.nombre_plantacion}</h3>
                    <div className="esm-info__variety">
                        <span className="esm-info__variety-name">
                            {seedling.variedad_nombre || seedling.especie_nombre}
                        </span>
                        {seedling.origen && (
                            <span className="esm-info__origin"> - {seedling.origen}</span>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="esm-form">
                    <div className="esm-form-group">
                        <label htmlFor="fecha_siembra">Fecha de siembra</label>
                        <input
                            type="date"
                            id="fecha_siembra"
                            name="fecha_siembra"
                            value={formData.fecha_siembra}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div className="esm-form-group">
                        <label htmlFor="fecha_germinacion">Fecha de germinación</label>
                        <input
                            type="date"
                            id="fecha_germinacion"
                            name="fecha_germinacion"
                            value={formData.fecha_germinacion}
                            onChange={handleChange}
                            className="input"
                        />
                        <small>Deja vacío si aún no ha germinado</small>
                    </div>

                    <div className="esm-form-group">
                        <label htmlFor="cantidad_semillas_plantadas">Cantidad de semillas</label>
                        <input
                            type="number"
                            id="cantidad_semillas_plantadas"
                            name="cantidad_semillas_plantadas"
                            value={formData.cantidad_semillas_plantadas}
                            onChange={handleChange}
                            className="input"
                            min="1"
                        />
                    </div>

                    <div className="esm-form-group">
                        <label htmlFor="ubicacion_descripcion">Ubicación</label>
                        <input
                            type="text"
                            id="ubicacion_descripcion"
                            name="ubicacion_descripcion"
                            value={formData.ubicacion_descripcion}
                            onChange={handleChange}
                            className="input"
                            placeholder="Ej: Bandeja 1, Fila A"
                        />
                    </div>

                    <div className="esm-form-group">
                        <label htmlFor="estado">Estado</label>
                        <select
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="germinating">Germinando</option>
                            <option value="ready">Listo para trasplantar</option>
                            <option value="transplanted">Trasplantado</option>
                            <option value="planned">Planificado</option>
                        </select>
                    </div>

                    <div className="esm-form-group">
                        <label htmlFor="notas">Notas</label>
                        <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            className="input"
                            rows="3"
                            placeholder="Observaciones sobre el semillero..."
                        />
                    </div>

                    <div className="esm-form-group">
                        <label>Fotos del semillero</label>
                        <div 
                            className="esm-photo-section"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoSelect}
                            />
                            <div className="esm-photo-icon">📸</div>
                            <div className="esm-photo-text">
                                Toca para agregar fotos
                            </div>
                        </div>

                        {photos.length > 0 && (
                            <div className="esm-photos-list">
                                {photos.map((photo, idx) => (
                                    <div key={idx} className="esm-photo-item">
                                        <img src={photo.url} alt={`Foto ${idx + 1}`} />
                                        <button
                                            type="button"
                                            className="esm-photo-item__remove"
                                            onClick={() => handleRemovePhoto(idx)}
                                            title="Eliminar foto"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="esm-actions">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
