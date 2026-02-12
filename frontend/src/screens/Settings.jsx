import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, notificationsAPI, seedsAPI } from '../services/api';
import {
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSubscribed,
    getNotificationPermission
} from '../utils/pushNotifications';

export function Settings() {
    const { user, updateUser, logout } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        location: user?.location || '',
        language: user?.language || 'es',
        notifications_enabled: user?.notifications_enabled !== false
    });
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        checkPushSubscription();
    }, []);

    const checkPushSubscription = async () => {
        const subscribed = await isPushSubscribed();
        setPushSubscribed(subscribed);
    };

    const handleProfileUpdate = async () => {
        setLoading(true);
        setMessage(null);
        try {
            await userAPI.updateProfile(profile);
            updateUser(profile);
            setMessage({ type: 'success', text: '✅ Perfil actualizado correctamente' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: '❌ Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            // Request browser permission
            const permitted = await requestNotificationPermission();
            if (!permitted) {
                setMessage({ type: 'error', text: '❌ Permiso de notificaciones denegado' });
                return;
            }

            // Subscribe to push
            const subscription = await subscribeToPush();

            // Send subscription to backend
            await notificationsAPI.subscribe(subscription);

            setPushSubscribed(true);
            setMessage({ type: 'success', text: '✅ Notificaciones activadas correctamente' });
        } catch (error) {
            console.error('Error enabling notifications:', error);
            setMessage({ type: 'error', text: '❌ Error al activar notificaciones' });
        }
    };

    const handleDisableNotifications = async () => {
        try {
            const endpoint = await unsubscribeFromPush();
            if (endpoint) {
                await notificationsAPI.unsubscribe(endpoint);
            }

            setPushSubscribed(false);
            setMessage({ type: 'success', text: '✅ Notificaciones desactivadas' });
        } catch (error) {
            console.error('Error disabling notifications:', error);
            setMessage({ type: 'error', text: '❌ Error al desactivar notificaciones' });
        }
    };

    const handleTestNotification = async () => {
        try {
            await notificationsAPI.test();
            setMessage({ type: 'success', text: '✅ Notificación de prueba enviada' });
        } catch (error) {
            console.error('Error sending test notification:', error);
            setMessage({ type: 'error', text: '❌ Error al enviar notificación' });
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
            setMessage({ type: 'success', text: '✅ CSV exportado correctamente' });
        } catch (error) {
            console.error('Error exporting CSV:', error);
            setMessage({ type: 'error', text: '❌ Error al exportar CSV' });
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setMessage(null);
        try {
            await userAPI.deleteProfile();
            setDeleteModalOpen(false);
            logout(); // This will clear user data and redirect
        } catch (error) {
            console.error('Error deleting account:', error);
            setMessage({ type: 'error', text: '❌ Error al eliminar la cuenta. Inténtalo de nuevo.' });
            setDeleteModalOpen(false); // Close modal on error too
        } finally {
            setDeleteLoading(false);
        }
    };

    const permissionStatus = getNotificationPermission();

    return (
        <div className="container section">
            <h1 className="mb-6">⚙️ Ajustes</h1>

            {message && (
                <div
                    className="mb-6 rounded"
                    style={{
                        padding: '1rem',
                        backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fee2e2',
                        color: message.type === 'success' ? '#065f46' : '#991b1b'
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Profile Section */}
            <div className="card mb-6">
                <h2 className="mb-4">👤 Perfil</h2>

                <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input
                        type="text"
                        className="input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="input"
                        value={user?.email || ''}
                        disabled
                        style={{ backgroundColor: 'var(--color-gray-100)' }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Ubicación</label>
                    <input
                        type="text"
                        className="input"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="ej: Bilbao, España"
                    />
                    <small className="text-gray">Ayuda a calcular fechas óptimas de siembra</small>
                </div>

                <div className="form-group">
                    <label className="form-label">Idioma</label>
                    <select
                        className="input"
                        value={profile.language}
                        onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    >
                        <option value="es">Español</option>
                        <option value="eu">Euskera</option>
                    </select>
                </div>

                <button
                    onClick={handleProfileUpdate}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
            </div>

            {/* Notifications Section */}
            <div className="card mb-6">
                <h2 className="mb-4">🔔 Notificaciones Push</h2>

                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: pushSubscribed ? 'var(--color-success)' : 'var(--color-gray-400)'
                        }}></div>
                        <span>
                            Estado: <strong>{pushSubscribed ? 'Activadas' : 'Desactivadas'}</strong>
                        </span>
                    </div>

                    {permissionStatus !== 'granted' && !pushSubscribed && (
                        <div className="mb-4 rounded" style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e' }}>
                            ℹ️ Las notificaciones requieren permiso del navegador
                        </div>
                    )}

                    <p className="text-gray text-sm mb-4">
                        Recibe recordatorios de siembra, trasplante y caducidad de semillas
                    </p>
                </div>

                <div className="flex gap-3">
                    {!pushSubscribed ? (
                        <button onClick={handleEnableNotifications} className="btn btn-primary">
                            ✅ Activar notificaciones
                        </button>
                    ) : (
                        <>
                            <button onClick={handleTestNotification} className="btn btn-accent">
                                🔔 Probar notificación
                            </button>
                            <button onClick={handleDisableNotifications} className="btn btn-secondary">
                                ❌ Desactivar
                            </button>
                        </>
                    )}
                </div>

                {pushSubscribed && (
                    <div className="mt-4" style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)' }}>
                        <h4 className="mb-2">📅 Programación de notificaciones</h4>
                        <ul className="text-sm text-gray" style={{ lineHeight: '1.8' }}>
                            <li>• <strong>Día 1</strong> de cada mes: Recomendaciones de siembra</li>
                            <li>• <strong>Diario 10:00</strong>: Alertas de caducidad (30 días antes)</li>
                            <li>• <strong>Diario 08:00</strong>: Recordatorios de trasplante</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Data Section */}
            <div className="card mb-6">
                <h2 className="mb-4">📊 Datos</h2>

                <button onClick={handleExportCSV} className="btn btn-primary mb-3">
                    📥 Exportar inventario a CSV
                </button>

                <p className="text-gray text-sm">
                    Descarga todas tus semillas en formato CSV para análisis externo
                </p>
            </div>

            {/* Account Section */}
            <div className="card">
                <h2 className="mb-4">🔐 Cuenta</h2>

                <div className="flex gap-3">
                    <button onClick={logout} className="btn btn-secondary">
                        🚪 Cerrar sesión
                    </button>
                    <button onClick={() => setDeleteModalOpen(true)} className="btn" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
                        🗑️ Eliminar cuenta
                    </button>
                </div>

                <p className="text-gray text-sm mt-4">
                    <strong>Atención:</strong> La eliminación de la cuenta es permanente y no se puede deshacer.
                </p>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content card">
                        <h2 className="mb-4">🗑️ ¿Seguro que quieres eliminar tu cuenta?</h2>
                        <p className="mb-6">
                            Esta acción es irreversible. Se borrarán todos tus datos, incluyendo
                            tu inventario de semillas y calendario.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="btn"
                                style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
