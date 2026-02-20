const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private/Admin
const getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find({});
        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res, next) => {
    try {
        const { name, code, description } = req.body;

        const department = await Department.create({
            name,
            code,
            description,
        });

        res.status(201).json({
            success: true,
            data: department,
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('Department with this name or code already exists'));
        }
        next(error);
    }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res, next) => {
    try {
        let department = await Department.findById(req.params.id);

        if (!department) {
            res.status(404);
            throw new Error('Department not found');
        }

        department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            res.status(404);
            throw new Error('Department not found');
        }

        await department.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private/Admin
const getDepartmentById = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            res.status(404);
            throw new Error('Department not found');
        }
        res.status(200).json({
            success: true,
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
