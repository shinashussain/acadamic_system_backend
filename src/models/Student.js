const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    admissionNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    batch: {
        type: String, // e.g., "2023-2027" or just "2023"
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
