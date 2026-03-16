const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    enable2FA,
    verify2FA,
    disable2FA,
    updateNotificationPreferences,
    updateAdvancedPreferences,
    clearAllData,
    updateOrganizationSettings,
    getOrganizationSettings,
    get2FAQR
} = require('../controllers/settingsController');
const { getAuditLogs } = require('../controllers/auditController');

const router = express.Router();

// Two-Factor Authentication Routes
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/qr', protect, get2FAQR);

// Notification Preferences
router.put('/notifications', protect, updateNotificationPreferences);

// Advanced Preferences (Fiscal Year, Defaults)
router.put('/preferences', protect, updateAdvancedPreferences);

// Audit Logs (Admin only)
router.get('/audit-logs', protect, getAuditLogs);

// Clear All Data
router.delete('/clear-data', protect, clearAllData);

// Organization Settings (Admin only)
router.get('/organization', protect, getOrganizationSettings);
router.put('/organization', protect, updateOrganizationSettings);

module.exports = router;
