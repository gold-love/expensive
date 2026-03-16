const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vendor = sequelize.define('Vendor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
    },
    contactEmail: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true,
        },
    },
    taxId: {
        type: DataTypes.STRING,
    },
    organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
    }
});

module.exports = Vendor;
