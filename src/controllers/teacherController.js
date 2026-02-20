const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

// @desc    Create a new teacher
// @route   POST /api/teachers
// @access  Private/Admin
const createTeacher = async (req, res, next) => {
    try {
        const { name, email, password, department, designation, phoneNumber, address } = req.body;

        // Check if teacher already exists
        const teacherExists = await Teacher.findOne({ email });
        if (teacherExists) {
            res.status(400);
            throw new Error('Teacher already exists with this email');
        }

        const teacher = await Teacher.create({
            name,
            email,
            password: password || 'teacher123', // Default password if none provided
            department,
            designation,
            phoneNumber,
            address,
        });

        res.status(201).json({
            success: true,
            data: teacher,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Teacher Login
// @route   POST /api/teachers/login
// @access  Public
const teacherLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide email and password');
        }

        const teacher = await Teacher.findOne({ email }).populate('department');
        if (!teacher) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        const isMatch = await teacher.comparePassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { id: teacher._id, role: 'teacher' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department,
                designation: teacher.designation
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private/Admin
const getTeachers = async (req, res, next) => {
    try {
        const teachers = await Teacher.find({}).populate('department');
        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete all teachers
// @route   DELETE /api/teachers
// @access  Private/Admin
const deleteAllTeachers = async (req, res, next) => {
    try {
        await Teacher.deleteMany({});
        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTeacher,
    teacherLogin,
    getTeachers,
    deleteAllTeachers,
};
