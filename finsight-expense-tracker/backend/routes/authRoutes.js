const express = require('express');
const {
    registerUser,
    loginUser,
    verify2FALogin,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserRole,
    deleteUser,
    updateProfilePicture
} = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-2fa', verify2FALogin);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/profile-picture', protect, (req, res, next) => {
    upload.single('profile')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            return res.status(500).json({ message: `Upload error: ${err.message}` });
        }
        next();
    });
}, updateProfilePicture);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);


// Admin only routes
router.get('/users', protect, getAllUsers);
router.put('/users/:id/role', protect, updateUserRole);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;

