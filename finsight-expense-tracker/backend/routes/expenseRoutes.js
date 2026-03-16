const express = require('express');
const { getExpenses, createExpense, deleteExpense, updateExpense, deleteAllExpenses } = require('../controllers/expenseController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const { scanReceipt } = require('../controllers/ocrController');

const router = express.Router();



router.route('/').get(protect, getExpenses).post(protect, upload.single('receipt'), createExpense);
router.post('/scan', protect, upload.single('receipt'), scanReceipt);
router.delete('/clear-all', protect, deleteAllExpenses);

router.route('/:id')
    .put(protect, upload.single('receipt'), updateExpense)
    .delete(protect, deleteExpense);

module.exports = router;
