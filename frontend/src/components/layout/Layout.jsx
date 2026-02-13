import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/inventory', label: 'Inventario', icon: 'inventory' },
        { path: '/scan', label: 'Escanear', icon: 'scan' },
        { path: '/calendar', label: 'Calendario', icon: 'calendar' },
        { path: '/settings', label: 'Ajustes', icon: 'settings' }
    ];

    const isActive = (path) => location.pathname === path;

    const getIcon = (iconName) => {
        const icons = {
            plant: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M12 2c0 0-4 3-4 6c0 2 2 4 4 4s4-2 4-4C16 5 12 2 12 2M12 12c-3 0-5 2-5 5c0 3 2 5 5 5s5-2 5-5C17 14 15 12 12 12M10 18h4v2h-4z"/></svg>,
            inventory: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M7 2h10v2H7V2M5 4h14v2H5V4M4 7h16v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7M8 10h2v6H8v-6M12 10h2v6h-2v-6M16 10h2v6h-2v-6Z"/></svg>,
            scan: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M3 3h6v2H3V3M15 3h6v2h-6V3M3 9h2v2H3V9M19 9h2v2h-2V9M3 15h2v2H3v-2M19 15h2v2h-2v-2M3 21h6v2H3v-2M15 21h6v2h-6v-2M9 11h6v2H9v-2Z"/></svg>,
            calendar: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M7 2h2v2H7V2M15 2h2v2h-2V2M5 4h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2M5 8v12h14V8H5M7 10h2v2H7v-2M11 10h2v2h-2v-2M15 10h2v2h-2v-2Z"/></svg>,
            settings: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M19.4 13h-0.8c-0.4 0-0.8 0.3-1 0.7l-0.2 0.5c-0.2 0.5 0 1 0.4 1.3l0.6 0.6c0.3 0.3 0.3 0.8 0 1.1l-1.4 1.4c-0.3 0.3-0.8 0.3-1.1 0l-0.6-0.6c-0.3-0.3-0.8-0.5-1.3-0.4l-0.5 0.2c-0.4 0.2-0.7 0.6-0.7 1v0.8c0 0.4-0.3 0.8-0.8 0.8h-2c-0.4 0-0.8-0.3-0.8-0.8v-0.8c0-0.4-0.3-0.8-0.7-1l-0.5-0.2c-0.5-0.2-1 0-1.3 0.4l-0.6 0.6c-0.3 0.3-0.8 0.3-1.1 0l-1.4-1.4c-0.3-0.3-0.3-0.8 0-1.1l0.6-0.6c0.3-0.3 0.5-0.8 0.4-1.3l-0.2-0.5c-0.2-0.4-0.6-0.7-1-0.7h-0.8c-0.4 0-0.8-0.3-0.8-0.8v-2c0-0.4 0.3-0.8 0.8-0.8h0.8c0.4 0 0.8-0.3 1-0.7l0.2-0.5c0.2-0.5 0-1-0.4-1.3l-0.6-0.6c-0.3-0.3-0.3-0.8 0-1.1l1.4-1.4c0.3-0.3 0.8-0.3 1.1 0l0.6 0.6c0.3 0.3 0.8 0.5 1.3 0.4l0.5-0.2c0.4-0.2 0.7-0.6 0.7-1v-0.8c0-0.4 0.3-0.8 0.8-0.8h2c0.4 0 0.8 0.3 0.8 0.8v0.8c0 0.4 0.3 0.8 0.7 1l0.5 0.2c0.5 0.2 1 0 1.3-0.4l0.6-0.6c0.3-0.3 0.8-0.3 1.1 0l1.4 1.4c0.3 0.3 0.3 0.8 0 1.1l-0.6 0.6c-0.3 0.3-0.5 0.8-0.4 1.3l0.2 0.5c0.2 0.4 0.6 0.7 1 0.7h0.8c0.4 0 0.8 0.3 0.8 0.8v2c0 0.4-0.4 0.8-0.8 0.8M12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5Z"/></svg>,
            logout: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>,
        };
        return icons[iconName] || null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Navbar - Visible on all screens */}
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="navbar-brand">
                        {getIcon('plant')}
                        <span>Lorapp</span>
                    </div>
                    <div className="navbar-nav">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                            >
                                <span style={{ marginRight: 'var(--space-2)' }}>
                                    {getIcon(item.icon)}
                                </span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="navbar-user">
                        <span className="text-gray text-sm">{user?.name}</span>
                        <button onClick={logout} className="btn btn-secondary btn-sm">
                            Salir
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <div className="bottom-nav-container">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">{getIcon(item.icon)}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}

export default Layout;
