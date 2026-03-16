import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            toast.success(data.message);
            // In dev mode, show the reset URL
            if (data.resetUrl) {
                setMessage(data.resetUrl);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process request');
        }
        setLoading(false);
    };

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
                    <p style={{ color: 'var(--gray)', marginTop: '8px' }}>Reset Your Password</p>
                </div>

                {message && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#10B981',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        fontSize: '14px',
                        wordBreak: 'break-all'
                    }}>
                        <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>Reset Link Generated (Dev Only):</p>
                        {message.startsWith('http') ? (
                            <a href={message} style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}>
                                Click here to reset password
                            </a>
                        ) : (
                            message
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Link
                        to="/login"
                        style={{
                            color: 'var(--gray)',
                            textDecoration: 'none',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
