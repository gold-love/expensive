const { sequelize } = require('./backend/config/db');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Expenses';");
        console.log('Expense Table Columns:');
        results.forEach(c => {
            console.log(`- ${c.column_name} (${c.data_type})`);
        });

        const [budgetResults] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Budgets';");
        console.log('\nBudget Table Columns:');
        budgetResults.forEach(c => {
            console.log(`- ${c.column_name} (${c.data_type})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
