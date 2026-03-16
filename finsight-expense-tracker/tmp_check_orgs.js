const { sequelize } = require('./backend/config/db');
const User = require('./backend/models/User');

async function checkUserOrgs() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['name', 'email', 'organizationId'] });
        console.log('User Organization IDs:');
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}): ${u.organizationId}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserOrgs();
