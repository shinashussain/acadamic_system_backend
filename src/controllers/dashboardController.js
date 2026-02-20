const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Department = require('../models/Department');

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
    try {
        const teacherCount = await Teacher.countDocuments();
        const studentCount = await Student.countDocuments();
        const departmentCount = await Department.countDocuments();

        // 1. Attendance Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const attendanceTrend = await require('../models/Attendance').aggregate([
            {
                $match: {
                    date: { $gte: sevenDaysAgo.toISOString().split('T')[0] },
                    status: 'Present'
                }
            },
            {
                $group: {
                    _id: "$date",
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const formattedTrend = attendanceTrend.map(item => ({
            date: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
            present: item.count
        }));

        // 2. Department Performance (Average Marks)
        const deptPerformance = await require('../models/Result').aggregate([
            {
                $group: {
                    _id: "$department",
                    avgScore: { $avg: "$marksObtained" } // Simple avg of raw marks for now, ideally percentage
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
                    foreignField: "_id",
                    as: "deptParams"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$deptParams.name", 0] },
                    avgScore: { $round: ["$avgScore", 1] }
                }
            }
        ]);

        // 3. Today's Department-wise Attendance
        const today = new Date().toISOString().split('T')[0];
        const deptAttendance = await require('../models/Attendance').aggregate([
            {
                $match: {
                    date: today,
                    status: 'Present'
                }
            },
            {
                $group: {
                    _id: "$department",
                    presentCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
                    foreignField: "_id",
                    as: "deptInfo"
                }
            },
            {
                $project: {
                    name: { $arrayElemAt: ["$deptInfo.name", 0] },
                    presentCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                counts: {
                    teachers: teacherCount,
                    students: studentCount,
                    departments: departmentCount
                },
                charts: {
                    attendance: formattedTrend,
                    performance: deptPerformance,
                    deptAttendance: deptAttendance
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdminStats
};
