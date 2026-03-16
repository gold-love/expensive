const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        console.log('Connecting to database...');
        // Force authentication and sync to ensure table exists
        await sequelize.authenticate();
        await sequelize.sync();

        const adminEmail = 'gold@gmail.com';
        const adminPassword = 'gold1234'; // CHANGE THIS AFTER LOGIN

        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('Admin user already exists.');
        } else {
            // Note: The User model has a beforeCreate hook that hashes the password
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log('-----------------------------------');
            console.log('ADMIN USER CREATED SUCCESSFULLY');
            console.log('Email: ' + adminEmail);
            console.log('Password: ' + adminPassword);
            console.log('-----------------------------------');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        process.exit();
    }
}

createAdmin();
