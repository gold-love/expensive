const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    serialNumber: {
        type: DataTypes.STRING,
        unique: true,
    },
    purchaseDate: {
        type: DataTypes.DATE,
    },
    purchasePrice: {
        type: DataTypes.DECIMAL(15, 2),
    },
    assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
    }
});

module.exports = Asset;
