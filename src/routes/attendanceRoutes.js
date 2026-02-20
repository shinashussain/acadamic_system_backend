const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getAttendanceDates, getAttendanceStats, getStudentAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dates', getAttendanceDates);
router.get('/stats', getAttendanceStats);
router.get('/student/:studentId', getStudentAttendance);
router.route('/')
    .post(markAttendance)
    .get(getAttendance);

module.exports = router;
