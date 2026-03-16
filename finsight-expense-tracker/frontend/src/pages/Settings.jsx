import React, { useContext, useState, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

const IdentityCard = ({ user, qrCode }) => (
    <div className="printable-card" style={{
        width: '320px',
        height: '500px',
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        color: '#1e293b',
        margin: '20px auto'
    }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'var(--grad-primary)', borderRadius: '20px 20px 0 0' }} />
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, justifyContent: 'center' }}>
                <span style={{ color: 'var(--primary)' }}>●</span> Finsight
            </h2>
            <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0 0' }}>Enterprise Intelligence</p>
        </div>
        <div style={{
            width: '120px', height: '120px', borderRadius: '50%', background: '#f1f5f9',
            backgroundImage: user?.profilePicture ? `url(http://localhost:5000/${user.profilePicture.replace(/\\/g, '/')})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: '20px', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '48px', fontWeight: 'bold'
        }}>
            {!user?.profilePicture && (user?.name?.charAt(0) || 'U')}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--primary)', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase' }}>{user.role}</p>
        </div>
        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '2px solid #f1f5f9', marginBottom: '20px' }}>
            <img src={qrCode} alt="Security Key" style={{ width: '130px', height: '130px' }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>ID: FS-{user.id?.toString().padStart(6, '0') || 'DEMO'}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>SECURE ACCESS ONLY</p>
        </div>
    </div>
);

const Settings = () => {
    const { user, updateProfile, updateProfileImage } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const toast = useToast();
    const fileInputRef = useRef(null);

    const handlePrintCard = () => {
        const printContent = document.getElementById('identity-card-container').innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = `
            <html>
                <head>
                    <title>Finsight Identity Card - ${user.name}</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: white; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Required because React state is lost when overwriting innerHTML
    };

    // Basic Settings
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [currency, setCurrency] = useState(user?.preferredCurrency || 'USD');
    const [uploading, setUploading] = useState(false);

    // Advanced Settings
    const [fiscalYearStart, setFiscalYearStart] = useState(user?.fiscalYearStart || 1);
    const [defaultCategory, setDefaultCategory] = useState(user?.defaultCategory || '');
    const [defaultBudgetCategory, setDefaultBudgetCategory] = useState(user?.defaultBudgetCategory || '');
    const [defaultCurrency, setDefaultCurrency] = useState(user?.defaultCurrency || 'USD');

    // Organization Settings (Admin only)
    const [orgSettings, setOrgSettings] = useState({
        requireReceipts: false,
        autoApproveLimit: 0,
        autoApproveBudgetLimit: 0,
        expenseModuleEnabled: true,
        budgetModuleEnabled: true,
        allowMultiCurrency: true
    });

    // Notification Preferences
    const [notificationPrefs, setNotificationPrefs] = useState({
        budgetAlerts: user?.notificationPreferences?.budgetAlerts ?? true,
        expenseApproved: user?.notificationPreferences?.expenseApproved ?? true,
        expenseRejected: user?.notificationPreferences?.expenseRejected ?? true,
        weeklyReport: user?.notificationPreferences?.weeklyReport ?? false,
        monthlyReport: user?.notificationPreferences?.monthlyReport ?? true
    });

    // 2FA State
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false);
    const [qrCode, setQrCode] = useState(null);
    const [twoFAToken, setTwoFAToken] = useState('');
    const [passwordFor2FA, setPasswordFor2FA] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    // Audit State
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);

    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (activeTab === 'audit' && user?.role === 'admin') {
            fetchAuditLogs();
        }
        if (activeTab === 'organization' && user?.role === 'admin') {
            fetchOrgSettings();
        }
    }, [activeTab]);

    useEffect(() => {
        if (showScanner && activeTab === 'security' && !twoFactorEnabled) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
            scanner.render((decodedText) => {
                // Handle OTP Auth URL or plain code
                if (decodedText.includes('otpauth://')) {
                    const url = new URL(decodedText);
                    const secret = url.searchParams.get('secret');
                    setTwoFAToken(secret || '');
                } else {
                    setTwoFAToken(decodedText);
                }
                scanner.clear();
                setShowScanner(false);
            }, (error) => {
                // Ignore errors
            });
            return () => {
                try {
                    scanner.clear();
                } catch (e) { }
            };
        }
    }, [showScanner, activeTab, twoFactorEnabled]);

    useEffect(() => {
        if (activeTab === 'security' && twoFactorEnabled && !qrCode) {
            fetchActiveQR();
        }
    }, [activeTab]);

    const fetchActiveQR = async () => {
        try {
            const response = await api.get('/settings/2fa/qr');
            setQrCode(response.data.qrcode);
        } catch (error) {
            console.error('Failed to fetch active QR');
        }
    };

    const fetchAuditLogs = async () => {
        setLoadingAudit(true);
        try {
            const response = await api.get('/settings/audit-logs');
            setAuditLogs(response.data);
        } catch (error) {
            toast.error('Failed to fetch audit logs');
        }
        setLoadingAudit(false);
    };

    const fetchOrgSettings = async () => {
        try {
            const response = await api.get('/settings/organization');
            setOrgSettings({
                requireReceipts: response.data.requireReceipts,
                autoApproveLimit: response.data.autoApproveLimit,
                autoApproveBudgetLimit: response.data.autoApproveBudgetLimit,
                expenseModuleEnabled: response.data.expenseModuleEnabled,
                budgetModuleEnabled: response.data.budgetModuleEnabled,
                allowMultiCurrency: response.data.allowMultiCurrency
            });
        } catch (error) {
            console.error('Failed to fetch org settings');
            toast.error('Failed to load organization settings');
        }
    };

    const handleBasicSettingsSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateProfile({
                name,
                email,
                password,
                preferredCurrency: currency,
                theme
            });
            toast.success('Profile updated successfully!');
            setPassword('');
        } catch (error) {
            toast.error('Error updating profile');
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile', file);

        setUploading(true);
        try {
            await updateProfileImage(formData);
            toast.success('Profile picture updated!');
        } catch (error) {
            toast.error('Failed to upload image');
        }
        setUploading(false);
    };

    const handleNotificationUpdate = async () => {
        try {
            await api.put('/settings/notifications', notificationPrefs);
            toast.success('Notification preferences saved!');
        } catch (error) {
            toast.error('Failed to save notification preferences');
        }
    };

    const handleAdvancedPreferencesUpdate = async () => {
        try {
            await api.put('/settings/preferences', {
                fiscalYearStart,
                defaultCategory,
                defaultBudgetCategory,
                defaultCurrency
            });
            toast.success('Advanced preferences saved!');
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    const handleOrgSettingsUpdate = async () => {
        try {
            await api.put('/settings/organization', orgSettings);
            toast.success('Organization policies updated!');
        } catch (error) {
            toast.error('Failed to update organization settings');
        }
    };

    const handleEnable2FA = async () => {
        try {
            const response = await api.post('/settings/2fa/enable');
            setQrCode(response.data.qrcode);
            toast.success('Scan the QR code or Download your Identity Card');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to enable 2FA');
        }
    };

    const handleVerify2FA = async () => {
        try {
            await api.post('/settings/2fa/verify', { token: twoFAToken });
            setTwoFactorEnabled(true);
            setQrCode(null);
            setTwoFAToken('');
            setShowScanner(false);
            toast.success('2FA enabled successfully!');
        } catch (error) {
            toast.error('Invalid verification code');
        }
    };

    const handleDisable2FA = async () => {
        try {
            await api.post('/settings/2fa/disable', { password: passwordFor2FA, token: twoFAToken });
            setTwoFactorEnabled(false);
            setPasswordFor2FA('');
            setTwoFAToken('');
            toast.success('2FA disabled');
        } catch (error) {
            toast.error('Failed to disable 2FA');
        }
    };

    const handleExportData = async () => {
        try {
            const response = await api.get('/reports/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'finsight_data_export.csv');
            document.body.appendChild(link);
            link.click();
            toast.success('Data exported successfully!');
        } catch (error) {
            toast.error('Failed to export data');
        }
    };

    const handleClearAllData = async () => {
        if (!window.confirm('This will permanently delete ALL your expenses and budgets. Are you sure?')) return;

        try {
            await api.delete('/settings/clear-data');
            toast.success('All data cleared successfully');
        } catch (error) {
            toast.error('Failed to clear data');
        }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '24px' }}>Account Settings</h2>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid var(--gray-light)', overflowX: 'auto' }}>
                {['profile', 'security', 'notifications', 'advanced', 'data', ...(user?.role === 'admin' ? ['organization', 'audit'] : [])].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === tab ? 'var(--primary)' : 'none',
                            color: activeTab === tab ? 'white' : 'var(--dark-soft)',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'audit' ? '📋 Audit Logs' : tab === 'organization' ? '🏢 Organization' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>👤 Profile Information</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', padding: '20px', background: 'var(--gray-light)', borderRadius: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'var(--grad-primary)',
                                backgroundImage: user?.profilePicture ? `url(http://localhost:5000/${user.profilePicture.replace(/\\/g, '/')})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '32px',
                                fontWeight: 'bold',
                                border: '4px solid white',
                                boxShadow: 'var(--shadow)'
                            }}>
                                {!user?.profilePicture && (user?.name?.charAt(0) || 'U')}
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                disabled={uploading}
                            >
                                {uploading ? '⏳' : '📷'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </div>
                        <div>
                            <h4 style={{ margin: 0 }}>{user?.name}</h4>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--gray)', fontSize: '0.9rem' }}>{user?.email}</p>
                            <span style={{
                                display: 'inline-block',
                                marginTop: '8px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                background: user?.role === 'admin' ? '#e0e7ff' : '#f1f5f9',
                                color: user?.role === 'admin' ? '#4338ca' : '#475569'
                            }}>
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleBasicSettingsSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password (leave blank to keep current)</label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="form-group">
                            <label>Preferred Currency</label>
                            <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="ETB">ETB - Ethiopian Birr</option>
                                <option value="KES">KES - Kenyan Shilling</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="checkbox"
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                                id="darkModeToggle"
                            />
                            <label htmlFor="darkModeToggle" style={{ margin: 0 }}>🌙 Dark Mode</label>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            💾 Save Profile Settings
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>🔐 QR Intelligence Security</h3>

                    {!twoFactorEnabled && !qrCode && (
                        <div>
                            <p style={{ color: 'var(--gray)', marginBottom: '16px' }}>
                                Replace manual codes with <b>Identity QR Scanning</b>. Secure your account with a visual key.
                            </p>
                            <button onClick={handleEnable2FA} className="btn btn-primary">
                                🛡️ Enable QR Security
                            </button>
                        </div>
                    )}

                    {qrCode && !twoFactorEnabled && (
                        <div className="fade-in">
                            <p style={{ marginBottom: '16px', fontWeight: '600' }}>
                                Phase 1: Save your "Identity QR Card":
                            </p>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                                    <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px' }} />
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = qrCode;
                                            link.download = `Finsight_Identity_QR_${user.name.replace(/\s/g, '_')}.png`;
                                            link.click();
                                        }}
                                        className="btn btn-sm"
                                        style={{ width: '100%', marginTop: '8px', fontSize: '12px', background: 'var(--gray-light)' }}
                                    >
                                        💾 Download QR Card
                                    </button>
                                </div>

                                <div style={{ flex: 1, minWidth: '300px' }}>
                                    <h4 style={{ marginBottom: '12px' }}>Phase 2: Verify & Activate</h4>
                                    <p style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '16px' }}>
                                        Scan the QR code above using the built-in web scanner to verify your setup.
                                    </p>

                                    <div style={{ marginBottom: '16px' }}>
                                        <button
                                            onClick={() => setShowScanner(!showScanner)}
                                            className="btn btn-sm"
                                            style={{ background: showScanner ? 'var(--danger)' : 'var(--primary)', color: 'white', width: '100%' }}
                                        >
                                            {showScanner ? '❌ Close Web Scanner' : '📷 Open Web Scanner to Verify'}
                                        </button>
                                    </div>

                                    {showScanner ? (
                                        <div id="reader" style={{ width: '100%', border: 'none', borderRadius: '12px', overflow: 'hidden' }}></div>
                                    ) : (
                                        <div className="form-group">
                                            <label>Manual Entry (6-Digit Code)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={twoFAToken}
                                                onChange={(e) => setTwoFAToken(e.target.value)}
                                                placeholder="123456"
                                                maxLength={6}
                                            />
                                        </div>
                                    )}

                                    {!showScanner && (
                                        <button onClick={handleVerify2FA} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                                            ✅ Complete Activation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {twoFactorEnabled && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '16px', background: 'var(--success-soft)', borderRadius: '12px', border: '1px solid var(--success)' }}>
                                <span style={{ fontSize: '24px' }}>🛡️</span>
                                <div>
                                    <h4 style={{ color: 'var(--success-dark)', margin: 0 }}>QR Security is Active</h4>
                                    <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Your account is protected with Identity QR Authentication.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '40px', marginBottom: '40px' }}>
                                <div id="identity-card-container">
                                    <IdentityCard user={user} qrCode={qrCode} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3>🖨️ Employee Identity Card</h3>
                                    <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
                                        Print your official employee registration card. This card contains your unique visual identity key required for secure login.
                                    </p>
                                    <button onClick={handlePrintCard} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 24px' }}>
                                        🖨️ Print Identity Card
                                    </button>
                                </div>
                            </div>

                            <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--gray-light)' }} />

                            <h4 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Danger Zone</h4>
                            <div className="form-group">
                                <label>Your Admin Password (to disable)</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordFor2FA}
                                    onChange={(e) => setPasswordFor2FA(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Current Verification Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={twoFAToken}
                                    onChange={(e) => setTwoFAToken(e.target.value)}
                                    placeholder="123456"
                                    maxLength={6}
                                />
                            </div>

                            <button onClick={handleDisable2FA} className="btn" style={{ background: 'var(--danger)', color: 'white', width: '100%' }}>
                                ⚠️ Disable QR Security
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>🔔 Notification Preferences</h3>
                    <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
                        Choose which emails you want to receive
                    </p>

                    {Object.entries({
                        budgetAlerts: '💰 Budget Alerts (80% and 100% warnings)',
                        expenseApproved: '✅ Expense Approved Notifications',
                        expenseRejected: '❌ Expense Rejected Notifications',
                        weeklyReport: '📅 Weekly Spending Summary',
                        monthlyReport: '📊 Monthly Financial Report'
                    }).map(([key, label]) => (
                        <div key={key} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="checkbox"
                                checked={notificationPrefs[key]}
                                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [key]: e.target.checked })}
                                id={key}
                            />
                            <label htmlFor={key} style={{ margin: 0 }}>{label}</label>
                        </div>
                    ))}

                    <button onClick={handleNotificationUpdate} className="btn btn-primary" style={{ marginTop: '16px' }}>
                        💾 Save Preferences
                    </button>
                </div>
            )}

            {activeTab === 'advanced' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>⚙️ User Preferences</h3>

                    <div className="form-group">
                        <label>Fiscal Year Start Month</label>
                        <select className="form-control" value={fiscalYearStart} onChange={(e) => setFiscalYearStart(parseInt(e.target.value))}>
                            {monthNames.map((month, index) => (
                                <option key={index + 1} value={index + 1}>{month}</option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--gray)', display: 'block', marginTop: '8px' }}>
                            Your annual reports will run from {monthNames[fiscalYearStart - 1]} to {monthNames[(fiscalYearStart + 10) % 12]}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Default Expense Category</label>
                        <select className="form-control" value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)}>
                            <option value="">-- No Default --</option>
                            <option value="Expense">📑 General Expense</option>
                            <option value="Food">🍎 Food & Dining</option>
                            <option value="Transport">🚗 Transport</option>
                            <option value="Housing">🏠 Housing</option>
                            <option value="Utilities">💧 Water & Electricity</option>
                            <option value="Clothing">👕 Clothing</option>
                            <option value="Shopping">🛍️ Shopping</option>
                            <option value="Entertainment">🎬 Entertainment</option>
                            <option value="Health">🏥 Health</option>
                            <option value="Education">📚 Education</option>
                            <option value="Travel">✈️ Travel</option>
                            <option value="Other">✨ Other</option>
                        </select>
                        <small style={{ color: 'var(--gray)', display: 'block', marginTop: '8px' }}>
                            This will auto-select when adding new expenses
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Default Budget Category</label>
                        <select className="form-control" value={defaultBudgetCategory} onChange={(e) => setDefaultBudgetCategory(e.target.value)}>
                            <option value="">-- No Default --</option>
                            <option value="Expense">📑 General Expense</option>
                            <option value="Food">🍎 Food & Dining</option>
                            <option value="Transport">🚗 Transport</option>
                            <option value="Housing">🏠 Housing</option>
                            <option value="Utilities">💧 Water & Electricity</option>
                            <option value="Clothing">👕 Clothing</option>
                            <option value="Shopping">🛍️ Shopping</option>
                            <option value="Entertainment">🎬 Entertainment</option>
                            <option value="Health">🏥 Health</option>
                            <option value="Education">📚 Education</option>
                            <option value="Travel">✈️ Travel</option>
                            <option value="Other">✨ Other</option>
                        </select>
                        <small style={{ color: 'var(--gray)', display: 'block', marginTop: '8px' }}>
                            This will auto-select when setting new budgets
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Default Currency for New Expenses</label>
                        <select className="form-control" value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="ETB">ETB</option>
                            <option value="KES">KES</option>
                        </select>
                    </div>

                    <button onClick={handleAdvancedPreferencesUpdate} className="btn btn-primary">
                        💾 Save Advanced Settings
                    </button>
                </div>
            )}

            {activeTab === 'organization' && user?.role === 'admin' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>🏢 Organization Policies</h3>
                    <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>
                        Configure company-wide rules and modules
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        {/* Expense Module */}
                        <div style={{ padding: '20px', background: 'var(--gray-light)', borderRadius: '12px', border: orgSettings.expenseModuleEnabled ? '2px solid var(--primary-soft)' : '2px solid transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0 }}>📊 Expense Module</h4>
                                <input
                                    type="checkbox"
                                    checked={orgSettings.expenseModuleEnabled}
                                    onChange={(e) => setOrgSettings({ ...orgSettings, expenseModuleEnabled: e.target.checked })}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </div>

                            <div style={{ opacity: orgSettings.expenseModuleEnabled ? 1 : 0.5, pointerEvents: orgSettings.expenseModuleEnabled ? 'all' : 'none' }}>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={orgSettings.requireReceipts}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, requireReceipts: e.target.checked })}
                                        id="requireReceipts"
                                    />
                                    <label htmlFor="requireReceipts" style={{ margin: 0 }}>📸 Require Receipts</label>
                                </div>

                                <div className="form-group">
                                    <label>Auto-Approve Expenses Below ($)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={orgSettings.autoApproveLimit}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, autoApproveLimit: e.target.value })}
                                        placeholder="0 = No auto-approval"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Budget Module */}
                        <div style={{ padding: '20px', background: 'var(--gray-light)', borderRadius: '12px', border: orgSettings.budgetModuleEnabled ? '2px solid var(--primary-soft)' : '2px solid transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0 }}>💰 Budget Module</h4>
                                <input
                                    type="checkbox"
                                    checked={orgSettings.budgetModuleEnabled}
                                    onChange={(e) => setOrgSettings({ ...orgSettings, budgetModuleEnabled: e.target.checked })}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </div>

                            <div style={{ opacity: orgSettings.budgetModuleEnabled ? 1 : 0.5, pointerEvents: orgSettings.budgetModuleEnabled ? 'all' : 'none' }}>
                                <div className="form-group">
                                    <label>Auto-Approve Budgets Below ($)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={orgSettings.autoApproveBudgetLimit}
                                        onChange={(e) => setOrgSettings({ ...orgSettings, autoApproveBudgetLimit: e.target.value })}
                                        placeholder="0 = No auto-approval"
                                    />
                                    <small style={{ color: 'var(--gray)', display: 'block', marginTop: '8px' }}>
                                        Budgets under this amount will be approved automatically.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--gray-light)', borderRadius: '8px' }}>
                        <input
                            type="checkbox"
                            checked={orgSettings.allowMultiCurrency}
                            onChange={(e) => setOrgSettings({ ...orgSettings, allowMultiCurrency: e.target.checked })}
                            id="allowMultiCurrency"
                        />
                        <label htmlFor="allowMultiCurrency" style={{ margin: 0 }}>🌍 Global Setting: Allow employees to use multiple currencies</label>
                    </div>

                    <button onClick={handleOrgSettingsUpdate} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                        Apply Organization Module Settings
                    </button>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>📦 Data Management</h3>

                    <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--gray-light)', borderRadius: '8px' }}>
                        <h4 style={{ marginBottom: '12px' }}>Export Your Data</h4>
                        <p style={{ color: 'var(--gray)', marginBottom: '12px' }}>
                            Download all your expenses, budgets, and settings as a CSV file
                        </p>
                        <button onClick={handleExportData} className="btn" style={{ background: 'var(--success)', color: 'white' }}>
                            📥 Export Data (CSV)
                        </button>
                    </div>

                    <div style={{ padding: '16px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #f97316', marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '12px', color: '#c2410c' }}>🧹 Reset Account Data</h4>
                        <p style={{ color: '#9a3412', marginBottom: '12px' }}>
                            Wipe all your expense entries and budgets while keeping your account settings and profile.
                        </p>
                        <button onClick={handleClearAllData} className="btn" style={{ background: '#f97316', color: 'white' }}>
                            Clear All Expense Data
                        </button>
                    </div>

                    <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                        <h4 style={{ marginBottom: '12px', color: 'var(--danger)' }}>⚠️ Danger Zone</h4>
                        <p style={{ color: '#7f1d1d', marginBottom: '12px' }}>
                            These actions are permanent and cannot be undone
                        </p>
                        <button
                            onClick={() => {
                                if (window.confirm('This will delete ALL your data and YOUR ACCOUNT permanently. Are you absolutely sure?')) {
                                    toast.info('Account deletion is not yet implemented for this demo');
                                }
                            }}
                            className="btn"
                            style={{ background: 'var(--danger)', color: 'white' }}
                        >
                            🗑️ Delete Account Permanently
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && user?.role === 'admin' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>📋 Organization Audit Logs</h3>
                        <button onClick={fetchAuditLogs} className="btn" style={{ fontSize: '13px', padding: '6px 12px' }}>
                            🔄 Refresh
                        </button>
                    </div>
                    <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
                        Last 100 security and administrative actions in your organization.
                    </p>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Target</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingAudit ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading logs...</td></tr>
                                ) : auditLogs.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No audit logs found.</td></tr>
                                ) : auditLogs.map((log, index) => (
                                    <tr key={log.id || index}>
                                        <td style={{ fontSize: '13px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{log.User?.name || 'Unknown User'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{log.User?.email}</div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                background: log.action.includes('DELETE') || log.action.includes('REJECT') ? '#fee2e2' : '#e0e7ff',
                                                color: log.action.includes('DELETE') || log.action.includes('REJECT') ? '#991b1b' : '#3730a3',
                                                textTransform: 'uppercase'
                                            }}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {log.targetType}: <span style={{ fontFamily: 'monospace' }}>{log.targetId ? log.targetId.substring(0, 8) : 'N/A'}</span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'monospace' }}>
                                            {log.ipAddress || 'Internal'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
