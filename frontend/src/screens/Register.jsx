import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        language: 'es'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/inventory');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLogin(tokenResponse.access_token);
                navigate('/inventory');
            } catch (err) {
                setError('Error al registrarse con Google');
            }
        },
        onError: () => setError('Error al registrarse con Google')
    });

    return (
        <div className="auth-container">
            <div className="auth-card card animate-slideUp">
                <div className="auth-header text-center mb-6">
                    <h1 className="text-primary mb-2">🌱 Lorapp</h1>
                    <h2 className="mb-2">Crear cuenta</h2>
                    <p className="text-gray">Comienza a gestionar tu huerta</p>
                </div>

                {error && (
                    <div className="auth-error mb-4 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="register-name">Nombre completo</label>
                        <input
                            id="register-name"
                            type="text"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Tu nombre"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-email">Correo electrónico</label>
                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-password">Contraseña</label>
                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            className="input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-language">Idioma preferido</label>
                        <select id="register-language" name="language" className="input" value={formData.language} onChange={handleChange}>
                            <option value="es">Español</option>
                            <option value="eu">Euskera</option>
                        </select>
                    </div>

                    <button type="submit" className="auth-submit btn btn-primary" disabled={loading}>
                        {loading ? 'Registrando...' : 'Crear cuenta'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span className="auth-divider__text">o</span>
                    <div className="auth-divider__line"></div>
                </div>

                <button onClick={() => handleGoogleLogin()} className="auth-google-btn btn btn-outline">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                    </svg>
                    Registrarse con Google
                </button>

                <p className="text-center mt-6 text-gray">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-primary font-semibold">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
