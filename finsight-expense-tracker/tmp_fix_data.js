const { sequelize } = require('./backend/config/db');
const User = require('./backend/models/User');
const Organization = require('./backend/models/Organization');

async function fixData() {
    try {
        await sequelize.authenticate();

        // 1. Ensure a default organization exists
        let org = await Organization.findOne();
        if (!org) {
            org = await Organization.create({
                name: 'Default Organization',
                settings: {
                    requireReceipts: false,
                    autoApproveLimit: 50,
                    expenseModuleEnabled: true,
                    budgetModuleEnabled: true
                }
            });
            console.log('Created Default Organization');
        }

        // 2. Link all users with null organizationId to this org
        const [updatedCount] = await User.update(
            { organizationId: org.id },
            { where: { organizationId: null } }
        );
        console.log(`Updated ${updatedCount} users with missing organization ID`);

        // 3. Ensure all expenses and budgets have organizationId
        const [expCount] = await sequelize.query(`UPDATE "Expenses" SET "organizationId" = '${org.id}' WHERE "organizationId" IS NULL`);
        const [budCount] = await sequelize.query(`UPDATE "Budgets" SET "organizationId" = '${org.id}' WHERE "organizationId" IS NULL`);
        console.log('Updated existing expenses and budgets with organization ID');

        process.exit(0);
    } catch (error) {
        console.error('Fix Data Error:', error);
        process.exit(1);
    }
}

fixData();
