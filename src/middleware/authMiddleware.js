const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Handle different roles
            if (decoded.role === 'teacher') {
                req.teacher = await Teacher.findById(decoded.id).select('-password');
                if (!req.teacher) {
                    return res.status(401).json({ success: false, message: 'Not authorized, teacher not found' });
                }
                req.user = req.teacher;
                req.userRole = 'teacher';
            } else {
                // Default to admin or explicitly check admin role if added later
                req.admin = await Admin.findById(decoded.id).select('-password');
                if (!req.admin) {
                    return res.status(401).json({ success: false, message: 'Not authorized, admin not found' });
                }
                req.user = req.admin;
                req.userRole = 'admin';
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.userRole} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
