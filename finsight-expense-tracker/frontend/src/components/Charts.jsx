import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const COLORS = [
    '#6366f1', // Primary
    '#ec4899', // Secondary
    '#10b981', // Success
    '#f59e0b', // Warning
    '#ef4444', // Danger
    '#8b5cf6', // Indigo
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];

export const ExpenseDoughnut = ({ data }) => {
    const chartData = {
        labels: data.map(d => d._id),
        datasets: [
            {
                data: data.map(d => d.total),
                backgroundColor: COLORS,
                hoverBackgroundColor: COLORS.map(c => c + 'dd'),
                borderWidth: 2,
                borderColor: 'transparent', // Remove the static white border
                hoverOffset: 15,
                cutout: '70%',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    color: '#64748b', // Standard high-visibility neutral
                    font: { size: 12, weight: '500' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 14, weight: '700' },
                bodyFont: { size: 13 },
                boxPadding: 6,
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 2000,
            easing: 'easeOutQuart'
        }
    };

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export const ExpenseBar = ({ data }) => {
    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Expenses',
                data: data.map(d => d.total),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(99, 102, 241, 0.5)',
                barThickness: 32,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)', // Light gray grid
                    drawBorder: false,
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (value) => '$' + value.toLocaleString()
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: '500' }
                }
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeOutBounce'
        }
    };

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <Bar options={options} data={chartData} />
        </div>
    );
};

export const BudgetComparisonBar = ({ data }) => {
    const chartData = {
        labels: data.map(d => d.category),
        datasets: [
            {
                label: 'Budget Limit',
                data: data.map(d => d.budgetAmount),
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 28,
            },
            {
                label: 'Actual Spent',
                data: data.map(d => d.actualSpent),
                backgroundColor: data.map(d =>
                    parseFloat(d.percentage) >= 100 ? 'rgba(239, 68, 68, 0.3)' :
                    parseFloat(d.percentage) >= 80 ? 'rgba(245, 158, 11, 0.3)' :
                    'rgba(16, 185, 129, 0.3)'
                ),
                borderColor: data.map(d =>
                    parseFloat(d.percentage) >= 100 ? '#ef4444' :
                    parseFloat(d.percentage) >= 80 ? '#f59e0b' :
                    '#10b981'
                ),
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 28,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    color: '#64748b',
                    font: { size: 12, weight: '500' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    afterLabel: (context) => {
                        if (context.datasetIndex === 1) {
                            const item = data[context.dataIndex];
                            return `${item.percentage}% of budget`;
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(156, 163, 175, 0.1)', drawBorder: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (value) => '$' + value.toLocaleString()
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 11, weight: '500' } }
            }
        },
        animation: { duration: 1500, easing: 'easeOutQuart' }
    };

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <Bar options={options} data={chartData} />
        </div>
    );
};
