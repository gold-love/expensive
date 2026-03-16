import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <nav className="navbar slide-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button className="hamburger" onClick={onMenuClick}>
                    ☰
                </button>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{
                        color: 'var(--gray)',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        background: 'var(--gray-light)',
                        padding: '6px 12px',
                        borderRadius: '20px'
                    }}>
                        {user?.role === 'admin' ? '🛡️ Admin Session' : '👋 Hello, ' + user?.name}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button
                    onClick={toggleTheme}
                    className="btn-theme"
                    style={{
                        background: 'var(--white)',
                        border: '1px solid var(--gray-light)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 12px',
                    background: 'var(--white)',
                    borderRadius: '30px',
                    border: '1px solid var(--gray-light)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--grad-primary)',
                        backgroundImage: user?.profilePicture ? `url(http://localhost:5000/${user.profilePicture.replace(/\\/g, '/')})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                        border: '1.5px solid var(--white)'
                    }}>
                        {!user?.profilePicture && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>

                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--dark)' }}>
                        {user?.name}
                    </span>
                </div>

                <button
                    onClick={logout}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.8rem', letterSpacing: '0.02em' }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};


export default Navbar;
