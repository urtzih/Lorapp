import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div>
            <nav className="navbar">
                <div className="container flex justify-between items-center">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            🌱 Lorapp
                        </span>
                        <Link to="/inventory" className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}>
                            Inventario
                        </Link>
                        <Link to="/calendar" className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}>
                            Calendario
                        </Link>
                        <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                            Ajustes
                        </Link>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span className="text-gray">{user?.name}</span>
                        <button onClick={logout} className="btn btn-secondary btn-sm">
                            Salir
                        </button>
                    </div>
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}

export default Layout;
