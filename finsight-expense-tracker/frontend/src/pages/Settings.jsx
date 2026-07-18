import React, { useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api, { getApiUrl } from '../services/api';
import { getTranslation } from '../utils/i18n';
import { CURRENCIES } from '../utils/currency';

const Settings = () => {
    const { user, updateProfile, updateProfileImage, setUser } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const toast = useToast();
    const location = useLocation();

    // Tabs
    const [activeTab, setActiveTab] = useState('profile');

    // Profile Settings
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
    const [timezoneTime, setTimezoneTime] = useState('');
    const [employeeId, setEmployeeId] = useState(user?.employeeId || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    // Security & 2FA
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false);
    const [sessions, setSessions] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Notification Preferences
    const [notifPrefs, setNotifPrefs] = useState({
        budgetAlerts: user?.notificationPreferences?.budgetAlerts ?? true,
        expenseApproved: user?.notificationPreferences?.expenseApproved ?? true,
        expenseRejected: user?.notificationPreferences?.expenseRejected ?? true,
        weeklyReport: user?.notificationPreferences?.weeklyReport ?? false,
        monthlyReport: user?.notificationPreferences?.monthlyReport ?? true
    });
    const [budgetThreshold, setBudgetThreshold] = useState(user?.budgetThreshold ?? 80);

    // Advanced Preferences
    const [fiscalYearStart, setFiscalYearStart] = useState(user?.fiscalYearStart || 1);
    const [defaultCurrency, setDefaultCurrency] = useState(user?.preferredCurrency || 'USD');
    const [language, setLanguage] = useState(user?.language || 'en');
    const [defaultCategory, setDefaultCategory] = useState(user?.defaultCategory || '');
    const [defaultBudgetCategory, setDefaultBudgetCategory] = useState(user?.defaultBudgetCategory || '');



    // Organization & Branding (Admin only)
    const [orgSettings, setOrgSettings] = useState({
        autoApproveLimit: 0,
        requireReceipts: false,
    });
    const [branding, setBranding] = useState({
        primaryColor: '#6366f1',
        logoUrl: ''
    });

    // API Keys
    const [apiKeys, setApiKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState(null);

    // Audit Logs
    const [auditLogs, setAuditLogs] = useState([]);

    // 2FA Flow state
    const [show2FAInput, setShow2FAInput] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [twoFactorTypeSetting, setTwoFactorTypeSetting] = useState('email');

    useEffect(() => {
        if (location.state?.tab) setActiveTab(location.state.tab);
    }, [location.state]);

    // IANA timezone map for abbreviations
    const IANA_MAP = {
        'UTC':    'UTC',
        'CET':    'Europe/Paris',
        'EET':    'Europe/Helsinki',
        'AST':    'Asia/Riyadh',
        'EAT':    'Africa/Nairobi',
        'GST':    'Asia/Dubai',
        'IST':    'Asia/Kolkata',
        'CST':    'Asia/Shanghai',
        'JST':    'Asia/Tokyo',
        'AEST':   'Australia/Sydney',
        'AST_NA': 'America/Halifax',
        'EST':    'America/New_York',
        'CST_NA': 'America/Chicago',
        'MST':    'America/Denver',
        'PST':    'America/Los_Angeles',
        'AKST':   'America/Anchorage',
        'HST':    'Pacific/Honolulu',
    };

    // Live clock — ticks every second in the selected timezone
    useEffect(() => {
        const tick = () => {
            const iana = IANA_MAP[timezone] || 'UTC';
            const now = new Date();
            const formatted = now.toLocaleString('en-US', {
                timeZone: iana,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            setTimezoneTime(formatted);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [timezone]);

    useEffect(() => {
        if (activeTab === 'security') {
            fetchSessions();
            fetchSecurityLogs();
        }
        if (activeTab === 'api') fetchApiKeys();
        if (activeTab === 'organization' && user?.role === 'admin') fetchOrgSettings();
        if (activeTab === 'audit' && user?.role === 'admin') fetchAuditLogs();
    }, [activeTab]);

    useEffect(() => {
        if (branding?.primaryColor) {
            document.documentElement.style.setProperty('--primary', branding.primaryColor);
        }
    }, [branding?.primaryColor]);

    // Data Fetching
    const fetchSessions = async () => {
        try {
            const { data } = await api.get('/settings/sessions');
            setSessions(data);
            // Current session is usually the first one or we can identify it by a property if we added it
            if (data.length > 0) setCurrentSessionId(data[0].id); 
        } catch { toast.error('Failed to load sessions'); }
    };

    const fetchSecurityLogs = async () => {
        try {
            const { data } = await api.get('/settings/security-logs');
            setSecurityLogs(data);
        } catch { toast.error('Failed to load security logs'); }
    };

    const fetchApiKeys = async () => {
        try {
            const { data } = await api.get('/settings/api-keys');
            setApiKeys(data);
        } catch { toast.error('Failed to load API keys'); }
    };

    const fetchOrgSettings = async () => {
        try {
            const { data } = await api.get('/settings/organization');
            setOrgSettings(data);
            if (data.branding) setBranding(data.branding);
        } catch { toast.error('Failed to load organization settings'); }
    };

    const fetchAuditLogs = async () => {
        try {
            const { data } = await api.get('/settings/audit-logs');
            setAuditLogs(data);
        } catch { toast.error('Failed to load audit logs'); }
    };

    // Handlers
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (password) {
            const validatePassword = (pwd) => {
                if (pwd.length < 8) return "Password must be at least 8 characters long.";
                if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
                if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
                if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character.";
                return null;
            };
            const pwdError = validatePassword(password);
            if (pwdError) {
                return toast.error(pwdError);
            }
        }
        try {
            await updateProfile({ 
                name, email, jobTitle, department, 
                phoneNumber, timezone, employeeId, bio,
                password, currentPassword, language 
            });
            setPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const handleNotifUpdate = async () => {
        try {
            await api.put('/settings/notifications', { ...notifPrefs, budgetThreshold });
            toast.success('Notifications updated!');
        } catch { toast.error('Update failed'); }
    };

    const handleAdvancedUpdate = async () => {
        try {
            await api.put('/settings/preferences', {
                fiscalYearStart,
                preferredCurrency: defaultCurrency, // Fix: matches backend field name
                language,
                defaultCategory: defaultCategory || null,
                defaultBudgetCategory: defaultBudgetCategory || null,
            });
            const updatedUser = {
                ...user,
                fiscalYearStart,
                preferredCurrency: defaultCurrency,
                language,
                defaultCategory,
                defaultBudgetCategory,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Preferences updated!');
        } catch { toast.error('Update failed'); }
    };

    const handleCreateKey = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/settings/api-keys', { name: newKeyName });
            setGeneratedKey(data.key);
            setNewKeyName('');
            fetchApiKeys();
            toast.success('Key generated!');
        } catch { toast.error('Failed to generate key'); }
    };

    const handleRevokeKey = async (id) => {
        if (!window.confirm('Revoke this key?')) return;
        try {
            await api.delete(`/settings/api-keys/${id}`);
            fetchApiKeys();
            toast.success('Key revoked');
        } catch { toast.error('Failed'); }
    };

    const handleRevokeSpecificSession = async (id) => {
        if (!window.confirm('Revoke this session? This device will be logged out.')) return;
        try {
            await api.delete(`/settings/sessions/${id}`);
            fetchSessions();
            fetchSecurityLogs();
            toast.success('Session revoked');
        } catch { toast.error('Failed to revoke session'); }
    };

    const handleRevokeAllOtherSessions = async () => {
        if (!window.confirm('Revoke ALL other sessions? Every other device will be logged out.')) return;
        try {
            await api.post('/settings/revoke-sessions', { currentSessionId });
            fetchSessions();
            fetchSecurityLogs();
            toast.success('All other sessions revoked');
        } catch { toast.error('Failed to revoke sessions'); }
    };

    const handleEnable2FA = async (type = 'email') => {
        try {
            const { data } = await api.post('/settings/2fa/enable', { type });
            setShow2FAInput(true);
            setTwoFactorTypeSetting(type);
            if (data.qrcode) setQrCode(data.qrcode);
            toast.info(type === 'email' ? 'Verification code sent to your email' : 'Scan the QR code with your authenticator app');
        } catch { toast.error('Failed to start 2FA process'); }
    };

    const handleVerify2FA = async () => {
        try {
            const { data } = await api.post('/settings/2fa/verify', { token: twoFactorToken });
            setTwoFactorEnabled(true);
            setShow2FAInput(false);
            setTwoFactorToken('');
            setQrCode(null);
            if (data.recoveryCodes) setRecoveryCodes(data.recoveryCodes);
            toast.success('2FA enabled successfully!');
        } catch (error) { 
            toast.error(error.response?.data?.message || 'Invalid verification code'); 
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Disable 2FA? Your account will be less secure.')) return;
        try {
            await api.post('/settings/2fa/disable');
            setTwoFactorEnabled(false);
            toast.success('2FA disabled');
        } catch { toast.error('Failed to disable 2FA'); }
    };

    const handleConnect = (name, url) => {
        toast.info(`Redirecting to ${name}...`);
        setTimeout(() => { window.open(url, '_blank'); }, 1000);
    };

    const handleExportData = async () => {
        try {
            const { data } = await api.get('/settings/export-data');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finsight_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success('Backup generated successfully!');
        } catch { toast.error('Failed to export data'); }
    };

    const handleRestoreData = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                const records = jsonData.records || jsonData.expenses || [];
                await api.post('/settings/organization/restore', { records });
                toast.success('Data restore completed successfully!');
            } catch { toast.error('Invalid backup file or restore failed.'); }
            finally { e.target.value = ''; }
        };
        reader.readAsText(file);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        try {
            toast.info('Uploading logo...');
            const { data } = await api.post('/settings/organization/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBranding({ ...branding, logoUrl: data.logoUrl });
            toast.success('Logo uploaded! Save to apply changes.');
        } catch { toast.error('Upload failed'); }
    };

    const handleOrgUpdate = async () => {
        try {
            await api.put('/settings/organization', { ...orgSettings, branding });
            toast.success('Organization updated!');
        } catch { toast.error('Update failed'); }
    };

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '24px' }}>{getTranslation(user?.language, 'settings_enterprise_suite')}</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--gray-light)', overflowX: 'auto', paddingBottom: '10px' }}>
                {[
                    { id: 'profile', label: getTranslation(user?.language, 'profile'), icon: '👤' },
                    { id: 'security', label: getTranslation(user?.language, 'security'), icon: '🛡️' },
                    { id: 'notifications', label: getTranslation(user?.language, 'alerts'), icon: '🔔' },
                    { id: 'advanced', label: getTranslation(user?.language, 'general'), icon: '⚙️' },
                    { id: 'api', label: getTranslation(user?.language, 'api_keys'), icon: '🔑' },
                    { id: 'integrations', label: getTranslation(user?.language, 'integrations'), icon: '🔌' },
                    { id: 'data', label: getTranslation(user?.language, 'backup'), icon: '💾' },
                    ...(user?.role === 'admin' ? [
                        { id: 'organization', label: getTranslation(user?.language, 'organization'), icon: '🏢' },
                        { id: 'audit', label: getTranslation(user?.language, 'audit_logs'), icon: '📋' }
                    ] : [])
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
                        style={{ 
                            background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.8)', 
                            color: activeTab === tab.id ? 'white' : 'var(--dark-soft)', 
                            border: '1px solid var(--gray-light)', 
                            padding: '12px 24px', 
                            borderRadius: '14px', 
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            whiteSpace: 'nowrap',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card slide-up" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--gray-light)' }}>
                        <div style={{ marginRight: '30px', position: 'relative' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '30px', background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--white)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                                {user?.profilePicture ? (
                                    <img src={getApiUrl(user.profilePicture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '50px', color: 'white' }}>{user?.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--white)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', fontSize: '12px', fontWeight: '800', border: '2px solid var(--primary-light)', whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}>
                                Edit Profile
                            </label>
                            <input 
                                type="file" 
                                id="profile-upload" 
                                style={{ display: 'none' }} 
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('profile', file);
                                        try {
                                            toast.info('Uploading avatar...');
                                            await updateProfileImage(formData);
                                            toast.success('Profile picture updated!');
                                        } catch {
                                            toast.error('Failed to upload picture');
                                        }
                                    }
                                }} 
                            />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>{name || getTranslation(user?.language, 'personal_profile')}</h3>
                            <p style={{ margin: '0', color: 'var(--gray)', fontSize: '14px' }}>Update your personal details and public profile picture.</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'full_name')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'email_address')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'phone_number')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 (555) 000-0000" />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'employee_id')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'job_title')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'department')}</label>
                                <input className="form-control" style={{ borderRadius: '10px' }} value={department} onChange={e => setDepartment(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'timezone')}</label>
                                <select className="form-control" style={{ borderRadius: '10px' }} value={timezone} onChange={e => setTimezone(e.target.value)}>
                                    <option value="UTC">UTC (GMT+0)</option>
                                    <option value="CET">Central European Time (GMT+1)</option>
                                    <option value="EET">Eastern European Time (GMT+2)</option>
                                    <option value="AST">Arabia Standard Time (GMT+3)</option>
                                    <option value="EAT">East Africa Time (GMT+3)</option>
                                    <option value="GST">Gulf Standard Time (GMT+4)</option>
                                    <option value="IST">India Standard Time (GMT+5:30)</option>
                                    <option value="CST">China Standard Time (GMT+8)</option>
                                    <option value="JST">Japan Standard Time (GMT+9)</option>
                                    <option value="AEST">Australian Eastern Time (GMT+10)</option>
                                    <option value="AST_NA">Atlantic Standard Time (GMT-4)</option>
                                    <option value="EST">Eastern Time (GMT-5)</option>
                                    <option value="CST_NA">Central Time (GMT-6)</option>
                                    <option value="MST">Mountain Time (GMT-7)</option>
                                    <option value="PST">Pacific Time (GMT-8)</option>
                                    <option value="AKST">Alaska Time (GMT-9)</option>
                                    <option value="HST">Hawaii-Aleutian Time (GMT-10)</option>
                                </select>
                            </div>

                            {/* Live Timezone Clock Panel */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                                    border: '1px solid var(--primary-light)',
                                    borderRadius: '14px',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '18px',
                                    marginTop: '4px'
                                }}>
                                    <div style={{
                                        width: '52px', height: '52px',
                                        borderRadius: '14px',
                                        background: 'var(--grad-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '26px',
                                        flexShrink: 0,
                                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
                                    }}>🕐</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                            Current Time in Selected Timezone
                                        </p>
                                        <p style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--dark)', letterSpacing: '0.01em', fontVariantNumeric: 'tabular-nums' }}>
                                            {timezoneTime || '—'}
                                        </p>
                                    </div>
                                    <div style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '4px 12px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        flexShrink: 0
                                    }}>
                                        {timezone.replace('_NA','')}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'preferred_language')}</label>
                                <select className="form-control" style={{ borderRadius: '10px' }} value={language} onChange={e => setLanguage(e.target.value)}>
                                    <option value="en">English</option>
                                    <option value="fr">Français</option>
                                    <option value="es">Español</option>
                                    <option value="de">Deutsch</option>
                                    <option value="am">Amharic (አማርኛ)</option>
                                    <option value="zh">Chinese (中文)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '30px' }}>
                            <label style={{ fontWeight: '600', color: 'var(--dark-soft)', marginBottom: '8px', display: 'block' }}>{getTranslation(user?.language, 'professional_bio')}</label>
                            <textarea 
                                className="form-control" 
                                style={{ borderRadius: '10px', height: '100px', resize: 'none' }} 
                                value={bio} 
                                onChange={e => setBio(e.target.value)}
                                placeholder="Describe your role or department responsibilities..."
                            />
                        </div>

                        <div className="card" style={{ padding: '30px', border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.02)', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--gray-light)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                    <span style={{ fontSize: '24px' }}>🔐</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--dark)' }}>{getTranslation(user?.language, 'security_password')}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--gray)' }}>Update your account security credentials</p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--dark-soft)' }}>Current Password</label>
                                    <input 
                                        type="password" 
                                        title="Current Password" 
                                        className="form-control" 
                                        style={{ background: 'var(--white)', borderRadius: '10px', border: '1px solid var(--primary)' }} 
                                        value={currentPassword} 
                                        onChange={e => setCurrentPassword(e.target.value)} 
                                        placeholder="Required for changes" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--dark-soft)' }}>New Password</label>
                                    <input 
                                        type="password" 
                                        title="New Password" 
                                        className="form-control" 
                                        style={{ background: 'var(--white)', borderRadius: '10px' }} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        placeholder="Min. 8 characters" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--dark-soft)' }}>Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        title="Confirm New Password" 
                                        className="form-control" 
                                        style={{ background: 'var(--white)', borderRadius: '10px' }} 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '15px', marginBottom: '30px', border: '1px dashed var(--primary)' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>🌓 {getTranslation(user?.language, 'appearance_mode')}</h4>
                                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--gray)' }}>Toggle between light and dark visual themes.</p>
                            </div>
                            <button type="button" className="btn" onClick={toggleTheme} style={{ background: 'var(--white)', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: '700', padding: '10px 20px', borderRadius: '12px' }}>
                                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '14px 32px', fontWeight: 'bold', borderRadius: '12px', fontSize: '16px' }}>
                                {getTranslation(user?.language, 'update_everything')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>🛡️ Security & Sessions</h3>
                    <div 
                        className="card" 
                        onClick={() => { if (!show2FAInput) { twoFactorEnabled ? handleDisable2FA() : handleEnable2FA() } }}
                        style={{ padding: '25px', border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.02)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: show2FAInput ? 'default' : 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                                <span style={{ fontSize: '20px' }}>🔒</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '17px' }}>Two-Factor Authentication</h4>
                                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--gray)' }}>
                                    Secure your account with a code sent to <b>{user?.email}</b>
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ marginLeft: '20px' }} onClick={e => e.stopPropagation()}>
                            {show2FAInput ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--primary-light)', boxShadow: 'var(--shadow-md)' }}>
                                    {qrCode && (
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>Scan this with Google Authenticator</p>
                                            <img src={qrCode} alt="2FA QR Code" style={{ width: '150px', height: '150px', border: '1px solid var(--gray-light)', padding: '5px', borderRadius: '8px' }} />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Code" 
                                                value={twoFactorToken} 
                                                onChange={e => setTwoFactorToken(e.target.value)}
                                                style={{ padding: '10px', borderRadius: '8px', border: '2px solid var(--primary)', width: '100px', fontWeight: 'bold', textAlign: 'center' }}
                                            />
                                        </div>
                                        <button className="btn btn-primary" onClick={handleVerify2FA}>Verify</button>
                                        <button className="btn" onClick={() => { setShow2FAInput(false); setQrCode(null); }}>Cancel</button>
                                    </div>
                                    <p style={{ fontSize: '10px', color: 'var(--gray)', textAlign: 'center' }}>
                                        {twoFactorTypeSetting === 'email' ? 'Check your email for a 6-digit code.' : 'Enter the code from your app.'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {!twoFactorEnabled && (
                                        <>
                                            <button 
                                                className="btn" 
                                                onClick={() => handleEnable2FA('email')}
                                                style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                                            >
                                                Use Email
                                            </button>
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={() => handleEnable2FA('totp')}
                                                style={{ fontWeight: 'bold' }}
                                            >
                                                Use App (TOTP)
                                            </button>
                                        </>
                                    )}
                                    {twoFactorEnabled && (
                                        <button 
                                            className="btn" 
                                            onClick={handleDisable2FA}
                                            style={{ background: '#ef4444', color: 'white', fontWeight: 'bold' }}
                                        >
                                            Disable 2FA
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recovery Codes Modal-like section */}
                    {recoveryCodes && (
                        <div style={{ background: '#fffbeb', border: '2px dashed #f59e0b', padding: '25px', borderRadius: '15px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <span style={{ fontSize: '24px' }}>⚠️</span>
                                <h4 style={{ margin: 0, color: '#92400e' }}>Save Your Recovery Codes!</h4>
                            </div>
                            <p style={{ fontSize: '13px', color: '#b45309', marginBottom: '20px' }}>
                                If you lose access to your device, these codes are the ONLY way to get back into your account. Keep them safe and private.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                {recoveryCodes.map((code, i) => (
                                    <code key={i} style={{ background: 'white', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                        {code}
                                    </code>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-primary" style={{ background: '#92400e', border: 'none' }} onClick={() => {
                                    const text = recoveryCodes.join('\n');
                                    const blob = new Blob([text], { type: 'text/plain' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'finsight_recovery_codes.txt';
                                    a.click();
                                }}>Download Codes</button>
                                <button className="btn" style={{ background: 'white', color: '#92400e', border: '1px solid #92400e' }} onClick={() => setRecoveryCodes(null)}>I've Saved Them</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0 }}>Active Sessions</h4>
                        <button 
                            className="btn btn-primary" 
                            style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--danger)', border: 'none' }}
                            onClick={handleRevokeAllOtherSessions}
                        >
                            Revoke All Other Sessions
                        </button>
                    </div>
                    <div className="table-responsive" style={{ marginBottom: '40px' }}>
                        <table>
                            <thead><tr><th>Device / Browser</th><th>IP Address</th><th>Last Active</th><th>Action</th></tr></thead>
                            <tbody>
                                {sessions.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            {s.browser} on {s.os}
                                            {s.id === currentSessionId && <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'var(--success)', color: 'white', borderRadius: '4px', fontSize: '10px' }}>Current</span>}
                                        </td>
                                        <td>{s.ipAddress}</td>
                                        <td>{new Date(s.createdAt).toLocaleString()}</td>
                                        <td>
                                            {s.id !== currentSessionId && (
                                                <button 
                                                    onClick={() => handleRevokeSpecificSession(s.id)}
                                                    style={{ color: 'var(--danger)', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h4 style={{ marginBottom: '20px' }}>Recent Security Activity</h4>
                    <div className="table-responsive">
                        <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ background: 'var(--light)', color: 'var(--gray)', fontSize: '12px' }}>
                                    <th style={{ padding: '12px', borderRadius: '8px 0 0 8px' }}>Action</th>
                                    <th style={{ padding: '12px' }}>Details</th>
                                    <th style={{ padding: '12px' }}>IP Address</th>
                                    <th style={{ padding: '12px', borderRadius: '0 8px 8px 0' }}>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {securityLogs.map(l => (
                                    <tr key={l.id} style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--gray-light)' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: '800',
                                                background: l.action.includes('Failed') ? '#fee2e2' : '#f0fdf4',
                                                color: l.action.includes('Failed') ? '#ef4444' : '#22c55e'
                                            }}>
                                                {l.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--gray-light)', fontSize: '13px' }}>
                                            {l.details ? JSON.stringify(l.details) : 'No extra details'}
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--gray-light)', fontSize: '13px' }}>{l.ipAddress}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--gray-light)', fontSize: '12px', color: 'var(--gray)' }}>
                                            {new Date(l.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>🔔 Notification Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[
                            { key: 'budgetAlerts', label: 'Budget Threshold Alerts', desc: 'Notify me when budgets reach a certain percentage.' },
                            { key: 'expenseApproved', label: 'Expense Approved', desc: 'Receive a notification when your expense is approved.' },
                            { key: 'expenseRejected', label: 'Expense Rejected', desc: 'Get notified if an expense needs correction.' },
                            { key: 'weeklyReport', label: 'Weekly Summary', desc: 'Email me a weekly summary of my spending.' }
                        ].map(item => (
                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid var(--gray-light)', borderRadius: '12px' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{item.label}</h4>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--gray)' }}>{item.desc}</p>
                                </div>
                                <input type="checkbox" checked={notifPrefs[item.key]} onChange={e => setNotifPrefs({...notifPrefs, [item.key]: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                            </div>
                        ))}
                        <div style={{ marginTop: '10px' }}>
                            <label>Budget Alert Threshold ({budgetThreshold}%)</label>
                            <input type="range" min="50" max="100" value={budgetThreshold} onChange={e => setBudgetThreshold(e.target.value)} style={{ width: '100%', marginTop: '10px' }} />
                        </div>
                        <button onClick={handleNotifUpdate} className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>Update Notifications</button>
                    </div>
                </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>⚙️ {getTranslation(user?.language, 'advanced_preferences')}</h3>
                    <div className="form-group">
                        <label>Fiscal Year Start Month</label>
                        <select className="form-control" value={fiscalYearStart} onChange={e => setFiscalYearStart(e.target.value)}>
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{getTranslation(user?.language, 'preferred_language')}</label>
                        <select className="form-control" value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="am">Amharic (አማርኛ)</option>
                            <option value="zh">Chinese (中文)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{getTranslation(user?.language, 'primary_currency')}</label>
                        <select className="form-control" value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}>
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Default Expense Category</label>
                        <select className="form-control" value={defaultCategory} onChange={e => setDefaultCategory(e.target.value)}>
                            <option value="">— None —</option>
                            {['Food', 'Transport', 'Office Supplies', 'Travel', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--gray)', fontSize: '12px' }}>Pre-fills the category when adding a new expense.</small>
                    </div>
                    <div className="form-group">
                        <label>Default Budget Category</label>
                        <select className="form-control" value={defaultBudgetCategory} onChange={e => setDefaultBudgetCategory(e.target.value)}>
                            <option value="">— None —</option>
                            {['Food', 'Transport', 'Office Supplies', 'Travel', 'Utilities', 'Entertainment', 'Healthcare', 'Education', 'Other'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--gray)', fontSize: '12px' }}>Pre-fills the category when creating a new budget.</small>
                    </div>
                    <button onClick={handleAdvancedUpdate} className="btn btn-primary" style={{ width: '100%' }}>{getTranslation(user?.language, 'apply_preferences')}</button>
                </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>🔑 API Access</h3>
                    <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input className="form-control" placeholder="Key Name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required />
                        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Generate</button>
                    </form>
                    {generatedKey && (
                        <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '10px', border: '1px solid #fef3c7', marginBottom: '20px' }}>
                            <p style={{ fontWeight: '700', color: '#92400e', margin: '0 0 10px 0' }}>⚠️ Copy your key now:</p>
                            <code style={{ background: 'white', padding: '5px 10px', borderRadius: '5px', display: 'block', wordBreak: 'break-all' }}>{generatedKey}</code>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table>
                            <thead><tr><th>Name</th><th>Created</th><th>Last Used</th><th>Action</th></tr></thead>
                            <tbody>
                                {apiKeys.map(k => (
                                    <tr key={k.id}>
                                        <td>{k.name}</td>
                                        <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                                        <td>{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</td>
                                        <td><button onClick={() => handleRevokeKey(k.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', fontWeight: 'bold' }}>Revoke</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>🔌 Integration Hub</h3>
                    
                    {/* Other Integrations */}
                    <h4 style={{ marginBottom: '15px', marginTop: '30px', color: 'var(--dark-soft)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📱 Third-Party Apps</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {[
                            { name: 'Slack', url: 'https://slack.com', color: '#4A154B', category: 'Communication' },
                            { name: 'QuickBooks', url: 'https://quickbooks.com', color: '#2CA01C', category: 'Accounting' },
                            { name: 'Zapier', url: 'https://zapier.com', color: '#FF4A00', category: 'Automation' },
                            { name: 'Microsoft Teams', url: 'https://teams.com', color: '#6264A7', category: 'Communication' },
                            { name: 'Google Drive', url: 'https://google.com/drive', color: '#4285F4', category: 'Storage' },
                            { name: 'Dropbox', url: 'https://dropbox.com', color: '#0061FF', category: 'Storage' },
                            { name: 'Xero', url: 'https://xero.com', color: '#13B5EA', category: 'Accounting' },
                            { name: 'Notion', url: 'https://notion.so', color: '#000000', category: 'Productivity' }
                        ].map(item => (
                            <div key={item.name} className="integration-card" style={{ padding: '24px', border: '1px solid var(--gray-light)', borderRadius: '20px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'var(--white)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontWeight: '900', fontSize: '20px' }}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h4>
                                        <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '600' }}>{item.category}</span>
                                    </div>
                                </div>
                                <button className="btn" style={{ background: 'var(--light)', border: '1px solid var(--gray-light)', width: '100%', fontWeight: '700', borderRadius: '10px', color: 'var(--dark-soft)' }} onClick={() => handleConnect(item.name, item.url)}>
                                    Configure
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Organization Tab (Admin only) */}
            {activeTab === 'organization' && user?.role === 'admin' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>🏢 Organization Control</h3>
                    <div style={{ padding: '20px', background: 'var(--light)', borderRadius: '15px', marginBottom: '20px' }}>
                        <h4>🎨 Branding</h4>
                        <div className="form-group">
                            <label>Company Logo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                                <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '12px', border: '2px dashed var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {branding.logoUrl ? <img src={branding.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" /> : <span style={{ fontSize: '24px' }}>🏢</span>}
                                </div>
                                <div>
                                    <input type="file" id="logo-upload" style={{ display: 'none' }} onChange={handleLogoUpload} accept="image/*" />
                                    <label htmlFor="logo-upload" className="btn" style={{ background: 'var(--white)', border: '1px solid var(--gray-light)', color: 'var(--dark)', cursor: 'pointer' }}>Change Logo</label>
                                    <p style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '5px' }}>JPG, PNG or SVG. Max 2MB.</p>
                                </div>
                            </div>
                        </div>
                        <div className="form-group"><label>Logo URL (Manual Override)</label><input className="form-control" value={branding.logoUrl} onChange={e => setBranding({...branding, logoUrl: e.target.value})} style={{ color: 'var(--dark-soft)' }} /></div>
                        <div className="form-group"><label>Theme Color</label><input type="color" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} style={{ display: 'block', width: '100%', height: '40px', border: 'none', background: 'none' }} /></div>
                    </div>
                    <div className="form-group"><label>Auto-Approve Limit ($)</label><input type="number" className="form-control" value={orgSettings.autoApproveLimit} onChange={e => setOrgSettings({...orgSettings, autoApproveLimit: e.target.value})} style={{ color: 'var(--dark-soft)' }} /></div>
                    <button onClick={handleOrgUpdate} className="btn btn-primary" style={{ width: '100%' }}>Save Org Policies</button>
                </div>
            )}

            {/* Audit Logs Tab (Admin only) */}
            {activeTab === 'audit' && user?.role === 'admin' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>📜 Audit Trail</h3>
                    <div className="table-responsive">
                        <table>
                            <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
                            <tbody>
                                {auditLogs.map(l => (
                                    <tr key={l.id}>
                                        <td>{new Date(l.createdAt).toLocaleString()}</td>
                                        <td>{l.User?.name || 'System'}</td>
                                        <td><span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{l.action}</span></td>
                                        <td style={{ fontSize: '12px' }}>{JSON.stringify(l.details)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Data Tab */}
            {activeTab === 'data' && (
                <div className="card slide-up">
                    <h3 style={{ marginBottom: '20px' }}>💾 Data & Backup</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ padding: '20px', border: '1px solid var(--gray-light)', borderRadius: '15px' }}>
                            <h4>📥 Export Backup</h4>
                            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '15px' }}>Download a structural snapshot of your financial records.</p>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExportData}>Generate JSON Backup</button>
                        </div>
                        <div style={{ padding: '20px', border: '1px solid var(--success)', borderRadius: '15px' }}>
                            <h4>📤 Data Restore</h4>
                            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '15px' }}>Upload a JSON backup file to restore your records.</p>
                            <input type="file" id="restore-file" style={{ display: 'none' }} onChange={handleRestoreData} />
                            <label htmlFor="restore-file" className="btn" style={{ background: 'var(--success)', color: 'white', width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>Upload & Restore</label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
