const express = require('express');
const router = express.Router();
const { getStudentReport } = require('../controllers/parentController');

// Public route for parent to view student report
router.get('/student/:id', getStudentReport);

module.exports = router;
