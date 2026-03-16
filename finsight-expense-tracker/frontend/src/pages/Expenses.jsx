import React, { useState, useEffect } from 'react';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import api from '../services/api';

const Expenses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const fetchExpenses = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const { data } = await api.get(`/expenses?page=${page}&limit=15&search=${search}`);
            setExpenses(data.expenses || data);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchExpenses(1, debouncedSearch);
    }, [debouncedSearch]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            await api.delete(`/expenses/${id}`);
            fetchExpenses(pagination.page);
        }
    };

    const handleEditSuccess = () => {
        setEditingExpense(null);
        fetchExpenses(pagination.page);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchExpenses(newPage, debouncedSearch);
        }
    };

    if (loading && expenses.length === 0) return <p>Loading...</p>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>My Expenses</h2>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Search across all expenses..."
                        className="form-control"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: '2px solid var(--primary)', borderRadius: '12px' }}
                    />
                </div>
            </div>
            <ExpenseTable
                expenses={expenses || []}
                onDelete={handleDelete}
                onEdit={(exp) => setEditingExpense(exp)}
            />

            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn"
                        style={{ background: 'var(--gray-light)', color: 'var(--dark)' }}
                    >
                        Previous
                    </button>
                    <span style={{ fontWeight: '600' }}>
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="btn"
                        style={{ background: 'var(--gray-light)', color: 'var(--dark)' }}
                    >
                        Next
                    </button>
                </div>
            )}

            <p style={{ textAlign: 'center', color: 'var(--gray)', marginTop: '12px' }}>
                Showing {expenses.length} of {pagination.total} expenses
            </p>

            {editingExpense && (
                <div className="modal-overlay" onClick={() => setEditingExpense(null)}>
                    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3>Edit Expense</h3>
                            <button onClick={() => setEditingExpense(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                        </div>
                        <ExpenseForm initialData={editingExpense} onSuccess={handleEditSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
