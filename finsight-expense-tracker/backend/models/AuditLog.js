const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    targetType: {
        type: DataTypes.STRING, // e.g., 'Expense', 'Budget', 'User'
        allowNull: false,
    },
    targetId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    details: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    ipAddress: {
        type: DataTypes.STRING,
    }
});

module.exports = AuditLog;
