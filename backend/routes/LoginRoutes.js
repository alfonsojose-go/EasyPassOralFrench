const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

// Register route
router.post('/register', registerUser);
// Login route
router.post('/login', loginUser);
router.get('/protected', protect, (req, res) => {
    res.json({ message: `Hello user ${req.user}, you have accessed a protected route!` });
});

module.exports = router;
