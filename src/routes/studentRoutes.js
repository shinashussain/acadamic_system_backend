const express = require('express');
const router = express.Router();
const {
    createStudent,
    getStudents,
    getStudentById,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all student routes

router.route('/')
    .post(createStudent)
    .get(getStudents);

router.route('/:id')
    .get(getStudentById);

module.exports = router;
