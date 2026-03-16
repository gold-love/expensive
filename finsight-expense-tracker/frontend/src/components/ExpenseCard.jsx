import React from 'react';

const ExpenseCard = ({ title, amount, icon, color, isCurrency = true }) => {
    return (
        <div className="card slide-up" style={{
            borderLeft: `4px solid ${color}`,
            background: `linear-gradient(to right, ${color}05, transparent)`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{
                        fontSize: '0.75rem',
                        color: 'var(--gray)',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px'
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: 'var(--dark)',
                        letterSpacing: '-0.02em',
                        margin: 0
                    }}>
                        {isCurrency && <span style={{ fontSize: '1rem', color: 'var(--gray)', marginRight: '2px' }}>$</span>}
                        {amount}
                    </p>
                </div>
                <div style={{
                    background: color,
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: `0 8px 16px -4px ${color}40`,
                    transition: 'transform 0.3s ease'
                }} className="card-icon">
                    {icon}
                </div>
            </div>
            <div style={{
                marginTop: '16px',
                height: '4px',
                background: 'var(--gray-light)',
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: '65%', // Mock progress
                    background: color,
                    borderRadius: '2px',
                    opacity: 0.6
                }}></div>
            </div>
        </div>
    );
};


export default ExpenseCard;
