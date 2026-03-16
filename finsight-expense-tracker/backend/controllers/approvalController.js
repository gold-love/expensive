const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const User = require('../models/User');
const { Op } = require('sequelize');
const { logAudit } = require('../utils/audit');
const sendEmail = require('../utils/sendEmail');

// @desc    Get pending expenses (Admin only)
// @route   GET /api/approvals/pending
// @access  Private/Admin
const getPendingExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const expenses = await Expense.findAll({
            where: {
                status: 'pending',
                organizationId: req.user.organizationId
            },
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']],
        });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve an expense
// @route   PUT /api/approvals/:id/approve
// @access  Private/Admin
const approveExpense = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const expense = await Expense.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['id', 'name', 'email', 'notificationPreferences', 'preferredCurrency'] }]
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.status = 'approved';
        expense.approvalNote = req.body.note || null;
        await expense.save();

        // Send Notification Email
        const user = expense.User;
        if (user && user.notificationPreferences?.expenseApproved) {
            try {
                await sendEmail({
                    email: user.email,
                    subject: '✅ Expense Approved: ' + expense.title,
                    message: `Hello ${user.name},\n\nYour expense "${expense.title}" for ${user.preferredCurrency} ${expense.amount} has been approved by the administrator.`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
                            <h2 style="color: #10b981; margin-top: 0;">Expense Approved ✅</h2>
                            <p>Hello <strong>${user.name}</strong>,</p>
                            <p>Good news! Your expense has been approved.</p>
                            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                                <p style="margin: 0; font-size: 1.1rem; font-weight: 700;">${expense.title}</p>
                                <p style="margin: 5px 0; color: #64748b;">Amount: ${user.preferredCurrency} ${expense.amount}</p>
                            </div>
                            <p style="font-size: 0.9rem; color: #94a3b8;">You can view the details in your dashboard.</p>
                        </div>
                    `
                });
            } catch (err) {
                console.error('Failed to send approval email:', err);
            }
        }

        await logAudit({
            req,
            action: 'APPROVE_EXPENSE',
            targetType: 'Expense',
            targetId: expense.id,
            details: { amount: expense.amount, category: expense.category }
        });

        res.json({ message: 'Expense approved', expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject an expense
// @route   PUT /api/approvals/:id/reject
// @access  Private/Admin
const rejectExpense = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const expense = await Expense.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['id', 'name', 'email', 'notificationPreferences', 'preferredCurrency'] }]
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.status = 'rejected';
        expense.rejectionReason = req.body.reason || 'No reason provided';
        await expense.save();

        // Send Notification Email
        const user = expense.User;
        if (user && user.notificationPreferences?.expenseRejected) {
            try {
                await sendEmail({
                    email: user.email,
                    subject: '❌ Expense Rejected: ' + expense.title,
                    message: `Hello ${user.name},\n\nYour expense "${expense.title}" for ${user.preferredCurrency} ${expense.amount} has been rejected by the administrator.`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; max-width: 500px;">
                            <h2 style="color: #ef4444; margin-top: 0;">Expense Rejected ❌</h2>
                            <p>Hello <strong>${user.name}</strong>,</p>
                            <p>Unfortunately, your expense submission has been rejected.</p>
                            <div style="background: #fff1f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                                <p style="margin: 0; font-size: 1.1rem; font-weight: 700;">${expense.title}</p>
                                <p style="margin: 5px 0; color: #991b1b;">Amount: ${user.preferredCurrency} ${expense.amount}</p>
                            </div>
                            <p style="font-size: 0.9rem; color: #64748b;">Please contact your administrator for more details.</p>
                        </div>
                    `
                });
            } catch (err) {
                console.error('Failed to send rejection email:', err);
            }
        }

        res.json({ message: 'Expense rejected', expense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all expenses (Admin only)
// @route   GET /api/approvals/all
// @access  Private/Admin
const getAllExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const expenses = await Expense.findAll({
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']],
        });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending budgets (Admin only)
// @route   GET /api/approvals/budgets/pending
// @access  Private/Admin
const getPendingBudgets = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const budgets = await Budget.findAll({
            where: {
                status: 'pending'
            },
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']],
        });

        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a budget
// @route   PUT /api/approvals/budgets/:id/approve
// @access  Private/Admin
const approveBudget = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const budget = await Budget.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        budget.status = 'approved';
        await budget.save();

        await logAudit({
            req,
            action: 'APPROVE_BUDGET',
            targetType: 'Budget',
            targetId: budget.id,
            details: { amount: budget.amount, category: budget.category }
        });

        res.json({ message: 'Budget approved', budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a budget
// @route   PUT /api/approvals/budgets/:id/reject
// @access  Private/Admin
const rejectBudget = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const budget = await Budget.findByPk(req.params.id);

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        budget.status = 'rejected';
        await budget.save();

        res.json({ message: 'Budget rejected', budget });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingExpenses,
    approveExpense,
    rejectExpense,
    getAllExpenses,
    getPendingBudgets,
    approveBudget,
    rejectBudget
};
