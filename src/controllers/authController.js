const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide email and password');
        }

        // Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid credentials');
        }

        // Generate JWT
        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            role: 'admin',
            admin: {
                id: admin._id,
                email: admin.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
};
