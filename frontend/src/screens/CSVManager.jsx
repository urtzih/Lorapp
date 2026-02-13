import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/CSVManager.css';

export function CSVManager() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleExportAll = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get('/seeds/export/csv', {
                responseType: 'blob',
                params: { export_type: 'all' }
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `lorapp_completo_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            setMessage({ type: 'success', text: 'Exportación completa exitosa' });
        } catch (error) {
            console.error('Error exporting all data:', error);
            setMessage({ type: 'error', text: 'Error al exportar: ' + (error.response?.data?.detail || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const handleExportLotes = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get('/seeds/export/csv', {
                responseType: 'blob',
                params: { export_type: 'lotes' }
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `lorapp_lotes_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            setMessage({ type: 'success', text: 'Exportación de lotes exitosa' });
        } catch (error) {
            console.error('Error exporting lotes:', error);
            setMessage({ type: 'error', text: 'Error al exportar lotes: ' + (error.response?.data?.detail || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const handleExportEspecies = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get('/seeds/export/csv', {
                responseType: 'blob',
                params: { export_type: 'especies' }
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `lorapp_especies_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            setMessage({ type: 'success', text: 'Exportación de especies exitosa' });
        } catch (error) {
            console.error('Error exporting especies:', error);
            setMessage({ type: 'error', text: 'Error al exportar especies: ' + (error.response?.data?.detail || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/seeds/import/csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage({ 
                type: 'success', 
                text: `Importación exitosa: ${response.data.imported || 0} registros importados` 
            });
        } catch (error) {
            console.error('Error importing CSV:', error);
            setMessage({ 
                type: 'error', 
                text: 'Error al importar: ' + (error.response?.data?.detail || error.message) 
            });
        } finally {
            setLoading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    return (
        <div className="csv-manager-container">
            <header className="csv-header">
                <button onClick={() => navigate('/inventory')} className="back-button">
                    ← Volver
                </button>
                <h1>📊 Gestión de CSV</h1>
            </header>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="csv-content">
                <section className="csv-section">
                    <h2>📤 Exportar Datos</h2>
                    <p className="section-description">
                        Descarga tus datos en formato CSV para análisis externo o respaldo
                    </p>
                    
                    <div className="csv-actions">
                        <div className="csv-card" onClick={handleExportAll}>
                            <div className="card-icon">📊</div>
                            <h3>Exportar Todo</h3>
                            <p>Descarga todos los datos: semillas, lotes, especies y atributos completos</p>
                            <button className="csv-button primary" disabled={loading}>
                                {loading ? 'Exportando...' : 'Exportar Completo'}
                            </button>
                        </div>

                        <div className="csv-card" onClick={handleExportLotes}>
                            <div className="card-icon">📦</div>
                            <h3>Exportar Lotes</h3>
                            <p>Descarga solo la información relacionada con lotes y cosechas</p>
                            <button className="csv-button secondary" disabled={loading}>
                                {loading ? 'Exportando...' : 'Exportar Lotes'}
                            </button>
                        </div>

                        <div className="csv-card" onClick={handleExportEspecies}>
                            <div className="card-icon">🌱</div>
                            <h3>Exportar Especies</h3>
                            <p>Descarga el catálogo de especies con sus características botánicas</p>
                            <button className="csv-button secondary" disabled={loading}>
                                {loading ? 'Exportando...' : 'Exportar Especies'}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="csv-section">
                    <h2>📥 Importar Datos</h2>
                    <p className="section-description">
                        Carga datos desde un archivo CSV. Asegúrate de que el formato sea correcto.
                    </p>
                    
                    <div className="import-area">
                        <label htmlFor="csv-file-input" className="csv-card import-card">
                            <div className="card-icon">📁</div>
                            <h3>Seleccionar archivo CSV</h3>
                            <p>Haz clic para seleccionar un archivo o arrastra aquí</p>
                            <input 
                                id="csv-file-input"
                                type="file" 
                                accept=".csv"
                                onChange={handleImportCSV}
                                disabled={loading}
                                style={{ display: 'none' }}
                            />
                            <button className="csv-button primary" disabled={loading}>
                                {loading ? 'Importando...' : 'Seleccionar Archivo'}
                            </button>
                        </label>
                    </div>

                    <div className="import-info">
                        <h4>ℹ️ Información importante:</h4>
                        <ul>
                            <li>El archivo debe estar en formato CSV (valores separados por comas)</li>
                            <li>La primera fila debe contener los nombres de las columnas</li>
                            <li>Los registros duplicados serán ignorados</li>
                            <li>Verifica que las fechas estén en formato ISO (YYYY-MM-DD)</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default CSVManager;
