const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
    },
    session: {
        type: String,
        enum: ['Morning', 'Afternoon'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        default: 'Present',
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    }
}, { timestamps: true });

// Ensure a student has only one record per date and session
attendanceSchema.index({ student: 1, date: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
