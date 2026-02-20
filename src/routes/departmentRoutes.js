const express = require('express');
const router = express.Router();
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes in this file

router.route('/')
    .get(getDepartments)
    .post(createDepartment);

router.route('/:id')
    .get(getDepartmentById)
    .put(updateDepartment)
    .delete(deleteDepartment);

module.exports = router;
