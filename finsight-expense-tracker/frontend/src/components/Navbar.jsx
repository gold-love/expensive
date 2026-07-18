import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import api, { getApiUrl } from '../services/api';
import { getTranslation } from '../utils/i18n';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    /* ── fetch notifications on mount + every 60s ── */
    const fetchNotifications = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/unread-count')
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(countRes.data.count || 0);
        } catch { /* silently fail */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    /* ── close on outside click ── */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* ignore */ }
    };

    const handleMarkOneRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const typeIcon = (type) => {
        const map = {
            budget_alert: '💰', expense_approved: '✅', expense_rejected: '❌',
            warning: '⚠️', info: 'ℹ️'
        };
        return map[type] || '🔔';
    };

    return (
        <nav className="navbar slide-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button className="hamburger" onClick={onMenuClick}>☰</button>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{
                        color: 'var(--gray)', fontWeight: '500', fontSize: '0.9rem',
                        background: 'var(--gray-light)', padding: '6px 12px', borderRadius: '20px'
                    }}>
                        {user?.role === 'admin' 
                            ? `🛡️ ${getTranslation(user?.language, 'admin_session')}` 
                            : `${getTranslation(user?.language, 'hello')}, ${user?.name}`}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                {/* ── NOTIFICATION BELL ── */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        id="notification-bell-btn"
                        onClick={() => setShowDropdown(prev => !prev)}
                        style={{
                            background: 'var(--white)', border: '1px solid var(--gray-light)',
                            fontSize: '18px', cursor: 'pointer', padding: '8px 12px',
                            borderRadius: '10px', boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s ease', position: 'relative'
                        }}
                        title="Notifications"
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-6px', right: '-6px',
                                background: '#ef4444', color: 'white', borderRadius: '50%',
                                width: '18px', height: '18px', fontSize: '10px', fontWeight: '800',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--white)', lineHeight: 1
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                            width: '360px', background: 'var(--white)',
                            borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                            border: '1px solid var(--gray-light)', zIndex: 500,
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 20px', borderBottom: '1px solid var(--gray-light)'
                            }}>
                                <div>
                                    <span style={{ fontWeight: '800', fontSize: '15px' }}>Notifications</span>
                                    {unreadCount > 0 && (
                                        <span style={{
                                            marginLeft: '8px', background: 'var(--primary-soft)',
                                            color: 'var(--primary)', padding: '2px 8px', borderRadius: '20px',
                                            fontSize: '11px', fontWeight: '700'
                                        }}>{unreadCount} new</span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray)' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                                        <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 20).map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.read && handleMarkOneRead(n.id)}
                                            style={{
                                                display: 'flex', gap: '12px', padding: '14px 20px',
                                                borderBottom: '1px solid var(--gray-light)',
                                                background: n.read ? 'transparent' : 'var(--primary-soft)',
                                                cursor: n.read ? 'default' : 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: '50%',
                                                background: 'var(--gray-light)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '18px', flexShrink: 0
                                            }}>
                                                {typeIcon(n.type)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: n.read ? '500' : '700', fontSize: '13px', marginBottom: '2px' }}>
                                                    {n.title}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--gray)', lineHeight: '1.4' }}>
                                                    {n.message}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px' }}>
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            {!n.read && (
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: 'var(--primary)', flexShrink: 0, marginTop: '4px'
                                                }} />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-light)', textAlign: 'center' }}>
                                <Link
                                    to="/settings"
                                    state={{ tab: 'notifications' }}
                                    onClick={() => setShowDropdown(false)}
                                    style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}
                                >
                                    Manage notification preferences →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── THEME TOGGLE ── */}
                <button
                    onClick={toggleTheme}
                    className="btn-theme"
                    style={{
                        background: 'var(--white)', border: '1px solid var(--gray-light)',
                        fontSize: '18px', cursor: 'pointer', padding: '8px 12px',
                        borderRadius: '10px', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease'
                    }}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                {/* ── USER AVATAR ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 12px',
                    background: 'var(--white)', borderRadius: '30px',
                    border: '1px solid var(--gray-light)', boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--grad-primary)',
                        backgroundImage: user?.profilePicture ? `url(${getApiUrl(user.profilePicture)})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold', fontSize: '13px',
                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                        border: '1.5px solid var(--white)'
                    }}>
                        {!user?.profilePicture && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--dark)' }}>{user?.name}</span>
                </div>

                {/* ── LOGOUT ── */}
                <button
                    onClick={logout}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.8rem', letterSpacing: '0.02em' }}
                >
                    {getTranslation(user?.language, 'logout')}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
