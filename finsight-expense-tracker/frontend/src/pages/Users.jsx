import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Users = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/auth/users/${userId}/role`, { role: newRole });
            toast.success('User role updated');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/auth/users/${userId}`);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    if (currentUser?.role !== 'admin') {
        return <div className="card">Access Denied</div>;
    }

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '24px' }}>User Management</h2>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Joined</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                    <td style={{ padding: '12px' }}>{u.name}</td>
                                    <td style={{ padding: '12px' }}>{u.email}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div className={`status-badge ${u.role === 'admin' ? 'status-approved' : 'status-pending'}`} style={{ border: 'none', padding: '0 8px' }}>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === currentUser.id}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'inherit',
                                                    fontWeight: 'inherit',
                                                    fontSize: 'inherit',
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </td>

                                    <td style={{ padding: '12px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            disabled={u.id === currentUser.id}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--danger)',
                                                cursor: u.id === currentUser.id ? 'not-allowed' : 'pointer',
                                                opacity: u.id === currentUser.id ? 0.5 : 1
                                            }}
                                        >
                                            Delete
                                        </button>
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

export default Users;
