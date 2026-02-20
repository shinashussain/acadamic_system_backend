const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');

// @desc    Get public student report (Student Info + Attendance + Performance)
// @route   GET /api/parent/student/:id
// @access  Public
const getStudentReport = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Fetch Student Details
        const student = await Student.findById(id).populate('department', 'name code');

        if (!student) {
            res.status(404);
            throw new Error('Student not found');
        }

        // 2. Fetch Attendance Records and Summary
        const attendanceRecords = await Attendance.find({ student: id })
            .sort({ date: -1 });

        const totalAttRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'Late').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
        const attendancePercentage = totalAttRecords > 0
            ? ((presentCount + lateCount) / totalAttRecords * 100).toFixed(1)
            : 0;

        const attendanceData = {
            records: attendanceRecords,
            summary: {
                total: totalAttRecords,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                percentage: parseFloat(attendancePercentage)
            }
        };

        // 3. Fetch Exam Results and Summary
        const examResults = await Result.find({ student: id })
            .populate('exam', 'name date totalMarks session')
            .sort({ 'exam.date': -1 });

        const totalExams = examResults.length;
        const totalMarksObtained = examResults.reduce((sum, r) => sum + r.marksObtained, 0);
        const totalPossibleMarks = examResults.reduce((sum, r) => sum + (r.exam?.totalMarks || 0), 0);
        const overallPercentage = totalPossibleMarks > 0
            ? ((totalMarksObtained / totalPossibleMarks) * 100).toFixed(1)
            : 0;

        const performanceData = {
            results: examResults,
            summary: {
                totalExams,
                totalMarksObtained,
                totalPossibleMarks,
                overallPercentage: parseFloat(overallPercentage)
            }
        };

        // 4. Construct Final Response
        res.status(200).json({
            success: true,
            data: {
                student: {
                    _id: student._id,
                    name: student.name,
                    admissionNumber: student.admissionNumber,
                    department: student.department,
                    batch: student.batch,
                    // Exclude sensitive contact info if desired, but inclusion requested "without any other authentication" implies full view
                    email: student.email,
                },
                attendance: attendanceData,
                performance: performanceData
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudentReport
};
