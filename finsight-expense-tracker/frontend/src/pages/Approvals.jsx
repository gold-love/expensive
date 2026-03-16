import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const Approvals = () => {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'all' ? '/approvals/all' : '/approvals/pending';
            const { data } = await api.get(endpoint);
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching approvals:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [filter]);

    const handleApprove = async (id) => {
        try {
            await api.put(`/approvals/${id}/approve`);
            fetchExpenses();
        } catch (error) {
            alert('Failed to approve expense');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.put(`/approvals/${id}/reject`);
            fetchExpenses();
        } catch (error) {
            alert('Failed to reject expense');
        }
    };

    const getStatusBadge = (status) => {
        return (
            <span className={`status-badge status-${status}`}>
                {status}
            </span>
        );
    };


    if (user?.role !== 'admin') {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '60px' }}>
                <h2 style={{ marginBottom: '16px' }}>Access Denied</h2>
                <p style={{ color: 'var(--gray)' }}>You need admin privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Expense Approvals</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`btn ${filter === 'pending' ? 'btn-primary' : ''}`}
                        style={filter !== 'pending' ? { background: 'var(--gray-light)', color: 'var(--dark)' } : {}}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                        style={filter !== 'all' ? { background: 'var(--gray-light)', color: 'var(--dark)' } : {}}
                    >
                        All Expenses
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : expenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--gray)' }}>No {filter} expenses found.</p>
                </div>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Employee</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Title</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Amount</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((exp) => (
                                <tr key={exp.id}>
                                    <td style={{ padding: '12px' }}>{exp.User?.name || 'Unknown'}</td>
                                    <td style={{ padding: '12px' }}>{exp.title}</td>
                                    <td style={{ padding: '12px' }}>{exp.category}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{exp.currency || '$'}{exp.amount}</td>
                                    <td style={{ padding: '12px' }}>{getStatusBadge(exp.status)}</td>
                                    <td style={{ padding: '12px' }}>
                                        {exp.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(exp.id)}
                                                    style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(exp.id)}
                                                    style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Approvals;
