const express = require('express');
const router = express.Router();
const {
    getTeachers,
    createTeacher,
    teacherLogin,
    deleteAllTeachers,
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', teacherLogin);

router.use(protect); // Ensure all other routes are protected

router.route('/')
    .get(getTeachers)
    .post(createTeacher)
    .delete(deleteAllTeachers);
    
module.exports = router;