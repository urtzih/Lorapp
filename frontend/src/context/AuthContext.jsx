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
            console.log('[AuthContext] Initializing auth...');
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            console.log('[AuthContext] Stored token:', storedToken ? `${storedToken.substring(0, 30)}...` : 'NULL');
            console.log('[AuthContext] Stored user:', storedUser ? JSON.parse(storedUser).email : 'NULL');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                console.log('[AuthContext] Auth restored from localStorage');
            } else {
                console.log('[AuthContext] No stored auth found');
            }

            setLoading(false);
            console.log('[AuthContext] Init complete, loading=false');
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        console.log('[AuthContext] Login called with:', credentials);
        try {
            const response = await authAPI.login(credentials);
            console.log('[AuthContext] Login response:', response);
            const { access_token, user: userData } = response.data;

            console.log('[AuthContext] Saving token to localStorage...');
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('[AuthContext] Token saved:', localStorage.getItem('token') ? 'YES' : 'NO');

            console.log('[AuthContext] Setting state...');
            setToken(access_token);
            setUser(userData);
            console.log('[AuthContext] State set, token in state:', access_token ? 'YES' : 'NO');

            console.log('[AuthContext] Login successful, user:', userData.email);

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
        console.log('[AuthContext] Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        console.log('[AuthContext] Logout complete');
    };

    const updateUser = (updatedData) => {
        const updatedUser = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const isAuth = !!token || !!localStorage.getItem('token');
    console.log('[AuthContext] Rendering - token:', token ? 'EXISTS' : 'NULL', 'localStorage:', localStorage.getItem('token') ? 'EXISTS' : 'NULL', 'isAuthenticated:', isAuth, 'loading:', loading);

    const value = {
        user,
        token,
        loading,
        isAuthenticated: isAuth,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
