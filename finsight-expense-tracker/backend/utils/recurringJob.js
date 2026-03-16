const cron = require('node-cron');
const Expense = require('../models/Expense');
const { Op } = require('sequelize');
const logger = require('./logger');

const processRecurringExpenses = async () => {
    logger.info('Running daily check for recurring expenses...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all recurring expenses that should be duplicated today
        // For simplicity in this version, we look for expenses whose "date" matches the interval pattern relative to today
        const recurringExpenses = await Expense.findAll({
            where: {
                isRecurring: true,
                status: 'approved' // Only repeat approved valid expenses
            }
        });

        for (const expense of recurringExpenses) {
            const expDate = new Date(expense.date);
            let shouldDuplicate = false;

            // Check if today is the day to repeat based on interval
            if (expense.recurringInterval === 'monthly') {
                if (today.getDate() === expDate.getDate()) shouldDuplicate = true;
            } else if (expense.recurringInterval === 'weekly') {
                if (today.getDay() === expDate.getDay()) shouldDuplicate = true;
            } else if (expense.recurringInterval === 'yearly') {
                if (today.getDate() === expDate.getDate() && today.getMonth() === expDate.getMonth()) shouldDuplicate = true;
            }

            if (shouldDuplicate) {
                // Check if we already created one for today to avoid duplicates if cron runs twice
                const exists = await Expense.findOne({
                    where: {
                        userId: expense.userId,
                        title: expense.title,
                        date: today
                    }
                });

                if (!exists) {
                    await Expense.create({
                        userId: expense.userId,
                        title: expense.title,
                        amount: expense.amount,
                        category: expense.category,
                        description: `[Recurring] ${expense.description || ''}`,
                        currency: expense.currency,
                        date: today,
                        status: 'pending', // New ones start as pending
                        isRecurring: true,
                        recurringInterval: expense.recurringInterval
                    });
                    logger.info(`Created recurring expense: ${expense.title} for user ${expense.userId}`);
                }
            }
        }
    } catch (error) {
        logger.error('Error processing recurring expenses:', error);
    }
};

// Run every day at midnight (00:00)
const initRecurringJobs = () => {
    cron.schedule('0 0 * * *', processRecurringExpenses);
    logger.info('Recurring expense scheduler initialized');

    // Optional: Run once on startup to catch up if server was down at midnight
    processRecurringExpenses();
};

module.exports = { initRecurringJobs };
