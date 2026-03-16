const { sequelize } = require('./backend/config/db');
const User = require('./backend/models/User');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        const users = await User.findAll({ attributes: ['name', 'email', 'role', 'twoFactorEnabled'] });
        console.log('Users in database:');
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [${u.role}] 2FA: ${u.twoFactorEnabled}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

checkUsers();
