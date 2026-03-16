import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
    const { user } = useContext(AuthContext);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        ...(user?.orgSettings?.expenseModuleEnabled !== false ? [
            { path: '/add-expense', label: 'Add Expense', icon: '➕' },
            { path: '/expenses', label: 'My Expenses', icon: '💸' }
        ] : []),
        ...(user?.orgSettings?.budgetModuleEnabled !== false ? [
            { path: '/budgets', label: 'Budgets', icon: '📈' }
        ] : []),
        { path: '/reports', label: 'Reports', icon: '📋' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    // Admin-only link
    if (user?.role === 'admin') {
        navItems.splice(4, 0, { path: '/approvals', label: 'Approvals', icon: '✅' });
        navItems.splice(6, 0, { path: '/users', label: 'Users', icon: '👥' });
    }


    return (
        <>
            <div className="brand" style={{ marginBottom: '40px', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--white)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)' }}>●</span> Finsight
                </h1>
                <button
                    className="hamburger"
                    onClick={onClose}
                    style={{ color: 'white' }}
                >
                    ✕
                </button>
            </div>
            <nav>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {navItems.map((item) => (
                        <li key={item.path} style={{ marginBottom: '4px' }}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? 'active-link' : ''}
                                onClick={onClose}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ marginTop: 'auto', padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'var(--gray)', fontSize: '12px' }}>Logged in as</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{user?.name}</p>
                <p style={{ color: 'var(--primary)', fontSize: '12px', textTransform: 'capitalize' }}>{user?.role || 'employee'}</p>
            </div>
        </>
    );
};

export default Sidebar;
