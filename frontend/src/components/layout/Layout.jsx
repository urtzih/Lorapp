import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/my-garden', label: 'Mi Huerta', icon: 'garden' },
        { path: '/my-seedling', label: 'Mi Semillero', icon: 'seedling' },
        { path: '/inventory', label: 'Inventario', icon: 'inventory' },
        { path: '/planting', label: 'Guía SFG', icon: 'planting' },
        { path: '/calendar', label: 'Calendario', icon: 'calendar' },
        { path: '/settings', label: 'Ajustes', icon: 'settings' }
    ];

    const isActive = (path) => location.pathname === path;

    const getIcon = (iconName) => {
        const icons = {
            plant: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M12 2c0 0-4 3-4 6c0 2 2 4 4 4s4-2 4-4C16 5 12 2 12 2M12 12c-3 0-5 2-5 5c0 3 2 5 5 5s5-2 5-5C17 14 15 12 12 12M10 18h4v2h-4z"/></svg>,
            garden: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,12.5A1.5,1.5 0 0,1 10.5,11A1.5,1.5 0 0,1 12,9.5A1.5,1.5 0 0,1 13.5,11A1.5,1.5 0 0,1 12,12.5M12,7.2C9.9,7.2 8.2,8.9 8.2,11C8.2,14 12,17.5 12,17.5C12,17.5 15.8,14 15.8,11C15.8,8.9 14.1,7.2 12,7.2Z"/></svg>,
            seedling: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M12,2C7,2 3,6 3,11C3,14.1 4.8,16.8 7.5,18.3V22H16.5V18.3C19.2,16.8 21,14.1 21,11C21,6 17,2 12,2M12,4C15.9,4 19,7.1 19,11C19,13.4 17.7,15.5 15.8,16.7L15,17.2V20H14V13H10V20H9V17.2L8.2,16.7C6.3,15.5 5,13.4 5,11C5,7.1 8.1,4 12,4M11,6V9H13V6H11Z"/></svg>,
            inventory: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M7 2h10v2H7V2M5 4h14v2H5V4M4 7h16v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7M8 10h2v6H8v-6M12 10h2v6h-2v-6M16 10h2v6h-2v-6Z"/></svg>,
            planting: <svg viewBox="0 0 24 24" fill="currentColor" className="nav-icon-svg"><path d="M17.8 5.8C15.9 4.1 13.5 3 11 3C7.5 3 4.4 4.9 2.7 7.8C2 9 1.6 10.3 1.6 11.7C1.6 14.9 3.5 17.7 6.3 19.1C6.2 18.7 6.2 18.4 6.2 18C6.2 15.2 8.4 13 11.2 13C13.9 13 16.2 15.2 16.2 18C16.2 18.4 16.1 18.7 16.1 19.1C18.9 17.7 20.8 14.9 20.8 11.7C20.8 10.3 20.4 9 19.7 7.8C19 6.6 18.5 6.1 17.8 5.8M11.2 11C9.5 11 8.2 9.7 8.2 8C8.2 6.3 9.5 5 11.2 5C12.9 5 14.2 6.3 14.2 8C14.2 9.7 12.9 11 11.2 11M7.2 18C7.2 15.8 9 14 11.2 14C13.4 14 15.2 15.8 15.2 18C15.2 20.2 13.4 22 11.2 22C9 22 7.2 20.2 7.2 18Z"/></svg>,
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
