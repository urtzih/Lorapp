/**
 * API client service using axios.
 * Handles all HTTP requests to the backend with authentication.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('[API Interceptor] Request to:', config.url, 'Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('[API Interceptor] 401 Unauthorized detected! Clearing auth...');
            console.error('[API Interceptor] Request was:', error.config?.method, error.config?.url);
            console.error('[API Interceptor] Response:', error.response?.data);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.error('[API Interceptor] Auth cleared, redirecting to /login');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ===== AUTH API =====
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    googleAuth: (token) => api.post('/auth/google', { token }),
    getMe: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
};

// ===== USER API =====
export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    updatePreferences: (data) => api.put('/users/preferences', data),
    deleteProfile: () => api.delete('/users/profile'),
};

// ===== SEEDS API =====
export const seedsAPI = {
    scan: (formData) => api.post('/seeds/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    create: (seedData) => api.post('/seeds', seedData),
    list: (filters = {}) => api.get('/seeds', { params: filters }),
    getOne: (id) => api.get(`/seeds/${id}`),
    update: (id, data) => api.put(`/seeds/${id}`, data),
    updateVariedad: (id, data) => api.put(`/seeds/variedades/${id}`, data),
    updateEspecie: (id, data) => api.put(`/seeds/especies/${id}`, data),
    addPhotos: (id, formData) => api.post(`/seeds/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deletePhoto: (id, photo) => api.delete(`/seeds/${id}/photos`, { params: { photo } }),
    setPhotoPrincipal: (id, photo) => api.put(`/seeds/${id}/photos/set-principal`, {}, { params: { photo } }),
    delete: (id) => api.delete(`/seeds/${id}`),
    exportCSV: () => api.get('/seeds/export/csv', { responseType: 'blob' }),
};

// ===== CALENDAR API =====
export const calendarAPI = {
    getMonthly: (month, year) => api.get('/calendar/monthly', { params: { month, year } }),
    getCurrent: () => api.get('/calendar/current'),
    getRecommendations: () => api.get('/calendar/recommendations'),
    getUpcomingTransplants: (days = 7) =>
        api.get('/calendar/upcoming-transplants', { params: { days } }),
    getExpiring: (days = 30) =>
        api.get('/calendar/expiring-seeds', { params: { days } }),
};

// ===== LUNAR API (NEW) =====
export const lunarAPI = {
    getToday: () => api.get('/lunar/today'),
    getMonth: (year, month) => api.get(`/lunar/month/${year}/${month}`),
    prefetchMonth: (year, month) => api.post(`/lunar/prefetch/${year}/${month}`),
};

// ===== INTEGRATED CALENDAR API (NEW) =====
export const integratedCalendarAPI = {
    getMonth: (year, month) => api.get(`/calendar-integrated/month/${year}/${month}`),
    getWeekForecast: (startDate = null, days = 7) => 
        api.get('/calendar-integrated/week-forecast', { 
            params: { 
                start_date: startDate, 
                days 
            } 
        }),
    getPlantingAdvisory: () => api.get('/calendar-integrated/planting-advisory'),
};

// ===== NOTIFICATIONS API =====
export const notificationsAPI = {
    subscribe: (subscriptionData) => api.post('/notifications/subscribe', subscriptionData),
    unsubscribe: (endpoint) => api.delete('/notifications/unsubscribe', { params: { endpoint } }),
    test: () => api.post('/notifications/test'),
    getSubscriptions: () => api.get('/notifications/subscriptions'),
};

// ===== MY GARDEN API =====
export const myGardenAPI = {
    list: (filters = {}) => api.get('/my-garden', { params: filters }),
    create: (plantingData) => api.post('/my-garden', plantingData),
    getOne: (id) => api.get(`/my-garden/${id}`),
    update: (id, data) => api.put(`/my-garden/${id}`, data),
    delete: (id) => api.delete(`/my-garden/${id}`),
    getStats: () => api.get('/my-garden/stats/summary'),
};

// ===== MY SEEDLING API =====
export const mySeedlingAPI = {
    list: (filters = {}) => api.get('/my-seedling', { params: filters }),
    create: (seedlingData) => api.post('/my-seedling', seedlingData),
    getOne: (id) => api.get(`/my-seedling/${id}`),
    update: (id, data) => api.put(`/my-seedling/${id}`, data),
    transplant: (id, transplantData) => api.patch(`/my-seedling/${id}/transplant`, transplantData),
    delete: (id) => api.delete(`/my-seedling/${id}`),
    getStats: () => api.get('/my-seedling/stats/summary'),
};

export default api;
