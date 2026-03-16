import React from 'react';

const BudgetCard = ({ category, amount, spent }) => {
    const percentage = Math.min((spent / amount) * 100, 100);
    const color = percentage > 90 ? '#ef4444' : '#10b981';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3>{category}</h3>
                <span>${spent} / ${amount}</span>
            </div>
            <div style={{ width: '100%', background: '#e5e7eb', height: '10px', borderRadius: '5px' }}>
                <div style={{ width: `${percentage}%`, background: color, height: '100%', borderRadius: '5px' }}></div>
            </div>
        </div>
    );
};

export default BudgetCard;
