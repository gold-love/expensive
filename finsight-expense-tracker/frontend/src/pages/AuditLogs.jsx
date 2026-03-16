import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { SkeletonTable } from '../components/Skeleton';

const AuditLogs = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await api.get('/settings/audit-logs');
                setLogs(data);
            } catch (error) {
                console.error('Error fetching audit logs:', error);
            }
            setLoading(false);
        };
        fetchLogs();
    }, []);

    if (user?.role !== 'admin') {
        return (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '60px' }}>
                <h2 style={{ marginBottom: '16px' }}>Access Denied</h2>
                <p style={{ color: 'var(--gray)' }}>You need admin privileges to access audit logs.</p>
            </div>
        );
    }

    const actionTypes = [...new Set(logs.map(l => l.action))];
    const filteredLogs = filterAction ? logs.filter(l => l.action === filterAction) : logs;

    const getActionColor = (action) => {
        if (action.includes('APPROVE')) return '#10b981';
        if (action.includes('REJECT')) return '#ef4444';
        if (action.includes('DELETE')) return '#f59e0b';
        if (action.includes('CREATE')) return '#6366f1';
        return '#64748b';
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>📝 Audit Logs</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="form-control"
                        style={{ width: '200px' }}
                    >
                        <option value="">All Actions</option>
                        {actionTypes.map(a => (
                            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    <span style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>
                        {filteredLogs.length} records
                    </span>
                </div>
            </div>

            {loading ? (
                <SkeletonTable rows={8} />
            ) : filteredLogs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--gray)' }}>No audit logs found.</p>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--light)', textAlign: 'left' }}>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Timestamp</th>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>User</th>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Target</th>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</th>
                                <th style={{ padding: '14px 16px', color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase' }}>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--dark-soft)' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                                        {log.User?.name || 'System'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            background: getActionColor(log.action) + '18',
                                            color: getActionColor(log.action),
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                        {log.targetType}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--gray)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--gray)' }}>
                                        {log.ipAddress || '-'}
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

export default AuditLogs;
