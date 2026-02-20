const Student = require('../models/Student');

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Teacher/Admin)
const createStudent = async (req, res, next) => {
    try {
        if (req.userRole === 'teacher') {
            // Enforce teacher's department
            const teacher = await require('../models/Teacher').findById(req.user.id);
            if (!teacher || !teacher.department) {
                res.status(400);
                throw new Error('Teacher must belong to a department to add students');
            }
            req.body.department = teacher.department;
        }

        const { name, admissionNumber, email, batch, phoneNumber, address } = req.body;
        const department = req.body.department;

        // Check if student exists
        const studentExists = await Student.findOne({
            $or: [{ email }, { admissionNumber }]
        });

        if (studentExists) {
            res.status(400);
            throw new Error('Student already exists (check Email or Admission Number)');
        }

        const student = await Student.create({
            name,
            admissionNumber,
            email,
            department,
            batch,
            phoneNumber,
            address,
        });

        res.status(201).json({
            success: true,
            data: student,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Teacher/Admin)
const getStudents = async (req, res, next) => {
    try {
        let query = {};
        if (req.userRole === 'teacher') {
            const teacher = await require('../models/Teacher').findById(req.user.id);
            if (teacher && teacher.department) {
                query.department = teacher.department;
            }
        } else if (req.query.department) {
            query.department = req.query.department;
        }
        const students = await Student.find(query).populate('department');
        res.status(200).json({
            success: true,
            count: students.length,
            data: students,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private (Teacher/Admin)
const getStudentById = async (req, res, next) => {
    try {
        const id = req.params.id.trim();
        console.log(`[DEBUG] Fetching student with ID: '${id}'`);
        console.log(`[DEBUG] Request User: ${req.user.id}, Role: ${req.userRole}`);

        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`[DEBUG] Invalid ID format: ${id}`);
            res.status(400);
            throw new Error('Invalid student ID format');
        }

        // Find student first without populate to verify existence
        const student = await Student.findOne({ _id: id });

        if (!student) {
            console.log(`[DEBUG] Student not found with ID: ${id}`);
            res.status(404);
            throw new Error(`Student not found with ID: ${id}`);
        }

        // Populate department
        await student.populate('department');
        console.log(`[DEBUG] Student found: ${student.name}`);

        let studentDepId = 'NONE';
        if (student.department) {
            studentDepId = student.department._id.toString();
            console.log(`[DEBUG] Student Dept: ${student.department.name} (${studentDepId})`);
        } else {
            console.log(`[DEBUG] Student has NO department assigned`);
        }

        // If teacher, verify student is in their department
        if (req.userRole === 'teacher') {
            const teacher = await require('../models/Teacher').findById(req.user.id);
            if (!teacher) {
                console.log(`[DEBUG] Teacher record not found for ID: ${req.user.id}`);
                res.status(401);
                throw new Error('Teacher record not found');
            }

            console.log(`[DEBUG] Teacher found: ${teacher.name} (${teacher._id})`);

            if (teacher.department) {
                const teacherDepId = teacher.department.toString();
                console.log(`[DEBUG] Teacher Dept ID: ${teacherDepId}`);

                // If student has no department, we cannot verify match
                if (!student.department) {
                    console.log(`[DEBUG] Access Denied: Student has no department`);
                    res.status(404); // Keep 404 to avoid leaking
                    throw new Error(`Student ${id} has no department (Access Denied)`);
                }

                if (studentDepId !== teacherDepId) {
                    console.log(`[DEBUG] Access Denied: Department mismatch. Student: ${studentDepId}, Teacher: ${teacherDepId}`);
                    res.status(404); // Keep 404 to avoid leaking
                    throw new Error(`Student not found (Department Mismatch: S-${studentDepId} vs T-${teacherDepId})`);
                }
            } else {
                console.log(`[DEBUG] Teacher has no department! Cannot verify access.`);
                res.status(403);
                throw new Error('Configuration Error: You are not assigned to a department.');
            }
        }

        res.set('Cache-Control', 'no-store');
        res.status(200).json({
            success: true,
            data: student,
        });
    } catch (error) {
        console.error(`Error in getStudentById for ID ${req.params.id}:`, error.message);
        // Ensure status code is set
        if (res.statusCode === 200) res.status(500);
        next(error);
    }
};

module.exports = {
    createStudent,
    getStudents,
    getStudentById,
};
