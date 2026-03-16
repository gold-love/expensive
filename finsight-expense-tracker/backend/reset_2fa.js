const { sequelize } = require('./config/db');
const User = require('./models/User');

const reset2FA = async (email) => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database...');

        // Load models
        require('./models');

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current 2FA status: ${user.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`);

        // Reset 2FA
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        console.log('\n✅ 2FA has been RESET for this user');
        console.log('You can now enable 2FA again from Settings > Security');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Get email from command line or use default
const email = process.argv[2] || 'admin@finsight.com';

console.log(`\n🔄 Resetting 2FA for: ${email}\n`);
reset2FA(email);
