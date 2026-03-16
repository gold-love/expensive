const { sequelize } = require('./backend/config/db');
const Organization = require('./backend/models/Organization');

async function checkOrgs() {
    try {
        await sequelize.authenticate();
        const orgs = await Organization.findAll();
        console.log('Organizations in database:');
        orgs.forEach(o => {
            console.log(`- ${o.name} (${o.id}) Settings: ${JSON.stringify(o.settings)}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkOrgs();
