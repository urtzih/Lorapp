import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { seedsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Inventory() {
    const [seeds, setSeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        crop_family: '',
        brand: '',
        is_planted: null
    });

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadSeeds();
    }, [filters]);

    const loadSeeds = async () => {
        try {
            setLoading(true);
            const response = await seedsAPI.list(filters);
            setSeeds(response.data);
        } catch (error) {
            console.error('Error loading seeds:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await seedsAPI.exportCSV();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `lorapp_seeds_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    };

    const SeedCard = ({ seed }) => (
        <Link to={`/seeds/${seed.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            {seed.photos && seed.photos.length > 0 && (
                <img
                    src={`${import.meta.env.VITE_API_URL}/uploads/${seed.photos[0]}`}
                    alt={seed.commercial_name}
                    style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1rem'
                    }}
                />
            )}

            <h3 className="mb-2">{seed.commercial_name}</h3>

            {seed.variety && (
                <p className="text-gray text-sm mb-2">{seed.variety}</p>
            )}

            <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                {seed.brand && (
                    <span className="badge badge-primary">{seed.brand}</span>
                )}
                {seed.crop_family && (
                    <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#075985' }}>
                        {seed.crop_family}
                    </span>
                )}
                {seed.is_planted && (
                    <span className="badge badge-success">Plantada</span>
                )}
            </div>

            {seed.expiration_date && (
                <p className="text-xs text-gray">
                    Caduca: {new Date(seed.expiration_date).toLocaleDateString()}
                </p>
            )}
        </Link>
    );

    return (
        <div className="container section">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="mb-2">Mi Inventario</h1>
                    <p className="text-gray">{seeds.length} semillas registradas</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} className="btn btn-secondary">
                        📊 Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-2 gap-4">
                    <input
                        type="text"
                        className="input"
                        placeholder="🔍 Buscar semillas..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />

                    <select
                        className="input"
                        value={filters.is_planted || ''}
                        onChange={(e) => setFilters({ ...filters, is_planted: e.target.value ? e.target.value === 'true' : null })}
                    >
                        <option value="">Todas las semillas</option>
                        <option value="false">Sin plantar</option>
                        <option value="true">Plantadas</option>
                    </select>
                </div>
            </div>

            {/* Seeds Grid */}
            {loading ? (
                <div className="flex justify-center items-center" style={{ height: '300px' }}>
                    <div className="spinner"></div>
                </div>
            ) : seeds.length === 0 ? (
                <div className="text-center" style={{ padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌱</div>
                    <h2 className="mb-3">No tienes semillas aún</h2>
                    <p className="text-gray mb-6">Comienza escaneando tu primer sobre de semillas</p>
                    <button onClick={() => navigate('/scan')} className="btn btn-primary btn-lg">
                        📸 Escanear primera semilla
                    </button>
                </div>
            ) : (
                <div className="grid grid-3 gap-6 mb-8">
                    {seeds.map(seed => (
                        <SeedCard key={seed.id} seed={seed} />
                    ))}
                </div>
            )}

            {/* Floating Action Button */}
            {!loading && seeds.length > 0 && (
                <button onClick={() => navigate('/scan')} className="fab" title="Añadir semilla">
                    +
                </button>
            )}
        </div>
    );
}

export default Inventory;
