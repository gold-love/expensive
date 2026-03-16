const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const sendEmail = require('../utils/sendEmail');

    if (!email) {
        return res.status(400).json({ message: 'Please provide an email address' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'No account found with that email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to user
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                message: `You have requested a password reset. Please go to this link to reset your password: ${resetUrl}`,
                html: message
            });

            res.json({
                message: 'Email sent successfully. Please check your inbox.',
                // In development, also return the link for convenience
                resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);

            // If email fails, we still want to allow testing in development
            if (process.env.NODE_ENV === 'development') {
                return res.status(200).json({
                    message: 'Email failed (Invalid Credentials), but here is the link for testing:',
                    resetUrl: resetUrl
                });
            }

            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent', error: emailError.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const resetPassword = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token has expired
        if (user.resetPasswordExpire < new Date()) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.json({
            message: 'Password reset successful',
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { forgotPassword, resetPassword };
