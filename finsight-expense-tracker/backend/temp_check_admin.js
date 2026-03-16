const { sequelize } = require('./config/db');
const User = require('./models/User');

async function checkAdmins() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'name']
        });

        console.log('--- USER LIST ---');
        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            users.forEach(u => {
                console.log(`Email: ${u.email} | Role: ${u.role} | Name: ${u.name}`);
            });
        }
        console.log('-----------------');

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await sequelize.close();
    }
}

checkAdmins();
