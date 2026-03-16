const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
    },
    budget: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'on_hold'),
        defaultValue: 'active',
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
    }
});

module.exports = Project;
