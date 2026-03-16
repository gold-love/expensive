const User = require('./User');
const Expense = require('./Expense');
const Budget = require('./Budget');
const Organization = require('./Organization');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const Project = require('./Project');
const Vendor = require('./Vendor');
const Asset = require('./Asset');

// Define all relationships in one place to avoid circular dependencies

// Organization relationships
Organization.hasMany(User, { foreignKey: 'organizationId', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Expense, { foreignKey: 'organizationId' });
Expense.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Project, { foreignKey: 'organizationId' });
Project.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Vendor, { foreignKey: 'organizationId' });
Vendor.belongsTo(Organization, { foreignKey: 'organizationId' });

Organization.hasMany(Asset, { foreignKey: 'organizationId' });
Asset.belongsTo(Organization, { foreignKey: 'organizationId' });

// User relationships
User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Asset, { foreignKey: 'assignedTo' });
Asset.belongsTo(User, { foreignKey: 'assignedTo' });

// Multi-level approval (User reports to Manager)
User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' });

// Expense relationships
Project.hasMany(Expense, { foreignKey: 'projectId' });
Expense.belongsTo(Project, { foreignKey: 'projectId' });

Vendor.hasMany(Expense, { foreignKey: 'vendorId' });
Expense.belongsTo(Vendor, { foreignKey: 'vendorId' });

// Audit relationships
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });
Organization.hasMany(AuditLog, { foreignKey: 'organizationId' });
AuditLog.belongsTo(Organization, { foreignKey: 'organizationId' });

// Notification relationships
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Expense,
    Budget,
    Organization,
    AuditLog,
    Notification,
    Project,
    Vendor,
    Asset
};
