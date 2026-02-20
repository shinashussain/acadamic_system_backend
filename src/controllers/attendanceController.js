const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc    Mark attendance for multiple students
// @route   POST /api/attendance
// @access  Private (Teacher)
const markAttendance = async (req, res, next) => {
    try {
        const { date, session, students } = req.body;
        // students is an array of { studentId, status }

        if (!date || !session || !students || !Array.isArray(students)) {
            res.status(400);
            throw new Error('Please provide date, session, and a list of students');
        }

        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const operations = students.map(item => {
            return {
                updateOne: {
                    filter: {
                        student: item.studentId,
                        date: date,
                        session: session
                    },
                    update: {
                        status: item.status,
                        markedBy: teacherId,
                        department: teacher.department
                    },
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            await Attendance.bulkWrite(operations);
        }

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            count: operations.length
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance for a specific date and session
// @route   GET /api/attendance
// @access  Private (Teacher)
const getAttendance = async (req, res, next) => {
    try {
        const { date, session } = req.query;

        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        let query = { department: teacher.department };
        if (date) query.date = date;
        if (session) query.session = session;

        const attendance = await Attendance.find(query)
            .populate('student', 'name admissionNumber')
            .sort({ date: -1, session: 1 }); // Sort by date descending

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get distinct dates with attendance
// @route   GET /api/attendance/dates
// @access  Private (Teacher)
const getAttendanceDates = async (req, res, next) => {
    try {
        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const dates = await Attendance.aggregate([
            { $match: { department: teacher.department } },
            {
                $group: {
                    _id: "$date",
                    sessions: { $addToSet: "$session" },
                    count: { $sum: 1 } // Optional: count students marked
                }
            },
            { $sort: { "_id": -1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    sessions: 1,
                    count: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: dates
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance statistics (Today's counts + Weekly Trend)
// @route   GET /api/attendance/stats
// @access  Private (Teacher)
const getAttendanceStats = async (req, res, next) => {
    try {
        const teacherId = req.user.id;
        const teacher = await Teacher.findById(teacherId);

        if (!teacher || !teacher.department) {
            res.status(400);
            throw new Error('Teacher must belong to a department');
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Today's Stats
        const todayStats = await Attendance.aggregate([
            {
                $match: {
                    department: teacher.department,
                    date: today
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            Present: 0,
            Absent: 0,
            Late: 0,
            Excused: 0
        };

        todayStats.forEach(stat => {
            if (summary[stat._id] !== undefined) {
                summary[stat._id] = stat.count;
            }
        });

        // 2. Weekly Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const trendData = await Attendance.aggregate([
            {
                $match: {
                    department: teacher.department,
                    date: { $gte: sevenDaysAgoStr, $lte: today }
                }
            },
            {
                $group: {
                    _id: { date: "$date", status: "$status" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    statuses: { $push: { status: "$_id.status", count: "$count" } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const trend = trendData.map(day => {
            const dayStats = { date: day._id, Present: 0, Absent: 0, Late: 0 };
            day.statuses.forEach(s => {
                if (dayStats[s.status] !== undefined) {
                    dayStats[s.status] = s.count;
                }
            });
            return dayStats;
        });

        res.status(200).json({
            success: true,
            data: {
                summary,
                trend
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get attendance records for a specific student
const getStudentAttendance = async (req, res) => {
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

        // Fetch all attendance records for this student
        const attendanceRecords = await Attendance.find(query)
            .populate('student', 'name admissionNumber')
            .sort({ date: -1 });

        // Calculate summary statistics
        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'Late').length;
        const attendancePercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                records: attendanceRecords,
                summary: {
                    total: totalRecords,
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    percentage: parseFloat(attendancePercentage)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student attendance records'
        });
    }
};

module.exports = {
    markAttendance,
    getAttendance,
    getAttendanceDates,
    getAttendanceStats,
    getStudentAttendance
};
