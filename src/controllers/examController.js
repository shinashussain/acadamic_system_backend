const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Teacher)
const createExam = async (req, res, next) => {
    try {
        const { name, date, totalMarks, description, time } = req.body;
        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const exam = await Exam.create({
            name,
            date,
            totalMarks,
            description,
            time,
            department: teacher.department,
            createdBy: teacherId
        });

        res.status(201).json({
            success: true,
            data: exam
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all exams for the teacher's department with stats
// @route   GET /api/exams
// @access  Private (Teacher)
const getExams = async (req, res, next) => {
    try {
        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const exams = await Exam.aggregate([
            { $match: { department: teacher.department } },
            {
                $lookup: {
                    from: 'results',
                    localField: '_id',
                    foreignField: 'exam',
                    as: 'results'
                }
            },
            {
                $addFields: {
                    average: { $avg: "$results.marksObtained" },
                    count: { $size: "$results" }
                }
            },
            {
                $project: {
                    results: 0 // Exclude raw results array to keep payload light
                }
            },
            { $sort: { date: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: exams
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get details of a single exam including marks stats
// @route   GET /api/exams/:id
// @access  Private (Teacher)
const getExamDetails = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            res.status(404);
            throw new Error('Exam not found');
        }

        // Aggregate stats
        const results = await Result.find({ exam: req.params.id });
        const count = results.length;
        const total = results.reduce((acc, curr) => acc + curr.marksObtained, 0);
        const average = count > 0 ? (total / count).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                ...exam.toObject(),
                stats: {
                    count,
                    average
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add or Update marks for students
// @route   POST /api/exams/:id/marks
// @access  Private (Teacher)
const addMarks = async (req, res, next) => {
    try {
        const { marks } = req.body; // Array of { studentId, marksObtained, feedback }
        const examId = req.params.id;
        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            res.status(404);
            throw new Error('Exam not found');
        }

        if (!marks || !Array.isArray(marks)) {
            res.status(400);
            throw new Error('Please provide a list of marks');
        }

        const operations = marks.map(item => {
            return {
                updateOne: {
                    filter: {
                        exam: examId,
                        student: item.studentId
                    },
                    update: {
                        marksObtained: item.marksObtained,
                        feedback: item.feedback,
                        department: teacher.department,
                        gradedBy: teacherId
                    },
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            await Result.bulkWrite(operations);
        }

        res.status(200).json({
            success: true,
            message: 'Marks updated successfully',
            count: operations.length
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all results for an exam
// @route   GET /api/exams/:id/results
// @access  Private (Teacher)
const getExamResults = async (req, res, next) => {
    try {
        const examId = req.params.id;
        const results = await Result.find({ exam: examId })
            .populate('student', 'name admissionNumber')
            .sort({ 'student.name': 1 }); // logic to sort by name might need aggregation if populating, but simple sort on result creation time otherwise if not supported directly on populated field in simple find. 
        // Better to sort client side or use aggregation for strict sorting by populated field. 
        // For now, let's just return results. 

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all exam results for a specific student
// @route   GET /api/exams/student/:studentId/results
// @access  Private (Teacher)
const getStudentResults = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        let query = { student: studentId };

        // If teacher, restrict to their department
        if (req.user.role === 'teacher') {
            const teacherId = req.user.id;
            const teacher = await Teacher.findById(teacherId);

            if (!teacher || !teacher.department) {
                res.status(400);
                throw new Error('Teacher must belong to a department');
            }
            query.department = teacher.department;
        }

        // Fetch all results for this student with exam details
        const results = await Result.find(query)
            .populate('exam', 'name date totalMarks time')
            .sort({ 'exam.date': -1 });

        // Calculate performance statistics
        const totalExams = results.length;
        const totalMarksObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
        const totalPossibleMarks = results.reduce((sum, r) => sum + (r.exam?.totalMarks || 0), 0);
        const overallPercentage = totalPossibleMarks > 0 ? ((totalMarksObtained / totalPossibleMarks) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                results: results,
                summary: {
                    totalExams,
                    totalMarksObtained,
                    totalPossibleMarks,
                    overallPercentage: parseFloat(overallPercentage)
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExam,
    getExams,
    getExamDetails,
    addMarks,
    getExamResults,
    getStudentResults
};
