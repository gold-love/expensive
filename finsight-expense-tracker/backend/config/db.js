const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Sequelize for PostgreSQL using DATABASE_URL
console.log("db link:", process.env.DATABASE_URL)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: (process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')))
            ? {
                require: true,
                rejectUnauthorized: false,
            }
            : false,
    },
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Sequelize ORM connected to PostgreSQL...');

        // Load Sequelize models/relationships if present
        try {
            require('../models');
        } catch (e) {
            console.warn('Warning loading Sequelize models:', e.message);
        }

        // Sync database schema
        await sequelize.sync();
        console.log('Database synced');
        return true;
    } catch (error) {
        console.error('Error connecting to PostgreSQL Database:', error);
        return false;
    }
};

module.exports = { connectDB, sequelize };