/**
 * Authentication context provider.
 * Manages user authentication state throughout the app.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Check if user is logged in on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        console.log('[AuthContext] Login called with:', credentials);
        try {
            const response = await authAPI.login(credentials);
            console.log('[AuthContext] Login response:', response);
            const { access_token, user: userData } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(access_token);
            setUser(userData);

            console.log('[AuthContext] Login successful, user:', userData);

            return userData;
        } catch (error) {
            console.error('[AuthContext] Login error:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { access_token, user: newUser } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(newUser));

        setToken(access_token);
        setUser(newUser);

        return newUser;
    };

    const googleLogin = async (googleToken) => {
        const response = await authAPI.googleAuth(googleToken);
        const { access_token, user: userData } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(access_token);
        setUser(userData);

        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
