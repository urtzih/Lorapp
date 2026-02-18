import { useState, useEffect } from 'react';
import { mySeedlingAPI } from '../services/api';
import Modal from './shared/Modal';
import '../styles/EditVarietyStatusModal.css';

const STATUS_OPTIONS = [
    { value: 'planned', label: '📋 Planificado', color: '#2196F3' },
    { value: 'germinating', label: '🌱 Germinando', color: '#4CAF50' },
    { value: 'ready', label: '🌿 Listo para trasplantar', color: '#FFC107' },
    { value: 'transplanted', label: '🪴 Trasplantado', color: '#8BC34A' }
];

export default function EditVarietyStatusModal({ isOpen, onClose, variety, seedling, onSuccess }) {
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusDates, setStatusDates] = useState({
        fecha_germinacion: '',
    });
    const [loading, setLoading] = useState(false);
    const [daysElapsed, setDaysElapsed] = useState('');

    useEffect(() => {
        if (variety && isOpen) {
            setSelectedStatus(variety.estado || 'planned');
            setStatusDates({
                fecha_germinacion: variety.fecha_germinacion 
                    ? variety.fecha_germinacion.split('T')[0] 
                    : new Date().toISOString().split('T')[0],
            });
            calculateDays(variety.fecha_siembra, variety.fecha_germinacion);
        }
    }, [variety, isOpen]);

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        setDaysElapsed(days > 0 ? days : 0);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        
        // Si cambia a germinando, preguntar por fecha de germinación
        if (status === 'germinating' && !statusDates.fecha_germinacion) {
            setStatusDates(prev => ({
                ...prev,
                fecha_germinacion: new Date().toISOString().split('T')[0]
            }));
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setStatusDates(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'fecha_germinacion' && variety) {
            calculateDays(variety.fecha_siembra, value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = {
                estado: selectedStatus,
            };

            // Agregar fecha de germinación si cambió a germinando
            if (selectedStatus === 'germinating' && statusDates.fecha_germinacion) {
                updateData.fecha_germinacion = statusDates.fecha_germinacion;
            }

            await mySeedlingAPI.update(variety.id, updateData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating variety status:', error);
            alert('Error al actualizar el estado de la variedad');
        } finally {
            setLoading(false);
        }
    };

    const currentStatus = STATUS_OPTIONS.find(opt => opt.value === variety?.estado);
    const newStatus = STATUS_OPTIONS.find(opt => opt.value === selectedStatus);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="edit-variety-status-modal">
                <h2 className="edit-variety-status-modal__title">
                    🌱 {variety?.variedad_nombre || variety?.especie_nombre}
                </h2>
                {variety?.origen && (
                    <p className="edit-variety-status-modal__origin">{variety.origen}</p>
                )}

                <form onSubmit={handleSubmit} className="edit-variety-status-form">
                    {/* Estado Actual */}
                    <div className="form-section">
                        <label className="form-label">Estado Actual</label>
                        <div className="status-badge">
                            {currentStatus ? (
                                <>
                                    <span>{currentStatus.label}</span>
                                    <span className="status-badge-date">
                                        {variety?.fecha_siembra && (
                                            <>
                                                (Hace {Math.floor(
                                                    (new Date() - new Date(variety.fecha_siembra)) / 
                                                    (1000 * 60 * 60 * 24)
                                                )} días)
                                            </>
                                        )}
                                    </span>
                                </>
                            ) : (
                                'Sin definir'
                            )}
                        </div>
                    </div>

                    {/* Cambiar a Nuevo Estado */}
                    <div className="form-section">
                        <label className="form-label">
                            💫 Cambiar a nuevo estado
                        </label>
                        <div className="status-options">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`status-option ${
                                        selectedStatus === option.value ? 'status-option--selected' : ''
                                    }`}
                                    onClick={() => handleStatusChange(option.value)}
                                >
                                    <span>{option.label}</span>
                                    {selectedStatus === option.value && (
                                        <span className="status-option-checkmark">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fecha de Germinación si se selecciona "Germinando" */}
                    {selectedStatus === 'germinating' && (
                        <div className="form-section">
                            <label htmlFor="fecha_germinacion" className="form-label">
                                🌱 Fecha de Germinación
                            </label>
                            <input
                                type="date"
                                id="fecha_germinacion"
                                name="fecha_germinacion"
                                value={statusDates.fecha_germinacion}
                                onChange={handleDateChange}
                                className="form-input"
                                required
                            />
                            {daysElapsed && (
                                <div className="detail-info">
                                    ⏱️ Germinó después de {daysElapsed} días
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info sobre el cambio */}
                    {selectedStatus !== variety?.estado && (
                        <div className="status-transition">
                            <span className="transition-arrow">→</span>
                            <div className="transition-info">
                                <div className="transition-from">{currentStatus?.label}</div>
                                <div className="transition-to">{newStatus?.label}</div>
                            </div>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || selectedStatus === variety?.estado}
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambio'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
