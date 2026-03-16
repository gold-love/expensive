const express = require('express');
const {
    getPendingExpenses,
    approveExpense,
    rejectExpense,
    getAllExpenses,
    getPendingBudgets,
    approveBudget,
    rejectBudget
} = require('../controllers/approvalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/pending', protect, getPendingExpenses);
router.get('/all', protect, getAllExpenses);
router.get('/budgets/pending', protect, getPendingBudgets);
router.put('/:id/approve', protect, approveExpense);
router.put('/:id/reject', protect, rejectExpense);
router.put('/budgets/:id/approve', protect, approveBudget);
router.put('/budgets/:id/reject', protect, rejectBudget);

module.exports = router;
