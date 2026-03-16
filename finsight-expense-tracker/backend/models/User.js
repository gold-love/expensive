const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('employee', 'admin'),
        defaultValue: 'employee',
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null initially for backward compatibility or individual users
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordExpire: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    newsletter: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    theme: {
        type: DataTypes.STRING,
        defaultValue: 'light',
    },
    preferredCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
    },
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Granular Notification Preferences
    notificationPreferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            budgetAlerts: true,
            expenseApproved: true,
            expenseRejected: true,
            weeklyReport: false,
            monthlyReport: true
        }
    },
    // Fiscal Year Settings
    fiscalYearStart: {
        type: DataTypes.INTEGER, // Month number (1-12)
        defaultValue: 1, // January
    },
    // Default Settings for Quick Entry
    defaultCategory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    defaultBudgetCategory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    defaultCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    managerId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    bankAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Brute-force protection
    loginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {


    hooks: {
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
