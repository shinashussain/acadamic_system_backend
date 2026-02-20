const express = require('express');
const router = express.Router();
const {
    createExam,
    getExams,
    getExamDetails,
    addMarks,
    getExamResults,
    getStudentResults
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .post(createExam)
    .get(getExams);

router.get('/student/:studentId/results', getStudentResults);

router.route('/:id')
    .get(getExamDetails);

router.route('/:id/marks')
    .post(addMarks);

router.route('/:id/results')
    .get(getExamResults);

module.exports = router;
