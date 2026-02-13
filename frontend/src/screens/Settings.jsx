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
    const [expandedSection, setExpandedSection] = useState('profile'); // 'profile', 'notifications', 'data', 'account'

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
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const permitted = await requestNotificationPermission();
            if (!permitted) {
                setMessage({ type: 'error', text: 'Permiso de notificaciones denegado' });
                return;
            }

            const subscription = await subscribeToPush();
            await notificationsAPI.subscribe(subscription);

            setPushSubscribed(true);
            setMessage({ type: 'success', text: 'Notificaciones activadas correctamente' });
        } catch (error) {
            console.error('Error enabling notifications:', error);
            setMessage({ type: 'error', text: 'Error al activar notificaciones' });
        }
    };

    const handleDisableNotifications = async () => {
        try {
            const endpoint = await unsubscribeFromPush();
            if (endpoint) {
                await notificationsAPI.unsubscribe(endpoint);
            }

            setPushSubscribed(false);
            setMessage({ type: 'success', text: 'Notificaciones desactivadas' });
        } catch (error) {
            console.error('Error disabling notifications:', error);
            setMessage({ type: 'error', text: 'Error al desactivar notificaciones' });
        }
    };

    const handleTestNotification = async () => {
        try {
            await notificationsAPI.test();
            setMessage({ type: 'success', text: 'Notificación de prueba enviada' });
        } catch (error) {
            console.error('Error sending test notification:', error);
            setMessage({ type: 'error', text: 'Error al enviar notificación' });
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
            setMessage({ type: 'success', text: 'CSV exportado correctamente' });
        } catch (error) {
            console.error('Error exporting CSV:', error);
            setMessage({ type: 'error', text: 'Error al exportar CSV' });
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setMessage(null);
        try {
            await userAPI.deleteProfile();
            setDeleteModalOpen(false);
            logout();
        } catch (error) {
            console.error('Error deleting account:', error);
            setMessage({ type: 'error', text: 'Error al eliminar la cuenta. Inténtalo de nuevo.' });
            setDeleteModalOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const permissionStatus = getNotificationPermission();

    return (
        <div className="container section">
            <h1 className="mb-6">Ajustes</h1>

            {/* Alert Message */}
            {message && (
                <div className={`settings-alert mb-6 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Section */}
            <div className="settings-card mb-6">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'profile' ? '' : 'profile')}
                    className="settings-header"
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-4)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: expandedSection === 'profile' ? '1px solid var(--color-gray-200)' : 'none'
                    }}
                >
                    <h2 style={{ margin: 0 }}>👤 Perfil</h2>
                    <span style={{ 
                        fontSize: '1.2rem',
                        transform: expandedSection === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </button>
                <div style={{
                    maxHeight: expandedSection === 'profile' ? '2000px' : '0',
                    opacity: expandedSection === 'profile' ? '1' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
                    padding: expandedSection === 'profile' ? 'var(--space-4)' : '0 var(--space-4)'
                }}>

                <div className="form-group">
                    <label className="form-label" htmlFor="profile-name">Nombre</label>
                    <input
                        id="profile-name"
                        type="text"
                        className="input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Tu nombre"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="profile-email">Email</label>
                    <input
                        id="profile-email"
                        type="email"
                        className="input"
                        value={user?.email || ''}
                        disabled
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="profile-location">Ubicación</label>
                    <input
                        id="profile-location"
                        type="text"
                        className="input"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="ej: Bilbao, España"
                    />
                    <small className="form-hint">Ayuda a calcular fechas óptimas de siembra</small>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="profile-language">Idioma</label>
                    <select
                        id="profile-language"
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
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="settings-card mb-6">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'notifications' ? '' : 'notifications')}
                    className="settings-header"
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-4)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: expandedSection === 'notifications' ? '1px solid var(--color-gray-200)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <h2 style={{ margin: 0 }}>🔔 Notificaciones Push</h2>
                        {pushSubscribed && (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>activas</span>
                        )}
                    </div>
                    <span style={{ 
                        fontSize: '1.2rem',
                        transform: expandedSection === 'notifications' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </button>
                <div style={{
                    maxHeight: expandedSection === 'notifications' ? '2000px' : '0',
                    opacity: expandedSection === 'notifications' ? '1' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
                    padding: expandedSection === 'notifications' ? 'var(--space-4)' : '0 var(--space-4)'
                }}>

                <div className="notification-status mb-4">
                    <div className="status-indicator">
                        <span className={`status-dot ${pushSubscribed ? 'active' : 'inactive'}`}></span>
                        <span>Estado: <strong>{pushSubscribed ? 'Activadas' : 'Desactivadas'}</strong></span>
                    </div>

                    {permissionStatus !== 'granted' && !pushSubscribed && (
                        <div className="info-badge">
                            Las notificaciones requieren permiso del navegador
                        </div>
                    )}

                    <p className="text-gray text-sm">
                        Recibe recordatorios de siembra, trasplante y caducidad de semillas
                    </p>
                </div>

                <div className="notification-buttons">
                    {!pushSubscribed ? (
                        <button onClick={handleEnableNotifications} className="btn btn-primary btn-lg">
                            Activar notificaciones
                        </button>
                    ) : (
                        <>
                            <button onClick={handleTestNotification} className="btn btn-accent">
                                Probar notificación
                            </button>
                            <button onClick={handleDisableNotifications} className="btn btn-secondary btn-sm">
                                Desactivar
                            </button>
                        </>
                    )}
                </div>

                {pushSubscribed && (
                    <div className="notification-schedule">
                        <h4>Horarios de notificaciones</h4>
                        <ul>
                            <li><strong>Día 1</strong> de cada mes: Recomendaciones de siembra</li>
                            <li><strong>10:00</strong> cada día: Alertas de caducidad (30 días antes)</li>
                            <li><strong>08:00</strong> cada día: Recordatorios de trasplante</li>
                        </ul>
                    </div>
                )}
                </div>
            </div>

            {/* Data Section */}
            <div className="settings-card mb-6">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'data' ? '' : 'data')}
                    className="settings-header"
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-4)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: expandedSection === 'data' ? '1px solid var(--color-gray-200)' : 'none'
                    }}
                >
                    <h2 style={{ margin: 0 }}>📊 Datos</h2>
                    <span style={{ 
                        fontSize: '1.2rem',
                        transform: expandedSection === 'data' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </button>
                <div style={{
                    maxHeight: expandedSection === 'data' ? '2000px' : '0',
                    opacity: expandedSection === 'data' ? '1' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
                    padding: expandedSection === 'data' ? 'var(--space-4)' : '0 var(--space-4)'
                }}>

                <p className="text-gray text-sm mb-4">
                    Descarga todas tus semillas en formato CSV para análisis externo
                </p>

                <button onClick={handleExportCSV} className="btn btn-primary btn-lg">
                    Exportar inventario a CSV
                </button>
                </div>
            </div>

            {/* Account Section */}
            <div className="settings-card">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'account' ? '' : 'account')}
                    className="settings-header"
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-4)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: expandedSection === 'account' ? '1px solid var(--color-gray-200)' : 'none'
                    }}
                >
                    <h2 style={{ margin: 0 }}>⚙️ Cuenta</h2>
                    <span style={{ 
                        fontSize: '1.2rem',
                        transform: expandedSection === 'account' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </button>
                <div style={{
                    maxHeight: expandedSection === 'account' ? '2000px' : '0',
                    opacity: expandedSection === 'account' ? '1' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
                    padding: expandedSection === 'account' ? 'var(--space-4)' : '0 var(--space-4)'
                }}>

                <p className="text-gray text-sm mb-6">
                    Gestiona tu sesión y cuenta
                </p>

                <div className="account-buttons">
                    <button onClick={logout} className="btn btn-secondary btn-lg">
                        Cerrar sesión
                    </button>
                    <button 
                        onClick={() => setDeleteModalOpen(true)} 
                        className="btn btn-danger btn-sm"
                    >
                        Eliminar cuenta
                    </button>
                </div>

                <p className="danger-notice">
                    <strong>Atención:</strong> La eliminación de la cuenta es permanente y no se puede deshacer.
                </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Eliminar cuenta</h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="text-gray">
                                Esta acción es irreversible. Se borrarán todos tus datos, incluyendo tu inventario de semillas y calendario.
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="btn btn-secondary btn-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="btn btn-danger btn-lg"
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
