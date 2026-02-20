const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an exam name'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please provide an exam date']
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please provide total marks']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    time: {
        type: String,
        required: [true, 'Please provide an exam time']
    },
    description: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
