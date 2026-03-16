const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const logAudit = async ({ req, action, targetType, targetId, details }) => {
    try {
        await AuditLog.create({
            userId: req.user.id,
            organizationId: req.user.organizationId,
            action,
            targetType,
            targetId,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
    } catch (error) {
        logger.error('Audit Logging Failed:', error);
    }
};

module.exports = { logAudit };
