import React, { useEffect, useState } from 'react';
import { ExpenseBar, ExpenseDoughnut } from '../components/Charts';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';



const Reports = () => {
    const toast = useToast();
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({ grandTotal: 0, currency: 'USD' });



    useEffect(() => {
        api.get('/reports/category').then(res => {
            setCategoryData(res.data.report || []);
            setSummary({ grandTotal: res.data.grandTotal, currency: res.data.currency });
        });

        api.get('/reports/monthly').then(res => setMonthlyData(res.data));
        api.get('/expenses').then(res => {
            const data = res.data.expenses || res.data;
            setExpenses(Array.isArray(data) ? data : []);
        });
    }, []);



    const exportToPDF = () => {
        if (!expenses || expenses.length === 0) {
            toast.warning('No data available to export');
            return;
        }

        try {
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Finsight Expense Report', 14, 22);
            doc.setFontSize(11);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

            const tableData = expenses.map(exp => [
                new Date(exp.date).toLocaleDateString(),
                exp.title,
                exp.category,
                `${exp.currency || '$'}${exp.amount}`,
                exp.status || 'pending'
            ]);

            autoTable(doc, {
                head: [['Date', 'Title', 'Category', 'Amount', 'Status']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [99, 102, 241] },
            });

            // Summary section
            const total = expenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 40;
            doc.text(`Total Expenses: $${total.toFixed(2)}`, 14, finalY + 15);

            doc.save('finsight-expense-report.pdf');
            toast.success('PDF report downloaded');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to generate PDF report');
        }
    };


    const exportToExcel = () => {
        if (!expenses || expenses.length === 0) {
            toast.warning('No data available to export');
            return;
        }

        try {
            const worksheetData = expenses.map(exp => ({
                Date: new Date(exp.date).toLocaleDateString(),
                Title: exp.title,
                Category: exp.category,
                Amount: exp.amount,
                Currency: exp.currency || 'USD',
                Status: exp.status || 'pending',
                Description: exp.description || '',
            }));

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
            XLSX.writeFile(workbook, 'finsight-expenses.xlsx');
            toast.success('Excel report downloaded');
        } catch (error) {
            console.error('Excel Export Error:', error);
            toast.error('Failed to generate Excel report');
        }
    };


    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Financial Reports</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={exportToPDF} className="btn btn-primary">
                        Export PDF
                    </button>
                    <button onClick={exportToExcel} className="btn" style={{ background: 'var(--success)', color: 'white' }}>
                        Export Excel
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Expense Distribution</h3>
                    <ExpenseDoughnut data={categoryData} />
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--dark-soft)' }}>Monthly Trends</h3>
                    <ExpenseBar data={monthlyData} />
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Category Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                            <th style={{ textAlign: 'right', padding: '12px' }}>Total Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryData.map((cat, index) => (
                            <tr key={index}>
                                <td style={{ padding: '12px' }}>{cat._id}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {summary.currency} {parseFloat(cat.total).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--gray-light)', background: 'var(--gray-light)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>Grand Total (Converted)</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--indigo)' }}>
                                {summary.currency} {parseFloat(summary.grandTotal).toLocaleString()}
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
