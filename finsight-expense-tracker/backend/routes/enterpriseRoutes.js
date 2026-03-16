const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getProjects, createProject,
    getVendors, createVendor,
    getAssets, createAsset
} = require('../controllers/enterpriseController');

const router = express.Router();

router.route('/projects').get(protect, getProjects).post(protect, createProject);
router.route('/vendors').get(protect, getVendors).post(protect, createVendor);
router.route('/assets').get(protect, getAssets).post(protect, createAsset);

module.exports = router;
