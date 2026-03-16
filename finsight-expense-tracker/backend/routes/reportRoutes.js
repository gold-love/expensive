const express = require('express');
const { getCategoryReport, getMonthlyReport, getAdminSummary, exportExpenses, getBudgetComparison } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/category', protect, getCategoryReport);
router.get('/monthly', protect, getMonthlyReport);
router.get('/admin-summary', protect, getAdminSummary);
router.get('/export', protect, exportExpenses);
router.get('/budget-comparison', protect, getBudgetComparison);

module.exports = router;
