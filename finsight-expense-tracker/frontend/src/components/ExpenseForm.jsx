import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ExpenseForm = ({ onSuccess, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        date: '',
        description: '',
        currency: 'USD',
        isRecurring: false,
        recurringInterval: '',
    });
    const [receipt, setReceipt] = useState(null);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                amount: initialData.amount || '',
                category: initialData.category || '',
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                description: initialData.description || '',
                currency: initialData.currency || 'USD',
                isRecurring: initialData.isRecurring || false,
                recurringInterval: initialData.recurringInterval || '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e) => {
        setReceipt(e.target.files[0]);
    };

    const handleScanReceipt = async () => {
        if (!receipt) {
            alert('Please select a receipt image first');
            return;
        }

        setScanning(true);
        const data = new FormData();
        data.append('receipt', receipt);

        try {
            const response = await api.post('/expenses/scan', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const { amount, date, title } = response.data.data;
                setFormData(prev => ({
                    ...prev,
                    amount: amount || prev.amount,
                    title: title || prev.title,
                    date: date ? new Date(date).toISOString().split('T')[0] : prev.date
                }));
                // Using a more professional success toast or alert
                alert('✨ Receipt analyzed! Title, Amount, and Date have been auto-filled. Please verify them.');
            }
        } catch (error) {
            console.error('Scan Error:', error);
            const msg = error.response?.data?.message || 'The AI could not read this receipt clearly. Please ensure it is a sharp image (JPG/PNG).';
            alert(msg);
        } finally {
            setScanning(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (receipt) data.append('receipt', receipt);

        try {
            if (initialData) {
                await api.put(`/expenses/${initialData.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/expenses', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setFormData({ title: '', amount: '', category: '', date: '', description: '', currency: 'USD', isRecurring: false, recurringInterval: '' });
            setReceipt(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to save expense');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <h2>{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
            <div className="form-group">
                <label>Title</label>
                <input name="title" value={formData.title} onChange={handleChange} className="form-control" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                <div className="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-control" required min="0.01" step="0.01" />
                </div>
                <div className="form-group">
                    <label>Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="form-control">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="ETB">ETB</option>
                        <option value="KES">KES</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="form-control" required>
                    <option value="">Select Category</option>
                    <option value="Expense">📑 General Expense</option>
                    <option value="Food">🍎 Food & Dining</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Housing">🏠 Housing</option>
                    <option value="Utilities">💧 Water & Electricity</option>
                    <option value="Clothing">👕 Clothing</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Health">🏥 Health</option>
                    <option value="Education">📚 Education</option>
                    <option value="Travel">✈️ Travel</option>
                    <option value="Other">✨ Other</option>
                </select>
            </div>
            <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-control"></textarea>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} id="isRecurring" />
                <label htmlFor="isRecurring" style={{ margin: 0 }}>This is a recurring expense</label>
            </div>
            {formData.isRecurring && (
                <div className="form-group">
                    <label>Repeat Every</label>
                    <select name="recurringInterval" value={formData.recurringInterval} onChange={handleChange} className="form-control" required>
                        <option value="">Select Interval</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
            )}
            <div className="form-group">
                <label>Receipt Image</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input type="file" onChange={handleFileChange} className="form-control" accept="image/*" />
                    <button
                        type="button"
                        onClick={handleScanReceipt}
                        className="btn"
                        style={{ background: '#1e293b', color: '#ffffff', flexShrink: 0, fontWeight: '700' }}
                        disabled={scanning || !receipt}
                    >
                        {scanning ? '🌀 Scanning...' : '✨ AI Scan'}
                    </button>
                </div>
                {scanning && <small style={{ color: '#818cf8', marginTop: '4px', display: 'block', fontWeight: '600' }}>Scanning receipt with AI... please wait.</small>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {initialData ? 'Update Expense' : 'Add Expense'}
            </button>
        </form>
    );
};

export default ExpenseForm;
