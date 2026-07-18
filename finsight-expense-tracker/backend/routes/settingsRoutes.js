const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
    enable2FA,
    verify2FA,
    disable2FA,
    updateNotificationPreferences,
    updateAdvancedPreferences,
    deleteAccount,
    exportUserData,
    updateOrganizationSettings,
    getOrganizationSettings,
    get2FAQR,
    revokeSessions,
    getActiveSessions,
    revokeSpecificSession,
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    inviteUser,
    exportOrganizationData,
    getApiKeys,
    createApiKey,
    revokeApiKey,
    restoreOrganizationData,
    verifyAdminCredentials,
} = require('../controllers/settingsController');
const { getAuditLogs, getMySecurityLogs } = require('../controllers/auditController');

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `org-logo-${req.user.organizationId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Two-Factor Authentication Routes
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/revoke-sessions', protect, revokeSessions);
router.get('/2fa/qr', protect, get2FAQR);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:id', protect, revokeSpecificSession);

// Notification Preferences
router.put('/notifications', protect, updateNotificationPreferences);

// Advanced Preferences (Fiscal Year, Defaults)
router.put('/preferences', protect, updateAdvancedPreferences);

// Audit Logs (Admin only)
router.get('/audit-logs', protect, getAuditLogs);

// Personal Security Logs
router.get('/security-logs', protect, getMySecurityLogs);

// Export and Delete
router.get('/export-data', protect, exportUserData);
router.post('/delete-account', protect, deleteAccount);

// Organization Settings (Admin only)
router.get('/organization', protect, getOrganizationSettings);
router.put('/organization', protect, updateOrganizationSettings);

// Team Management (Admin only)
router.get('/team', protect, getAllUsers);
router.put('/team/role', protect, updateUserRole);
router.put('/team/status', protect, toggleUserStatus);
router.post('/team/invite', protect, inviteUser);

// Organization Actions (Admin only)
router.get('/organization/export', protect, exportOrganizationData);
router.post('/organization/restore', protect, restoreOrganizationData);

// API Management
router.get('/api-keys', protect, getApiKeys);
router.post('/api-keys', protect, createApiKey);
router.delete('/api-keys/:id', protect, revokeApiKey);

// Organization Logo Upload
router.post('/organization/logo', protect, upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const normalizedPath = req.file.path.replace(/\\/g, '/');
    const baseUrl = process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://localhost:5001';
    res.json({ logoUrl: `${baseUrl}/${normalizedPath}` });
});

// Admin credential verification (any logged-in user can attempt)
router.post('/verify-admin', protect, verifyAdminCredentials);

module.exports = router;
