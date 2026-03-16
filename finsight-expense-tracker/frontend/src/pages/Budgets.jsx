import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import BudgetCard from '../components/BudgetCard';
import AuthContext from '../context/AuthContext';

const Budgets = () => {
    const { user } = useContext(AuthContext);
    const [budgets, setBudgets] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [formData, setFormData] = useState({
        category: user?.defaultBudgetCategory || '',
        amount: '',
        period: 'monthly'
    });

    const fetchData = async () => {
        try {
            const { data: budgetData } = await api.get('/budgets');
            const { data: reportResponse } = await api.get('/reports/category');

            const reportObj = {};
            const reportData = reportResponse.report || [];

            reportData.forEach(item => {
                reportObj[item._id] = item.total;
            });

            setBudgets(budgetData);
            setCategoryData(reportObj);
        } catch (error) {
            console.error('Error fetching budget data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', formData);
            setFormData({
                category: user?.defaultBudgetCategory || '',
                amount: '',
                period: 'monthly'
            });
            fetchData();
        } catch (error) {
            alert('Failed to create budget');
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>Budget Management</h2>

            <div className="card" style={{ marginBottom: '30px' }}>
                <h3>Set New Budget</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
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
                        <label>Limit Amount</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-control" required min="1" />
                    </div>
                    <div className="form-group">
                        <label>Period</label>
                        <select name="period" value={formData.period} onChange={handleChange} className="form-control">
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '15px' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Set Budget</button>
                    </div>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {budgets.map(budget => (
                    <BudgetCard
                        key={budget.id}
                        category={budget.category}
                        amount={budget.amount}
                        spent={categoryData[budget.category] || 0}
                    />
                ))}
            </div>
            {budgets.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', gridColumn: '1/-1' }}>No budgets set yet. Use the form above to start.</p>}
        </div>
    );
};

export default Budgets;
