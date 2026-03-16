const User = require('../models/User');
const { generate2FASecret, verify2FAToken, generateQRCode } = require('../utils/twoFactor');

// @desc    Enable Two-Factor Authentication
// @route   POST /api/settings/2fa/enable
// @access  Private
const enable2FA = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user.twoFactorEnabled) {
            return res.status(400).json({ message: '2FA is already enabled' });
        }

        const { secret, qrcode } = await generate2FASecret(user.email);

        // Don't activate yet - wait for user to verify with first code
        user.twoFactorSecret = secret;
        await user.save();

        res.json({
            message: 'Scan this QR code with your authenticator app',
            qrcode,
            secret // Also send text secret for manual entry
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify and Activate 2FA
// @route   POST /api/settings/2fa/verify
// @access  Private
const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: 'Please enable 2FA first' });
        }

        const isValid = verify2FAToken(user.twoFactorSecret, token);

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.twoFactorEnabled = true;
        await user.save();

        res.json({ message: '2FA successfully enabled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Disable Two-Factor Authentication
// @route   POST /api/settings/2fa/disable
// @access  Private
const disable2FA = async (req, res) => {
    try {
        const { password, token } = req.body;
        const user = await User.findByPk(req.user.id);

        // Verify password
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Verify 2FA token
        const isValid = verify2FAToken(user.twoFactorSecret, token);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid 2FA code' });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const get2FAQR = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA not active' });
        }
        const qrcode = await generateQRCode(user.twoFactorSecret, user.email);
        res.json({ qrcode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Notification Preferences
// @route   PUT /api/settings/notifications
// @access  Private
const updateNotificationPreferences = async (req, res) => {
    try {
        const { budgetAlerts, expenseApproved, expenseRejected, weeklyReport, monthlyReport } = req.body;

        const user = await User.findByPk(req.user.id);

        user.notificationPreferences = {
            budgetAlerts: budgetAlerts !== undefined ? budgetAlerts : user.notificationPreferences.budgetAlerts,
            expenseApproved: expenseApproved !== undefined ? expenseApproved : user.notificationPreferences.expenseApproved,
            expenseRejected: expenseRejected !== undefined ? expenseRejected : user.notificationPreferences.expenseRejected,
            weeklyReport: weeklyReport !== undefined ? weeklyReport : user.notificationPreferences.weeklyReport,
            monthlyReport: monthlyReport !== undefined ? monthlyReport : user.notificationPreferences.monthlyReport
        };

        await user.save();

        res.json({
            message: 'Notification preferences updated',
            preferences: user.notificationPreferences
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Fiscal Year and Defaults
// @route   PUT /api/settings/preferences
// @access  Private
const updateAdvancedPreferences = async (req, res) => {
    try {
        const { fiscalYearStart, defaultCategory, defaultBudgetCategory, defaultCurrency } = req.body;

        const user = await User.findByPk(req.user.id);

        if (fiscalYearStart !== undefined) {
            if (fiscalYearStart < 1 || fiscalYearStart > 12) {
                return res.status(400).json({ message: 'Fiscal year start must be between 1-12' });
            }
            user.fiscalYearStart = fiscalYearStart;
        }

        if (defaultCategory !== undefined) user.defaultCategory = defaultCategory;
        if (defaultBudgetCategory !== undefined) user.defaultBudgetCategory = defaultBudgetCategory;
        if (defaultCurrency !== undefined) user.defaultCurrency = defaultCurrency;

        await user.save();

        res.json({
            message: 'Preferences updated successfully',
            fiscalYearStart: user.fiscalYearStart,
            defaultCategory: user.defaultCategory,
            defaultBudgetCategory: user.defaultBudgetCategory,
            defaultCurrency: user.defaultCurrency
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const clearAllData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete Expenses
        const Expense = require('../models/Expense');
        await Expense.destroy({ where: { userId } });

        // Delete Budgets
        const Budget = require('../models/Budget');
        await Budget.destroy({ where: { userId } });

        res.json({ message: 'All your data has been cleared successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateOrganizationSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update organization settings' });
        }

        const Organization = require('../models/Organization');
        const org = await Organization.findByPk(req.user.organizationId);

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        org.settings = {
            ...org.settings,
            ...req.body
        };

        await org.save();
        res.json({ message: 'Organization settings updated', settings: org.settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOrganizationSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view organization settings' });
        }

        const Organization = require('../models/Organization');
        const org = await Organization.findByPk(req.user.organizationId);

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json({
            name: org.name,
            subscriptionPlan: org.subscriptionPlan,
            requireReceipts: org.settings.requireReceipts || false,
            autoApproveLimit: org.settings.autoApproveLimit || 0,
            autoApproveBudgetLimit: org.settings.autoApproveBudgetLimit || 0,
            expenseModuleEnabled: org.settings.expenseModuleEnabled !== undefined ? org.settings.expenseModuleEnabled : true,
            budgetModuleEnabled: org.settings.budgetModuleEnabled !== undefined ? org.settings.budgetModuleEnabled : true,
            allowMultiCurrency: org.settings.allowMultiCurrency !== undefined ? org.settings.allowMultiCurrency : true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    enable2FA,
    verify2FA,
    disable2FA,
    get2FAQR,
    updateNotificationPreferences,
    updateAdvancedPreferences,
    clearAllData,
    updateOrganizationSettings,
    getOrganizationSettings
};
