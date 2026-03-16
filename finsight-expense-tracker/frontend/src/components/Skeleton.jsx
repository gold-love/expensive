import React from 'react';

const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--gray-light) 25%, #e2e8f0 50%, var(--gray-light) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
};

export const SkeletonCard = ({ width = '100%', height = '120px' }) => (
    <div className="card" style={{ padding: '20px', width }}>
        <div style={{ ...shimmerStyle, height: '14px', width: '40%', marginBottom: '12px' }}></div>
        <div style={{ ...shimmerStyle, height: '28px', width: '60%', marginBottom: '8px' }}></div>
        <div style={{ ...shimmerStyle, height: '10px', width: '30%' }}></div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', background: 'var(--light)' }}>
            <div style={{ ...shimmerStyle, height: '14px', width: '100%' }}></div>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid var(--gray-light)' }}>
                <div style={{ ...shimmerStyle, height: '14px', width: '15%' }}></div>
                <div style={{ ...shimmerStyle, height: '14px', width: '25%' }}></div>
                <div style={{ ...shimmerStyle, height: '14px', width: '15%' }}></div>
                <div style={{ ...shimmerStyle, height: '14px', width: '12%' }}></div>
                <div style={{ ...shimmerStyle, height: '14px', width: '10%' }}></div>
                <div style={{ ...shimmerStyle, height: '14px', width: '15%', marginLeft: 'auto' }}></div>
            </div>
        ))}
    </div>
);

export const SkeletonChart = () => (
    <div className="card" style={{ padding: '20px' }}>
        <div style={{ ...shimmerStyle, height: '16px', width: '40%', marginBottom: '20px' }}></div>
        <div style={{ ...shimmerStyle, height: '300px', width: '100%' }}></div>
    </div>
);

export const SkeletonDashboard = () => (
    <div className="fade-in">
        <div style={{ ...shimmerStyle, height: '28px', width: '200px', marginBottom: '24px' }}></div>
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <SkeletonChart />
            <SkeletonChart />
        </div>
    </div>
);

// Inject shimmer keyframes into the document
const styleId = 'skeleton-shimmer-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;
    document.head.appendChild(style);
}
