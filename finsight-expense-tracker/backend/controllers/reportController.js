const { sequelize } = require('../config/db');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { fn, col, Op } = require('sequelize');
const { convertCurrency } = require('../utils/currencyConverter');
const User = require('../models/User');


const getCategoryReport = async (req, res) => {
    try {
        // Build date filter
        const dateFilter = { userId: req.user.id };
        if (req.query.dateFrom || req.query.dateTo) {
            dateFilter.date = {};
            if (req.query.dateFrom) dateFilter.date[Op.gte] = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const end = new Date(req.query.dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.date[Op.lte] = end;
            }
        }

        const report = await Expense.findAll({
            where: dateFilter,
            attributes: [
                ['category', '_id'],
                [fn('SUM', col('amount')), 'total'],
                'currency'
            ],
            group: ['category', 'currency']
        });

        // Get user for preferred currency
        const user = await User.findByPk(req.user.id);
        const targetCurrency = user.preferredCurrency || 'USD';

        // Process and convert
        const processedReport = {};
        let grandTotal = 0;

        for (const item of report) {
            const category = item.getDataValue('_id');
            const amount = parseFloat(item.getDataValue('total'));
            const fromCurrency = item.getDataValue('currency') || 'USD';

            const converted = await convertCurrency(amount, fromCurrency, targetCurrency);

            if (!processedReport[category]) {
                processedReport[category] = 0;
            }
            processedReport[category] += parseFloat(converted);
            grandTotal += parseFloat(converted);
        }

        const finalReport = Object.keys(processedReport).map(key => ({
            _id: key,
            total: processedReport[key].toFixed(2)
        }));

        res.json({
            report: finalReport,
            grandTotal: grandTotal.toFixed(2),
            currency: targetCurrency
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMonthlyReport = async (req, res) => {
    try {
        const dialect = sequelize.getDialect();
        let monthAttr;
        let groupBy;
        let orderBy;

        if (dialect === 'sqlite') {
            monthAttr = [fn('strftime', '%m', col('date')), 'month'];
            groupBy = fn('strftime', '%m', col('date'));
            orderBy = fn('strftime', '%m', col('date'));
        } else if (dialect === 'postgres') {
            monthAttr = [fn('to_char', col('date'), 'Month'), 'month'];
            groupBy = fn('to_char', col('date'), 'Month');
            orderBy = fn('extract', sequelize.literal('MONTH FROM date'));
        } else {
            // Default to MySQL
            monthAttr = [fn('MONTHNAME', col('date')), 'month'];
            groupBy = fn('MONTHNAME', col('date'));
            orderBy = fn('MONTH', col('date'));
        }

        // Build date filter
        const dateFilter = { userId: req.user.id };
        if (req.query.dateFrom || req.query.dateTo) {
            dateFilter.date = {};
            if (req.query.dateFrom) dateFilter.date[Op.gte] = new Date(req.query.dateFrom);
            if (req.query.dateTo) {
                const end = new Date(req.query.dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter.date[Op.lte] = end;
            }
        }

        const report = await Expense.findAll({
            where: dateFilter,
            attributes: [
                monthAttr,
                [fn('SUM', col('amount')), 'total']
            ],
            group: [groupBy],
            order: [[orderBy, 'ASC']]
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminSummary = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const totalCompanySpend = await Expense.sum('amount', { where: { status: 'approved' } }) || 0;
        const pendingCount = await Expense.count({ where: { status: 'pending' } });
        const companyCategoryData = await Expense.findAll({
            attributes: [
                ['category', '_id'],
                [fn('SUM', col('amount')), 'total']
            ],
            group: ['category']
        });

        res.json({
            totalCompanySpend,
            pendingCount,
            companyCategoryData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const exportExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: { userId: req.user.id },
            order: [['date', 'DESC']]
        });
        const csvHeader = 'Date,Title,Category,Amount,Currency,Status\n';
        const csvRows = expenses.map(exp => {
            return `${new Date(exp.date).toLocaleDateString()},"${exp.title.replace(/"/g, '""')}",${exp.category},${exp.amount},${exp.currency || 'USD'},${exp.status}`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');
        res.status(200).send(csvHeader + csvRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBudgetComparison = async (req, res) => {
    try {
        const budgets = await Budget.findAll({ where: { userId: req.user.id } });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const spending = await Expense.findAll({
            where: {
                userId: req.user.id,
                date: { [Op.gte]: startOfMonth },
                status: { [Op.ne]: 'rejected' }
            },
            attributes: [
                ['category', '_id'],
                [fn('SUM', col('amount')), 'total']
            ],
            group: ['category']
        });

        const spendingMap = {};
        spending.forEach(s => {
            spendingMap[s.getDataValue('_id')] = parseFloat(s.getDataValue('total'));
        });

        const comparison = budgets.map(b => ({
            category: b.category,
            budgetAmount: parseFloat(b.amount),
            actualSpent: spendingMap[b.category] || 0,
            percentage: ((spendingMap[b.category] || 0) / parseFloat(b.amount) * 100).toFixed(1)
        }));

        res.json(comparison);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCategoryReport, getMonthlyReport, getAdminSummary, exportExpenses, getBudgetComparison };
