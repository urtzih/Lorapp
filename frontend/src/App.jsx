import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import Register from './screens/Register'
import Inventory from './screens/Inventory'
import SeedDetail from './screens/SeedDetail'
import SeedScan from './screens/SeedScan'
import Calendar from './screens/Calendar'
import Settings from './screens/Settings'
import Layout from './components/layout/Layout'

function App() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
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
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Navigate to="/inventory" replace />} />
                                <Route path="/inventory" element={<Inventory />} />
                                <Route path="/seeds/:id" element={<SeedDetail />} />
                                <Route path="/scan" element={<SeedScan />} />
                                <Route path="/calendar" element={<Calendar />} />
                                <Route path="/settings" element={<Settings />} />
                            </Routes>
                        </Layout>
                    ) : (
                        <Navigate to="/onboarding" replace />
                    )
                }
            />
        </Routes>
    );
}

export default App;
