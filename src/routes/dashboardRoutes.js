const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/admin/stats', getAdminStats);

module.exports = router;
