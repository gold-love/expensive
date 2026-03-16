import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseCard from '../components/ExpenseCard';
import { ExpenseDoughnut, ExpenseBar } from '../components/Charts';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import ActivityTimeline from '../components/ActivityTimeline';


const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [totalExpense, setTotalExpense] = useState(0);
    const [budgetCount, setBudgetCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [topExpenses, setTopExpenses] = useState([]);
    const [budgetAlerts, setBudgetAlerts] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: catResponse } = await api.get('/reports/category');
                const { data: monData } = await api.get('/reports/monthly');
                const { data: budgetData } = await api.get('/budgets');
                const expenseRes = await api.get('/expenses?limit=5');

                const expenses = expenseRes.data.expenses || (Array.isArray(expenseRes.data) ? expenseRes.data : []);

                const catData = catResponse.report || [];
                setCategoryData(catData);
                setMonthlyData(monData);
                setBudgetCount(budgetData.length);
                setTopExpenses(expenses.slice(0, 5));

                if (user?.role === 'admin') {
                    const { data: aStats } = await api.get('/reports/admin-summary');
                    setAdminStats(aStats);
                }

                setTotalExpense(catResponse.grandTotal || 0);

                // Check budget alerts
                const alerts = [];
                budgetData.forEach(budget => {
                    const spent = catData.find(c => c._id === budget.category);
                    if (spent) {
                        const percentage = (parseFloat(spent.total) / parseFloat(budget.amount)) * 100;
                        if (percentage >= 80) {
                            alerts.push({
                                category: budget.category,
                                percentage: percentage.toFixed(0),
                                exceeded: percentage >= 100
                            });
                        }
                    }
                });
                setBudgetAlerts(alerts);

                // Count pending expenses correctly
                const pending = expenses.filter(e => e.status === 'pending').length;
                setPendingCount(pending);
            } catch (error) {
                console.error('Dashboard Data Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.role]);

    if (loading && totalExpense === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray)' }}>Loading dashboard data...</div>;
    }

    return (
        <div className="fade-in">
            <h2 style={{ marginBottom: '24px' }}>Financial Dashboard</h2>

            {user?.role === 'admin' && adminStats && (
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Company Overview</h3>
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <ExpenseCard title="Total Company Spend" amount={adminStats.totalCompanySpend} color="var(--primary)" icon="🏢" />
                        <ExpenseCard title="Global Pending" amount={adminStats.pendingCount} color="var(--warning)" icon="⏳" />
                        <ExpenseCard title="Total Categories" amount={adminStats.companyCategoryData.length} color="var(--success)" icon="📁" />
                    </div>
                </div>
            )}


            {budgetAlerts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    {budgetAlerts.map((alert, index) => (
                        <div key={index} className="card" style={{
                            background: alert.exceeded ? '#fee2e2' : '#fef3c7',
                            border: `1px solid ${alert.exceeded ? '#fecaca' : '#fde68a'}`,
                            marginBottom: '12px',
                            padding: '16px'
                        }}>
                            <strong style={{ color: alert.exceeded ? '#dc2626' : '#d97706' }}>
                                {alert.exceeded ? '⚠️ Budget Exceeded!' : '⚡ Budget Alert!'}
                            </strong>
                            <span style={{ marginLeft: '12px' }}>
                                {alert.category} is at {alert.percentage}% of your limit
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="stats-grid">
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <ExpenseCard title="Total Expenses" amount={totalExpense} color="var(--primary)" icon="$" />
                )}

                {user?.orgSettings?.budgetModuleEnabled !== false && (
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/budgets')}>
                        <ExpenseCard title="Active Budgets" amount={budgetCount} color="var(--success)" icon="B" isCurrency={false} />
                        {budgetCount === 0 && (
                            <button className="btn" style={{
                                position: 'absolute',
                                right: '60px',
                                top: '45px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                background: 'var(--success)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                zIndex: 10
                            }}>
                                + Set New
                            </button>
                        )}
                    </div>
                )}

                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div style={{ cursor: 'pointer' }} onClick={() => navigate('/approvals')}>
                        <ExpenseCard title="Pending Items" amount={pendingCount} color="var(--secondary)" icon="P" isCurrency={false} />
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }} className="slide-up">
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div className="card">
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Category Distribution</h3>
                        <ExpenseDoughnut data={categoryData} />
                    </div>
                )}
                {user?.orgSettings?.expenseModuleEnabled !== false && (
                    <div className="card">
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Monthly Spending</h3>
                        <ExpenseBar data={monthlyData} />
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Recent Transactions</span>
                        <a href="/expenses" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>View All →</a>
                    </h3>
                    {topExpenses.length === 0 ? (
                        <p style={{ color: 'var(--gray)', padding: '20px' }}>No recent expenses</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Title</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topExpenses.map((exp) => (
                                    <tr key={exp.id}>
                                        <td style={{ padding: '12px' }}>{exp.title}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'var(--gray-light)',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                color: 'var(--gray)'
                                            }}>{exp.category}</span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                            {exp.currency || '$'}{exp.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '24px' }}>Status Activity</h3>
                    <ActivityTimeline activities={
                        topExpenses.map(exp => ({
                            title: exp.title,
                            time: new Date(exp.date).toLocaleDateString(),
                            type: exp.status,
                            description: `Expense categorized as ${exp.category} is currently ${exp.status}.`
                        }))
                    } />
                </div>
            </div>
        </div>
    );
};


export default Dashboard;
