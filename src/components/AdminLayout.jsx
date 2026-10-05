import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../store/useAuthStore';

export default function AdminLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, loading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!loading && !isAuthenticated) navigate('/login', { replace: true });
    }, [isAuthenticated, loading, navigate]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [sidebarOpen]);

    if (loading || !isAuthenticated) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{'@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'}</style>
            </div>
        );
    }

    return (
        <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Sidebar collapsed={sidebarCollapsed} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                <Header
                    onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
                    onMobileMenu={() => setSidebarOpen((v) => !v)}
                />
                <div className="page-content page-enter">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
