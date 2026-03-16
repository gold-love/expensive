const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const { fn, col, Op } = require('sequelize');

const checkBudgetStatus = async (userId, category) => {
    try {
        const user = await User.findByPk(userId);
        if (!user || !user.emailNotifications) return;

        // Find budget for this category
        const budget = await Budget.findOne({
            where: { userId, category }
        });

        if (!budget) return;

        // Calculate total spent in this category for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const totalSpentRes = await Expense.findAll({
            where: {
                userId,
                category,
                date: { [Op.gte]: startOfMonth },
                status: { [Op.ne]: 'rejected' }
            },
            attributes: [[fn('SUM', col('amount')), 'total']]
        });

        const totalSpent = parseFloat(totalSpentRes[0].getDataValue('total')) || 0;
        const budgetLimit = parseFloat(budget.amount);
        const percentage = (totalSpent / budgetLimit) * 100;

        if (percentage >= 80) {
            const isExceeded = percentage >= 100;
            const subject = isExceeded
                ? `🚨 CRITICAL: Budget Exceeded for ${category}`
                : `⚠️ WARNING: Budget Alert for ${category}`;

            const message = `
                Hello ${user.name},
                
                You have reached ${percentage.toFixed(0)}% of your ${category} budget.
                Limit: ${user.preferredCurrency} ${budgetLimit.toFixed(2)}
                Current Spending: ${user.preferredCurrency} ${totalSpent.toFixed(2)}
                
                Please log in to manage your expenses.
            `;

            const html = `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: ${isExceeded ? '#ef4444' : '#f59e0b'};">Budget Status Update</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>You have reached <strong style="font-size: 1.2rem;">${percentage.toFixed(0)}%</strong> of your <strong>${category}</strong> budget.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;">Limit: <strong>${user.preferredCurrency} ${budgetLimit.toFixed(2)}</strong></p>
                        <p style="margin: 5px 0;">Spent: <strong>${user.preferredCurrency} ${totalSpent.toFixed(2)}</strong></p>
                    </div>
                    <p>Stay on track with your financial goals!</p>
                </div>
            `;

            await sendEmail({
                email: user.email,
                subject,
                message,
                html
            });
        }
    } catch (error) {
        console.error('Budget check error:', error);
    }
};

module.exports = { checkBudgetStatus };
