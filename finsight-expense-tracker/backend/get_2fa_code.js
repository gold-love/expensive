const speakeasy = require('speakeasy');
const { sequelize } = require('./config/db');
const User = require('./models/User');

const get2FACode = async (email) => {
    try {
        await sequelize.authenticate();

        // Load models
        require('./models');

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        if (!user.twoFactorEnabled) {
            console.log(`❌ 2FA is not enabled for ${user.name}`);
            console.log('Enable 2FA first from Settings > Security');
            process.exit(1);
        }

        if (!user.twoFactorSecret) {
            console.log(`❌ No 2FA secret found for ${user.name}`);
            console.log('Please re-enable 2FA');
            process.exit(1);
        }

        // Generate current code
        const token = speakeasy.totp({
            secret: user.twoFactorSecret,
            encoding: 'base32'
        });

        console.log(`\n✅ Current 2FA code for ${user.name} (${user.email}):`);
        console.log(`\n   ┌─────────┐`);
        console.log(`   │ ${token} │`);
        console.log(`   └─────────┘`);
        console.log(`\n⏱️  This code is valid for ~30 seconds\n`);

        // Show when next code will be generated
        const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
        console.log(`⏳ Next code in: ${remaining} seconds\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

const email = process.argv[2] || 'admin@finsight.com';
console.log(`\n🔐 Generating 2FA code for: ${email}`);
get2FACode(email);
