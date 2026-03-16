const Expense = require('../models/Expense');
const Organization = require('../models/Organization');
const { checkBudgetStatus } = require('../utils/budgetCheck');
const { Op } = require('sequelize');

const getExpenses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Build dynamic filter
        const where = { userId: req.user.id };

        // Search by title or category
        if (req.query.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${req.query.search}%` } },
                { category: { [Op.iLike]: `%${req.query.search}%` } }
            ];
        }

        // Filter by category
        if (req.query.category) {
            where.category = req.query.category;
        }

        // Filter by status
        if (req.query.status) {
            where.status = req.query.status;
        }

        // Filter by date range
        if (req.query.dateFrom || req.query.dateTo) {
            where.date = {};
            if (req.query.dateFrom) {
                where.date[Op.gte] = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
                const endDate = new Date(req.query.dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.date[Op.lte] = endDate;
            }
        }

        // Filter by amount range
        if (req.query.minAmount) {
            where.amount = { ...(where.amount || {}), [Op.gte]: parseFloat(req.query.minAmount) };
        }
        if (req.query.maxAmount) {
            where.amount = { ...(where.amount || {}), [Op.lte]: parseFloat(req.query.maxAmount) };
        }

        const { count, rows: expenses } = await Expense.findAndCountAll({
            where,
            order: [['date', 'DESC']],
            limit,
            offset,
        });

        res.json({
            expenses,
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
                limit,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createExpense = async (req, res) => {
    const { title, amount, category, date, description, currency, isRecurring, recurringInterval } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!category) {
        return res.status(400).json({ message: 'Category is required' });
    }

    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        let status = 'pending';

        // Check for Auto-Approval Rules
        if (req.user.organizationId) {
            const organization = await Organization.findByPk(req.user.organizationId);
            if (organization && organization.settings && organization.settings.autoApproveLimit) {
                const limit = parseFloat(organization.settings.autoApproveLimit);
                if (parseFloat(amount) <= limit) {
                    status = 'approved';
                }
            }
        }

        const expense = await Expense.create({
            userId: req.user.id,
            organizationId: req.user.organizationId,
            title,
            amount,
            category,
            date: date || new Date(),
            description,
            currency: currency || 'USD',
            receiptUrl,
            status, // Set calculated status
            isRecurring: isRecurring === 'true' || isRecurring === true,
            recurringInterval: (isRecurring === 'true' || isRecurring === true) ? recurringInterval : null,
        });

        res.status(201).json(expense);

        // Run budget check in background
        checkBudgetStatus(req.user.id, category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);

        if (expense) {
            if (expense.userId !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await expense.destroy();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateExpense = async (req, res) => {
    const { title, amount, category, date, description, currency, isRecurring, recurringInterval } = req.body;

    try {
        const expense = await Expense.findByPk(req.params.id);

        if (expense) {
            if (expense.userId !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            expense.title = title || expense.title;
            expense.amount = amount || expense.amount;
            expense.category = category || expense.category;
            expense.date = date || expense.date;
            expense.description = description || expense.description;
            expense.currency = currency || expense.currency;

            if (isRecurring !== undefined) {
                expense.isRecurring = isRecurring === 'true' || isRecurring === true;
                expense.recurringInterval = expense.isRecurring ? recurringInterval : null;
            }

            if (req.file) expense.receiptUrl = req.file.path;

            const updatedExpense = await expense.save();
            res.json(updatedExpense);

            // Run budget check in background
            checkBudgetStatus(req.user.id, updatedExpense.category);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAllExpenses = async (req, res) => {
    try {
        await Expense.destroy({
            where: { userId: req.user.id }
        });
        res.json({ message: 'All expense data cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getExpenses, createExpense, deleteExpense, updateExpense, deleteAllExpenses };

