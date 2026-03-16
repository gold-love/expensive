import React, { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFAToken, setTwoFAToken] = useState('');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const { login, register, verify2FA } = useContext(AuthContext);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (showScanner && requires2FA) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
            scanner.render((decodedText) => {
                let token = decodedText;
                if (decodedText.includes('otpauth://')) {
                    const url = new URL(decodedText);
                    token = url.searchParams.get('secret') || decodedText;
                }
                setTwoFAToken(token);
                scanner.clear();
                setShowScanner(false);
            }, (error) => { });
            return () => {
                try { scanner.clear(); } catch (e) { }
            };
        }
    }, [showScanner, requires2FA]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            if (requires2FA) {
                await verify2FA(userId, twoFAToken);
                toast.success('Login verified!');
                navigate('/');
            } else if (isLogin) {
                const data = await login(email, password);
                if (data.requires2FA) {
                    setRequires2FA(true);
                    setUserId(data.userId);
                    toast.info('Please verify with your Identity QR');
                } else {
                    toast.success('Welcome back!');
                    navigate('/');
                }
            } else {
                await register(name, email, password);
                toast.success('Account created successfully!');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        }
        setLoading(false);
    };

    // Auto-submit if token is scanned and long enough (for OTP secrets it's different, but for codes it works)
    useEffect(() => {
        if (requires2FA && twoFAToken.length >= 6 && !showScanner) {
            handleSubmit();
        }
    }, [twoFAToken]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--grad-dark)'
        }}>
            <div className="card fade-in" style={{ width: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--primary)' }}>●</span> Finsight
                    </h1>
                    <p style={{ color: 'var(--gray)', marginTop: '8px' }}>Intelligence Security Login</p>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
                    {requires2FA ? 'Identity Verification' : (isLogin ? 'Welcome Back' : 'Create Account')}
                </h2>

                <form onSubmit={handleSubmit}>
                    {requires2FA ? (
                        <div className="form-group fade-in">
                            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', textAlign: 'center' }}>🛡️ Scan to Verify</h3>

                            <div style={{ marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(!showScanner)}
                                    className="btn btn-sm"
                                    style={{ background: showScanner ? 'var(--danger)' : 'var(--primary)', color: 'white', width: '100%', marginBottom: '12px' }}
                                >
                                    {showScanner ? '❌ Close Scanner' : '📷 Open QR Scanner'}
                                </button>

                                {showScanner ? (
                                    <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                                ) : (
                                    <>
                                        <label>Verification Code</label>
                                        <input
                                            type="text"
                                            value={twoFAToken}
                                            onChange={(e) => setTwoFAToken(e.target.value)}
                                            className="form-control"
                                            placeholder="Enter 6-digit code"
                                            required
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </>
                                )}
                            </div>

                            <p style={{ color: 'var(--gray)', fontSize: '12px', textAlign: 'center' }}>
                                Scan your <b>Identity QR Card</b> or enter the code manually to continue.
                            </p>

                            {!showScanner && (
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '16px' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                                </button>
                            )}

                            <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', marginTop: '16px', width: '100%' }}
                                onClick={() => setRequires2FA(false)}
                            >
                                ← Back to Credentials
                            </button>
                        </div>
                    ) : (
                        <>
                            {!isLogin && (
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="form-control"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-control"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-control"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {isLogin && (
                                <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                                    <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '14px' }}>
                                        Forgot Password?
                                    </Link>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '16px' }}
                                disabled={loading}
                            >
                                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </>
                    )}
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--gray)' }}>
                    {requires2FA ? '' : (isLogin ? "Don't have an account? " : "Already have an account? ")}
                    {!requires2FA && (
                        <span
                            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
};

export default Login;
