import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Expenses from './pages/Expenses';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import { useContext, useState } from 'react';

import AuthContext from './context/AuthContext';

const PrivateRoute = () => {
    const { user, loading } = useContext(AuthContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return user ? (
        <div className="layout">
            {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}></div>}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main className="main-content" style={{ flex: 1 }}>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    ) : (
        <Navigate to="/login" />
    );
};

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />

                            <Route element={<PrivateRoute />}>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/add-expense" element={<AddExpense />} />
                                <Route path="/expenses" element={<Expenses />} />
                                <Route path="/approvals" element={<Approvals />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/budgets" element={<Budgets />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/users" element={<Users />} />
                            </Route>

                        </Routes>
                    </Router>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;
