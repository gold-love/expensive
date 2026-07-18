const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { initRecurringJobs } = require('./utils/recurringJob');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
    // Initialize recurring jobs
    initRecurringJobs();
});

const app = express();

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow loading images from our own server
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development and heavy polling
    message: { message: 'Too many requests, please try again after 15 minutes' }
});
app.use(limiter);

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Root Route
app.get('/', (req, res) => {
    res.send('Finsight Expense Tracker API is running...');
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/plaid', require('./routes/plaidRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/enterprise', require('./routes/enterpriseRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5001);

app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
