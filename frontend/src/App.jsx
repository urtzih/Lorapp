import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Register from './screens/Register'
import MyGarden from './screens/MyGarden'
import MySeedling from './screens/MySeedling'
import Inventory from './screens/Inventory'
import SeedDetail from './screens/SeedDetail'
import Planting from './screens/Sfg'
import Calendar from './screens/Calendar'
import CalendarLunaTiempo from './screens/CalendarLunaTiempo'
import CalendarMonthDetails from './screens/CalendarMonthDetails'
import Settings from './screens/Settings'
import CSVManager from './screens/CSVManager'
import Layout from './components/layout/Layout'

function App() {
    const { isAuthenticated, loading } = useAuth();
    
    console.log('[App] Rendering - isAuthenticated:', isAuthenticated, 'loading:', loading);

    if (loading) {
        console.log('[App] Still loading auth...');
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/onboarding" element={!isAuthenticated ? <Onboarding /> : <Navigate to="/inventory" replace />} />
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/inventory" replace />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/inventory" replace />} />

            {/* Protected routes */}
            <Route
                path="/*"
                element={
                    isAuthenticated ? (
                        (() => {
                            console.log('[App] Rendering protected routes - USER IS AUTHENTICATED');
                            return (
                                <Layout>
                                    <Routes>
                                        <Route path="/" element={<Navigate to="/my-garden" replace />} />
                                        <Route path="/my-garden" element={<MyGarden />} />
                                        <Route path="/my-seedling" element={<MySeedling />} />
                                        <Route path="/inventory" element={<Inventory />} />
                                        <Route path="/seeds/:id" element={<SeedDetail />} />
                                        <Route path="/sfg" element={<Planting />} />
                                        <Route path="/calendar" element={<Calendar />} />
                                        <Route path="/calendar/mes/:year/:month" element={<CalendarMonthDetails />} />
                                        <Route path="/calendar/luna-tiempo" element={<CalendarLunaTiempo />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/csv-manager" element={<CSVManager />} />
                                    </Routes>
                                </Layout>
                            );
                        })()
                    ) : (
                        (() => {
                            console.log('[App] User NOT authenticated, redirecting to /onboarding');
                            return <Navigate to="/onboarding" replace />;
                        })()
                    )
                }
            />
        </Routes>
    );
}

export default App;
