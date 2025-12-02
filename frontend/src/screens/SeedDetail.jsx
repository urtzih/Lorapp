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

    const handleSave = async () => {
        try {
            await seedsAPI.update(id, editData);
            setSeed(editData);
            setEditing(false);
        } catch (error) {
            console.error('Error updating seed:', error);
        }
    };

    if (loading) {
        return (
            <div className="container section flex justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!seed) {
        return (
            <div className="container section text-center">
                <h2>Semilla no encontrada</h2>
            </div>
        );
    }

    return (
        <div className="container section">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/inventory')} className="btn btn-secondary">
                    ← Volver
                </button>
                <div className="flex gap-3">
                    {!editing ? (
                        <>
                            <button onClick={() => setEditing(true)} className="btn btn-primary">
                                ✏️ Editar
                            </button>
                            <button onClick={handleDelete} className="btn" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
                                🗑️ Eliminar
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditing(false)} className="btn btn-secondary">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="btn btn-primary">
                                💾 Guardar
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-2 gap-6">
                {/* Photos */}
                <div>
                    {seed.photos && seed.photos.length > 0 ? (
                        <div className="card">
                            <img
                                src={`${import.meta.env.VITE_API_URL}/uploads/${seed.photos[0]}`}
                                alt={seed.commercial_name}
                                style={{
                                    width: '100%',
                                    borderRadius: 'var(--radius-lg)'
                                }}
                            />
                            {seed.photos.length > 1 && (
                                <div className="grid grid-3 gap-2 mt-4">
                                    {seed.photos.slice(1).map((photo, index) => (
                                        <img
                                            key={index}
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                            alt={`${seed.commercial_name} ${index + 2}`}
                                            style={{
                                                width: '100%',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-md)'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                            <p className="text-gray">Sin fotos</p>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div>
                    <div className="card">
                        <h1 className="mb-4">{seed.commercial_name}</h1>

                        {!editing ? (
                            <>
                                {seed.variety && (
                                    <div className="mb-4">
                                        <label className="form-label">Variedad</label>
                                        <p>{seed.variety}</p>
                                    </div>
                                )}

                                <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                                    {seed.brand && <span className="badge badge-primary">{seed.brand}</span>}
                                    {seed.crop_family && <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#075985' }}>{seed.crop_family}</span>}
                                    {seed.is_planted && <span className="badge badge-success">Plantada</span>}
                                </div>

                                {seed.production_year && (
                                    <div className="mb-3">
                                        <label className="form-label">Año de producción</label>
                                        <p>{seed.production_year}</p>
                                    </div>
                                )}

                                {seed.expiration_date && (
                                    <div className="mb-3">
                                        <label className="form-label">Fecha de caducidad</label>
                                        <p>{new Date(seed.expiration_date).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {seed.germination_days && (
                                    <div className="mb-3">
                                        <label className="form-label">Días de germinación</label>
                                        <p>{seed.germination_days} días</p>
                                    </div>
                                )}

                                {seed.notes && (
                                    <div className="mb-3">
                                        <label className="form-label">Notas</label>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{seed.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Nombre comercial</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editData.commercial_name}
                                        onChange={(e) => setEditData({ ...editData, commercial_name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Variedad</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editData.variety || ''}
                                        onChange={(e) => setEditData({ ...editData, variety: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Marca</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={editData.brand || ''}
                                        onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notas</label>
                                    <textarea
                                        className="input"
                                        rows="4"
                                        value={editData.notes || ''}
                                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SeedDetail;
