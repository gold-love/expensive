import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--light)',
            padding: '40px',
            textAlign: 'center'
        }}>
            <div style={{
                fontSize: '120px',
                fontWeight: '900',
                background: 'var(--grad-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                marginBottom: '16px'
            }}>
                404
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', color: 'var(--dark)' }}>
                Page Not Found
            </h2>
            <p style={{ color: 'var(--gray)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
                The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
            <Link to="/" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1rem' }}>
                ← Back to Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
