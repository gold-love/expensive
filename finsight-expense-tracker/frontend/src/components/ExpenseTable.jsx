import React from 'react';

const ExpenseTable = ({ expenses, onDelete, onEdit }) => {
    return (
        <div style={{ marginTop: '20px' }}>
            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--light)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Title</th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Category</th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <tr key={expense.id} style={{ borderBottom: '1px solid var(--gray-light)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px', color: 'var(--dark-soft)' }}>
                                    {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '16px', color: 'var(--dark)', fontWeight: '500' }}>{expense.title}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        opacity: 0.85
                                    }}>
                                        {expense.category}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', fontWeight: '800', color: 'var(--dark)' }}>
                                    ${parseFloat(expense.amount).toFixed(2)}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`status-badge status-${expense.status}`}>
                                        {expense.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <button onClick={() => onEdit(expense)} className="btn-icon" style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}>
                                        Edit
                                    </button>
                                    <button onClick={() => onDelete(expense.id)} className="btn-icon" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {expenses.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)', fontSize: '0.9rem' }}>No matching expenses found.</p>
            )}
        </div>
    );
};

export default ExpenseTable;
