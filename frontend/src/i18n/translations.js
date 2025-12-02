/**
 * Internationalization (i18n) translations for Spanish and Basque.
 */

export const translations = {
    es: {
        // Common
        welcome: 'Bienvenido',
        continue: 'Continuar',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        close: 'Cerrar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',

        // Auth
        login: 'Iniciar sesión',
        register: 'Registrarse',
        logout: 'Cerrar sesión',
        email: 'Correo electrónico',
        password: 'Contraseña',
        name: 'Nombre',
        loginWithGoogle: 'Continuar con Google',

        // Navigation
        inventory: 'Inventario',
        calendar: 'Calendario',
        settings: 'Ajustes',
        profile: 'Perfil',

        // Seeds
        seeds: 'Semillas',
        scanSeed: 'Escanear semilla',
        addSeed: 'Añadir semilla',
        seedDetails: 'Detalles de semilla',
        commercialName: 'Nombre comercial',
        variety: 'Variedad',
        brand: 'Marca',
        productionYear: 'Año de producción',
        expirationDate: 'Fecha de caducidad',
        estimatedCount: 'Cantidad estimada',
        notes: 'Notas',

        // Calendar
        planting: 'Siembra',
        transplanting: 'Trasplante',
        harvesting: 'Cosecha',
        recommendations: 'Recomendaciones',

        // Notifications
        notifications: 'Notificaciones',
        enableNotifications: 'Activar notificaciones',
        disableNotifications: 'Desactivar notificaciones',
        testNotification: 'Probar notificación',

        // Settings
        language: 'Idioma',
        location: 'Ubicación',
        preferences: 'Preferencias',
        exportCSV: 'Exportar a CSV',

        // Messages
        scanningInProgress: 'Escaneando semilla...',
        seedCreated: 'Semilla añadida correctamente',
        seedUpdated: 'Semilla actualizada',
        seedDeleted: 'Semilla eliminada',
        notificationsEnabled: 'Notificaciones activadas',
        notificationsDisabled: 'Notificaciones desactivadas',
    },

    eu: {
        // Common
        welcome: 'Ongi etorri',
        continue: 'Jarraitu',
        cancel: 'Utzi',
        save: 'Gorde',
        delete: 'Ezabatu',
        edit: 'Aldatu',
        close: 'Itxi',
        loading: 'Kargatzen...',
        error: 'Errorea',
        success: 'Arrakasta',

        // Auth
        login: 'Hasi saioa',
        register: 'Erregistratu',
        logout: 'Itxi saioa',
        email: 'Helbide elektronikoa',
        password: 'Pasahitza',
        name: 'Izena',
        loginWithGoogle: 'Google-rekin jarraitu',

        // Navigation
        inventory: 'Inbentarioa',
        calendar: 'Egutegia',
        settings: 'Ezarpenak',
        profile: 'Profila',

        // Seeds
        seeds: 'Haziak',
        scanSeed: 'Hazia eskaneatu',
        addSeed: 'Hazia gehitu',
        seedDetails: 'Haziaren xehetasunak',
        commercialName: 'Izen komertziala',
        variety: 'Barietatea',
        brand: 'Marka',
        productionYear: 'Ekoizpen urtea',
        expirationDate: 'Iraungitze data',
        estimatedCount: 'Kopuru estimatua',
        notes: 'Oharrak',

        // Calendar
        planting: 'Landaketa',
        transplanting: 'Transplantea',
        harvesting: 'Uzta',
        recommendations: 'Gomendioak',

        // Notifications
        notifications: 'Jakinarazpenak',
        enableNotifications: 'Jakinarazpenak aktibatu',
        disableNotifications: 'Jakinarazpenak desaktibatu',
        testNotification: 'Jakinarazpena probatu',

        // Settings
        language: 'Hizkuntza',
        location: 'Kokapena',
        preferences: 'Hobespenak',
        exportCSV: 'CSV-ra esportatu',

        // Messages
        scanningInProgress: 'Hazia eskaneatzen...',
        seedCreated: 'Hazia ondo gehitu da',
        seedUpdated: 'Hazia eguneratu da',
        seedDeleted: 'Hazia ezabatu da',
        notificationsEnabled: 'Jakinarazpenak aktibatu dira',
        notificationsDisabled: 'Jakinarazpenak desaktibatu dira',
    },
};

/**
 * Get translation for a key in the specified language
 */
export function t(key, lang = 'es') {
    return translations[lang]?.[key] || translations.es[key] || key;
}

export default translations;
