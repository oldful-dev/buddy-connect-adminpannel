import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Header({ onToggleSidebar, onMobileMenu }) {
    const { user, logout } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await logout();
    };

    return (
        <header className="admin-header">
            <div className="header-left">
                <button className="header-toggle desktop" onClick={onToggleSidebar}>
                    <Menu size={20} />
                </button>
                <button className="header-toggle mobile" onClick={onMobileMenu}>
                    <Menu size={20} />
                </button>
            </div>
            <div className="header-right">
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <div className="header-avatar" onClick={() => setDropdownOpen((v) => !v)}>
                        {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
                    </div>
                    {dropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-user-info">
                                <strong>{user?.name || 'Administrator'}</strong>
                                <span>{user?.role?.replace('_', ' ') || 'Admin'}</span>
                            </div>
                            <div className="dropdown-divider" />
                            <Link to="/staff" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <User size={16} /> Staff
                            </Link>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item logout" onClick={handleLogout} style={{ width: '100%' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
