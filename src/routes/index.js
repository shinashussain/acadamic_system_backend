const express = require('express');
const router = express.Router();

// Define routes here
router.use('/auth', require('./authRoutes'));
router.use('/teachers', require('./teacherRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/exams', require('./examRoutes'));
router.use('/parent', require('./parentRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
