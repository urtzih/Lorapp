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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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

// ===== NOTIFICATIONS API =====
export const notificationsAPI = {
    subscribe: (subscriptionData) => api.post('/notifications/subscribe', subscriptionData),
    unsubscribe: (endpoint) => api.delete('/notifications/unsubscribe', { params: { endpoint } }),
    test: () => api.post('/notifications/test'),
    getSubscriptions: () => api.get('/notifications/subscriptions'),
};

export default api;
