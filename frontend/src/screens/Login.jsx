/**
 * Login Screen Component
 * Handles user authentication with email/password and Google OAuth
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[Login] handleSubmit called with:', { email, password });
        setError('');
        setLoading(true);

        try {
            console.log('[Login] Calling login function...');
            const userData = await login({ email, password });
            console.log('[Login] Login returned, userData:', userData);
            console.log('[Login] Token in localStorage NOW:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 30)}...` : 'MISSING');
            console.log('[Login] User in localStorage NOW:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'MISSING');
            
            // INCREASED delay to ensure localStorage is fully synced
            console.log('[Login] Waiting 500ms for localStorage to sync...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[Login] After 500ms delay - Token in localStorage:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
            console.log('[Login] About to navigate to /inventory');
            navigate('/inventory');
            console.log('[Login] Navigation called, waiting for route change...');
        } catch (err) {
            console.error('[Login] Error caught:', err.response?.status, err.response?.data?.detail);
            setError(err.response?.data?.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLogin(tokenResponse.access_token);
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/inventory');
            } catch (err) {
                setError('Error al iniciar sesión con Google');
            }
        },
        onError: () => setError('Error al iniciar sesión con Google')
    });

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
                <div className="text-center mb-6">
                    <h1 className="text-primary mb-2">🌱 Lorapp</h1>
                    <p className="text-gray">Gestiona tu huerta</p>
                </div>

                {error && (
                    <div className="mb-4 rounded" style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Correo electronico</label>
                        <input
                            id="login-email"
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                        />
                        <small className="form-hint">urtzid@gmail.com / admin123</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">Contraseña</label>
                        <input
                            id="login-password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
                    <span style={{ padding: '0 1rem', background: 'white', position: 'relative', zIndex: 1 }}>o</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--color-gray-300)', zIndex: 0 }}></div>
                </div>

                <button
                    onClick={() => handleGoogleLogin()}
                    className="btn btn-outline"
                    style={{ width: '100%' }}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                    </svg>
                    Continuar con Google
                </button>

                <p className="text-center mt-6 text-gray">
                    ¿No tienes cuenta? <Link to="/register" className="text-primary font-semibold">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
