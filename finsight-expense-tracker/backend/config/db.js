const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL Configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'finsight_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');

        // Load all models and their relationships
        require('../models');

        // Sync models (use { alter: true } in development, { force: false } in production)
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });

        console.log('Database synced');

    } catch (error) {
        console.error('Error connecting to PostgreSQL Database:', error);
        console.error('Make sure PostgreSQL is running and credentials are correct');
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };


