import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';

export function SeedScan() {
    const [photos, setPhotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const [editedData, setEditedData] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            alert('Máximo 5 fotos permitidas');
            return;
        }

        setPhotos([...photos, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleScan = async () => {
        if (photos.length === 0) {
            alert('Selecciona al menos una foto');
            return;
        }

        setScanning(true);
        const formData = new FormData();
        photos.forEach(photo => formData.append('files', photo));

        try {
            const response = await seedsAPI.scan(formData);
            setOcrResult(response.data);
            setEditedData(response.data.extracted_data);
        } catch (error) {
            console.error('Error scanning:', error);
            alert('Error al escanear la semilla');
        } finally {
            setScanning(false);
        }
    };

    const handleSave = async () => {
        try {
            await seedsAPI.create(editedData);
            navigate('/inventory');
        } catch (error) {
            console.error('Error saving seed:', error);
            alert('Error al guardar la semilla');
        }
    };

    const handleChange = (field, value) => {
        setEditedData({ ...editedData, [field]: value });
    };

    return (
        <div className="container section" style={{ paddingBottom: '150px' }}>
            <h1 className="mb-6">📸 Escanear Semilla</h1>

            {!ocrResult ? (
                <>
                    {/* Photo Upload */}
                    <div className="card mb-6">
                        <h3 className="mb-4">1. Toma fotos del sobre</h3>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />

                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="btn btn-primary"
                                disabled={photos.length >= 5}
                            >
                                📷 Tomar/Subir foto
                            </button>
                            <span className="text-gray flex items-center">
                                {photos.length}/5 fotos
                            </span>
                        </div>

                        {/* Photo Previews */}
                        {previews.length > 0 && (
                            <div className="grid grid-3 gap-4">
                                {previews.map((preview, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '200px',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-lg)'
                                            }}
                                        />
                                        <button
                                            onClick={() => removePhoto(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                backgroundColor: 'var(--color-error)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Scan Button */}
                    {photos.length > 0 && (
                        <button
                            onClick={handleScan}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={scanning}
                        >
                            {scanning ? (
                                <>
                                    <span className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></span>
                                    Analizando imágenes...
                                </>
                            ) : (
                                '🔍 Escanear y extraer datos'
                            )}
                        </button>
                    )}
                </>
            ) : (
                <>
                    {/* OCR Results */}
                    <div className="card mb-4" style={{ backgroundColor: '#ecfdf5', borderLeft: '4px solid var(--color-success)' }}>
                        <h4 className="mb-2">✅ Escaneo completado</h4>
                        <p className="text-sm text-gray">
                            Confianza: {Math.round(ocrResult.confidence * 100)}% •
                            Revisa y edita la información antes de guardar
                        </p>
                    </div>

                    {/* Edit Form */}
                    <div className="card mb-6">
                        <h3 className="mb-4">2. Revisa y edita la información</h3>

                        <div className="form-group">
                            <label className="form-label" htmlFor="scan-commercial-name">Nombre comercial *</label>
                            <input
                                id="scan-commercial-name"
                                type="text"
                                className="input"
                                value={editedData.commercial_name || ''}
                                onChange={(e) => handleChange('commercial_name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="scan-variety">Variedad</label>
                                <input
                                    id="scan-variety"
                                    type="text"
                                    className="input"
                                    value={editedData.variety || ''}
                                    onChange={(e) => handleChange('variety', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="scan-brand">Marca</label>
                                <input
                                    id="scan-brand"
                                    type="text"
                                    className="input"
                                    value={editedData.brand || ''}
                                    onChange={(e) => handleChange('brand', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-2 gap-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="scan-production-year">Año de producción</label>
                                <input
                                    id="scan-production-year"
                                    type="number"
                                    className="input"
                                    value={editedData.production_year || ''}
                                    onChange={(e) => handleChange('production_year', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="scan-expiration-date">Fecha de caducidad</label>
                                <input
                                    id="scan-expiration-date"
                                    type="date"
                                    className="input"
                                    value={editedData.expiration_date ? editedData.expiration_date.split('T')[0] : ''}
                                    onChange={(e) => handleChange('expiration_date', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="scan-crop-family">Familia de cultivo</label>
                            <input
                                id="scan-crop-family"
                                type="text"
                                className="input"
                                value={editedData.crop_family || ''}
                                onChange={(e) => handleChange('crop_family', e.target.value)}
                                placeholder="ej: tomate, lechuga, pimiento..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="scan-notes">Notas</label>
                            <textarea
                                id="scan-notes"
                                className="input"
                                rows="3"
                                value={editedData.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Añade notas adicionales..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button onClick={() => { setOcrResult(null); setEditedData(null); }} className="btn btn-secondary" style={{ flex: 1 }}>
                            ← Volver a escanear
                        </button>
                        <button onClick={handleSave} className="btn btn-primary" style={{ flex: 2 }}>
                            💾 Guardar semilla
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default SeedScan;
