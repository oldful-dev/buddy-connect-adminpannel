import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { NAV_SECTIONS } from '../lib/nav';

export default function Sidebar({ collapsed, open, onClose }) {
    const { user } = useAuthStore();
    const userRole = user?.role || 'SUPPORT_AGENT';
    const location = useLocation();
    const currentPath = location.pathname;
    const currentSearch = location.search.replace(/^\?/, '');

    return (
        <>
            {open && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/onlylogo.png" alt="Ayuxa Logo" width={40} height={40} style={{ objectFit: 'contain' }} />
                    </div>
                    {(!collapsed || open) && (
                        <div className="sidebar-brand">
                            <h1>Ayuxa</h1>
                            <span>Admin Panel</span>
                        </div>
                    )}
                    <button className="mobile-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {NAV_SECTIONS.map((section) => {
                        const filteredItems = section.items.filter((item) => item.roles.includes(userRole));
                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={section.title} className="sidebar-section">
                                {!collapsed && <div className="sidebar-section-title">{section.title}</div>}
                                {filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    const [itemPath, itemQuery = ''] = item.href.split('?');
                                    const isActive = currentPath === itemPath && (itemQuery === '' || currentSearch === itemQuery);
                                    return (
                                        <Link
                                            key={item.id}
                                            to={item.href}
                                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                                            onClick={onClose}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <Icon size={18} />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
