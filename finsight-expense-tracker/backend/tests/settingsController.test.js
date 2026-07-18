const test = require('node:test');
const assert = require('node:assert/strict');
const settingsController = require('../controllers/settingsController');
const Organization = require('../models/Organization');
const UserModel = require('../models/User');

test('ensureOrganizationContext creates an organization for users without one', async () => {
    const originalCreate = Organization.create;
    const originalSave = UserModel.prototype.save;

    const user = {
        id: 'user-1',
        name: 'Demo User',
        organizationId: null,
        save: async function () {
            this.saved = true;
            return this;
        }
    };

    let createdPayload = null;

    Organization.create = async (payload) => {
        createdPayload = payload;
        return { id: 'org-1' };
    };

    try {
        const organizationId = await settingsController.ensureOrganizationContext({ user }, user);

        assert.equal(organizationId, 'org-1');
        assert.equal(user.organizationId, 'org-1');
        assert.equal(createdPayload.name, 'Demo User\'s Organization');
        assert.deepEqual(createdPayload.settings, {});
    } finally {
        Organization.create = originalCreate;
        UserModel.prototype.save = originalSave;
    }
});
