const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Admin Login
router.post('/login', login);

module.exports = router;
