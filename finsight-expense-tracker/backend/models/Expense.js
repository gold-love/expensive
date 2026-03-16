const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    description: {
        type: DataTypes.TEXT,
    },
    receiptUrl: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
    },
    isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    recurringInterval: {
        type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
        allowNull: true,
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    approvalNote: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    projectId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
    },
    taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    reimbursementStatus: {
        type: DataTypes.ENUM('not_required', 'pending', 'paid'),
        defaultValue: 'not_required',
    }
});

module.exports = Expense;
