import React, { useState, useEffect, useContext } from 'react';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import DatePickerCalendar from '../components/DatePickerCalendar';
import api, { getApiUrl } from '../services/api';
import AuthContext from '../context/AuthContext';

const Expenses = () => {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [selectedIds, setSelectedIds] = useState([]);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [viewingExpense, setViewingExpense] = useState(null);
    const [budgetImpact, setBudgetImpact] = useState(null);

    const fetchExpenses = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const scope = user?.role === 'admin' ? '&scope=company' : '';
            const filters = `&status=${statusFilter}&category=${categoryFilter}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
            const sorting = `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
            const { data } = await api.get(`/expenses?page=${page}&limit=15&search=${search}${scope}${filters}${sorting}`);
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
        setSelectedIds([]); // Reset selection on filter change
    }, [debouncedSearch, statusFilter, categoryFilter, dateFrom, dateTo]);

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

    const handleDownloadCSV = () => {
        if (expenses.length === 0) return;
        
        const headers = ["Date", "Title", "Category", "Amount", "Currency", "Status", "Description"];
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            `"${e.title.replace(/"/g, '""')}"`,
            e.category,
            e.amount,
            e.currency,
            e.status,
            `"${(e.description || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleQuickApprove = async (id) => {
        try {
            await api.put(`/approvals/${id}/approve`);
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            console.error('Error approving expense:', error);
            alert('Failed to approve expense');
        }
    };

    const handleQuickReject = async (id) => {
        const reason = window.prompt('Please enter a reason for rejection:');
        if (!reason) return;
        
        try {
            await api.put(`/approvals/${id}/reject`, { reason });
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            console.error('Error rejecting expense:', error);
            alert('Failed to reject expense');
        }
    };

    const handleBulkApprove = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Approve ${selectedIds.length} selected expenses?`)) return;
        try {
            await api.put('/approvals/bulk', { ids: selectedIds, action: 'approve' });
            setSelectedIds([]);
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            console.error('Bulk approve error:', error);
            alert('Failed to approve selected expenses');
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Delete ${selectedIds.length} selected expenses? This cannot be undone.`)) return;
        try {
            // Delete sequentially as there's no bulk delete endpoint
            await Promise.all(selectedIds.map(id => api.delete(`/expenses/${id}`)));
            setSelectedIds([]);
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Some expenses could not be deleted');
        }
    };

    const handleBulkApproveForAll = async () => {
        const pendingIds = expenses.filter(e => e.status === 'pending').map(e => e.id);
        if (pendingIds.length === 0) return;
        if (!window.confirm(`Approve all ${pendingIds.length} pending expenses currently in view?`)) return;
        try {
            await api.put('/approvals/bulk', { ids: pendingIds, action: 'approve' });
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            alert('Failed to approve expenses');
        }
    };

    const handleBulkDeleteForAllRejected = async () => {
        const rejectedIds = expenses.filter(e => e.status === 'rejected').map(e => e.id);
        if (rejectedIds.length === 0) return;
        if (!window.confirm(`Delete all ${rejectedIds.length} rejected expenses currently in view?`)) return;
        try {
            await Promise.all(rejectedIds.map(id => api.delete(`/expenses/${id}`)));
            fetchExpenses(pagination.page, debouncedSearch);
        } catch (error) {
            alert('Failed to clear rejected expenses');
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        setSelectedIds(prev => prev.length === expenses.length ? [] : expenses.map(e => e.id));
    };

    const totals = expenses.reduce((acc, curr) => {
        acc.total += parseFloat(curr.amount);
        acc[curr.status] = (acc[curr.status] || 0) + parseFloat(curr.amount);
        acc[`${curr.status}Count`] = (acc[`${curr.status}Count`] || 0) + 1;
        return acc;
    }, { total: 0, pending: 0, approved: 0, rejected: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0 });

    const handleCardClick = (status) => {
        setStatusFilter(status);
        setSelectedIds([]);
        // Smooth scroll to table
        const table = document.querySelector('table');
        if (table) {
            table.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleViewDetails = async (exp) => {
        setViewingExpense(exp);
        setBudgetImpact(null); // Reset
        try {
            const { data } = await api.get(`/expenses/${exp.id}/budget-status`);
            setBudgetImpact(data);
        } catch (error) {
            console.error('Error fetching budget impact:', error);
        }
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };

    useEffect(() => {
        fetchExpenses(pagination.page, debouncedSearch);
    }, [sortBy, sortOrder]);

    if (loading && expenses.length === 0) return <p>Loading...</p>;

    return (
        <div className="fade-in">
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div 
                    className="card" 
                    onClick={() => handleCardClick('')}
                    style={{ 
                        background: 'var(--grad-primary)', 
                        color: 'white', 
                        border: 'none', 
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        position: 'relative'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>Current Filter Total</div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>{expenses.length} expenses listed</div>
                    <div style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '20px', opacity: 0.3 }}>🔍</div>
                </div>
                
                <div 
                    className="card" 
                    onClick={() => handleCardClick('pending')}
                    style={{ 
                        background: statusFilter === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
                        color: 'white',
                        border: 'none', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: statusFilter === 'pending' ? '0 8px 20px rgba(245, 158, 11, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>⌛ Pending Review</div>
                        <div style={{ fontSize: '24px', fontWeight: '800' }}>${totals.pending.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>{totals.pendingCount} items waiting</div>
                    </div>
                    {user?.role === 'admin' && totals.pendingCount > 0 && (
                        <div 
                            style={{ 
                                marginTop: '10px', 
                                background: 'rgba(255,255,255,0.2)', 
                                border: '1px solid rgba(255,255,255,0.4)', 
                                color: 'white', 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                fontSize: '11px', 
                                fontWeight: '700',
                                textAlign: 'center'
                            }}
                        >
                            View & Manage ➔
                        </div>
                    )}
                </div>

                <div 
                    className="card" 
                    onClick={() => handleCardClick('approved')}
                    style={{ 
                        background: statusFilter === 'approved' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: 'white',
                        border: 'none', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: statusFilter === 'approved' ? '0 8px 20px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>✅ Approved Total</div>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>${totals.approved.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>{totals.approvedCount} items cleared</div>
                </div>

                {totals.rejected > 0 && (
                    <div 
                        className="card" 
                        onClick={() => handleCardClick('rejected')}
                        style={{ 
                            background: statusFilter === 'rejected' ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                            color: 'white',
                            border: 'none', 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: statusFilter === 'rejected' ? '0 8px 20px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>❌ Rejected</div>
                            <div style={{ fontSize: '24px', fontWeight: '800' }}>${totals.rejected.toLocaleString()}</div>
                            <div style={{ fontSize: '12px', opacity: 0.9 }}>{totals.rejectedCount} items declined</div>
                        </div>
                        {user?.role === 'admin' && (
                            <div 
                                style={{ 
                                    marginTop: '10px', 
                                    background: 'rgba(255,255,255,0.2)', 
                                    border: '1px solid rgba(255,255,255,0.4)', 
                                    color: 'white', 
                                    padding: '6px 12px', 
                                    borderRadius: '8px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    textAlign: 'center'
                                }}
                            >
                                View & Cleanup ➔
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ margin: 0 }}>
                    {user?.role === 'admin' ? 'Company Expenses' : 'My Expenses'}
                    {user?.role === 'admin' && <span style={{ marginLeft: '12px', fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', verticalAlign: 'middle' }}>Admin View</span>}
                </h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginRight: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px' }}>{selectedIds.length} Selected</span>
                            {user?.role === 'admin' && <button onClick={handleBulkApprove} className="btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#dcfce7', color: '#166534', fontWeight: '700' }}>Approve All</button>}
                            <button onClick={handleBulkDelete} className="btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#fee2e2', color: '#991b1b', fontWeight: '700' }}>Delete All</button>
                        </div>
                    )}
                    {user?.role === 'admin' && (
                        <button 
                            onClick={handleDownloadCSV}
                            className="btn"
                            style={{ background: 'var(--success-soft)', color: 'var(--success-dark)', fontWeight: '700', borderRadius: '12px' }}
                        >
                            📥 CSV
                        </button>
                    )}
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: '2px solid var(--primary)', borderRadius: '12px' }}
                        />
                    </div>
                </div>
            </div>
            <div className="card" style={{ marginBottom: '20px', padding: '20px', overflow: 'visible' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'end', overflow: 'visible' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray)' }}>Status</label>
                        <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="approved">✅ Approved</option>
                            <option value="rejected">❌ Rejected</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray)' }}>Category</label>
                        <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="">All Categories</option>
                            <option value="Food">🍎 Food</option>
                            <option value="Transport">🚗 Transport</option>
                            <option value="Housing">🏠 Housing</option>
                            <option value="Utilities">💧 Utilities</option>
                            <option value="Entertainment">🎬 Entertainment</option>
                            <option value="Other">✨ Other</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray)' }}>From Date</label>
                        <DatePickerCalendar value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Start date" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray)' }}>To Date</label>
                        <DatePickerCalendar value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="End date" />
                    </div>
                    <button 
                        className="btn" 
                        style={{ background: 'var(--gray-light)', color: 'var(--dark)', fontWeight: '600' }}
                        onClick={() => {
                            setStatusFilter('');
                            setCategoryFilter('');
                            setDateFrom('');
                            setDateTo('');
                            setSearchTerm('');
                        }}
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>

            <ExpenseTable
                expenses={expenses || []}
                onDelete={handleDelete}
                onEdit={(exp) => setEditingExpense(exp)}
                onApprove={user?.role === 'admin' ? handleQuickApprove : null}
                onReject={user?.role === 'admin' ? handleQuickReject : null}
                isAdmin={user?.role === 'admin'}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleAll={toggleAll}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onViewDetails={handleViewDetails}
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

            {viewingExpense && (
                <div className="modal-overlay" onClick={() => setViewingExpense(null)}>
                    <div className="card" style={{ width: '600px', padding: '0', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ background: 'var(--grad-primary)', padding: '30px', color: 'white', position: 'relative' }}>
                            <button onClick={() => setViewingExpense(null)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>&times;</button>
                            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: '700', textTransform: 'uppercase' }}>{viewingExpense.category}</div>
                            <h2 style={{ margin: '5px 0' }}>{viewingExpense.title}</h2>
                            <div style={{ fontSize: '32px', fontWeight: '800' }}>
                                {viewingExpense.currency || '$'} {parseFloat(viewingExpense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div style={{ marginTop: '10px' }} className={`status-badge status-${viewingExpense.status || 'pending'}`}>{viewingExpense.status}</div>
                        </div>
                        
                        <div style={{ padding: '30px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Date</label>
                                    <div style={{ fontWeight: '600' }}>{new Date(viewingExpense.date || Date.now()).toLocaleDateString(undefined, { dateStyle: 'full' })}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Tax Detail</label>
                                    <div style={{ fontWeight: '600' }}>
                                        {viewingExpense.taxRate || 0}% (${parseFloat(viewingExpense.taxAmount || 0).toFixed(2)})
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Project</label>
                                    <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{viewingExpense.Project?.name || 'No Project Assigned'}</div>
                                    {viewingExpense.Project?.code && <div style={{ fontSize: '11px', color: 'var(--gray)' }}>Code: {viewingExpense.Project.code}</div>}
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Vendor</label>
                                    <div style={{ fontWeight: '600' }}>{viewingExpense.Vendor?.name || 'No Vendor Assigned'}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Description</label>
                                <div style={{ 
                                    background: '#f8fafc', 
                                    padding: '15px', 
                                    borderRadius: '12px', 
                                    fontSize: '14px', 
                                    lineHeight: '1.6', 
                                    color: '#475569',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {viewingExpense.description || 'No description provided.'}
                                </div>
                            </div>

                            {/* Budget Impact Section */}
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: '700', textTransform: 'uppercase' }}>Budget Analysis</label>
                                {!budgetImpact ? (
                                    <div style={{ fontSize: '12px', color: 'var(--gray)', fontStyle: 'italic', marginTop: '5px' }}>Calculating budget impact...</div>
                                ) : !budgetImpact.hasBudget ? (
                                    <div style={{ 
                                        background: '#f8fafc', 
                                        padding: '12px', 
                                        borderRadius: '8px', 
                                        fontSize: '12px', 
                                        color: '#64748b',
                                        marginTop: '5px',
                                        border: '1px dashed #cbd5e1'
                                    }}>
                                        ℹ️ No approved budget found for the <strong>{viewingExpense.category}</strong> category for this user.
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: budgetImpact.willBeOver ? '#fef2f2' : '#f0fdf4', 
                                        padding: '20px', 
                                        borderRadius: '12px', 
                                        marginTop: '5px',
                                        border: `1px solid ${budgetImpact.willBeOver ? '#fecaca' : '#bbf7d0'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: budgetImpact.willBeOver ? '#991b1b' : '#166534' }}>
                                                {budgetImpact.willBeOver ? '⚠️ Budget Overrun Warning' : '✅ Budget Compliant'}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                                {budgetImpact.percentWithNew}% Used
                                            </span>
                                        </div>
                                        <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                                            <div style={{ 
                                                background: budgetImpact.willBeOver ? '#ef4444' : '#10b981', 
                                                width: `${Math.min(parseFloat(budgetImpact.percentWithNew), 100)}%`, 
                                                height: '100%' 
                                            }}></div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            Limit: ${budgetImpact.budgetAmount.toLocaleString()} 
                                            <span style={{ marginLeft: '10px' }}>
                                                ({budgetImpact.willBeOver ? `Over by $${Math.abs(budgetImpact.remaining - budgetImpact.currentExpenseAmount).toFixed(2)}` : `$${(budgetImpact.remaining - budgetImpact.currentExpenseAmount).toFixed(2)} remaining`})
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                {viewingExpense.receiptUrl && (
                                    <a 
                                        href={getApiUrl(viewingExpense.receiptUrl)}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn"
                                        style={{ background: 'var(--primary)', color: 'white', textDecoration: 'none', textAlign: 'center', flex: 1 }}
                                    >
                                        📄 View Original Receipt
                                    </a>
                                )}
                                <button onClick={() => setViewingExpense(null)} className="btn" style={{ background: 'var(--gray-light)', color: 'var(--dark)', flex: 1 }}>
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
