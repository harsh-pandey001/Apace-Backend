const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile (for logged in user)
exports.updateProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Prevent password update through this route
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /change-password.',
          400
        )
      );
    }

    // Restrict fields that can be updated
    const filteredBody = {};
    const allowedFields = ['firstName', 'lastName', 'email', 'phone'];
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        filteredBody[field] = req.body[field];
      }
    });

    // Check if email already exists if trying to change it
    if (filteredBody.email && filteredBody.email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email: filteredBody.email } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Update user document
    const updatedUser = await User.update(filteredBody, {
      where: { id: req.user.id },
      returning: true
    });

    // Fetch updated user
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    logger.info(`User updated profile: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin routes below

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Find all users excluding password
    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user (admin only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user (admin only)
exports.createUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Create user
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role || 'user'
    });

    // Remove password from response
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    logger.info(`Admin created new user: ${newUser.email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a user (admin only)
exports.updateUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Find user
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if email already exists if trying to change it
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Restrict fields that can be updated
    const filteredBody = {};
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'active'];
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        // Restrict role changes - only allow switching between 'user' and 'driver'
        if (field === 'role') {
          // If current role is 'admin', don't allow role change
          if (user.role === 'admin') {
            return next(new AppError('Cannot change role of admin users', 403));
          }
          
          // Only allow role to be 'user' or 'driver'
          if (!['user', 'driver'].includes(req.body.role)) {
            return next(new AppError('Role can only be changed to "user" or "driver"', 400));
          }
          
          filteredBody[field] = req.body.role;
        } else {
          filteredBody[field] = req.body[field];
        }
      }
    });

    // Update user
    await user.update(filteredBody);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info(`Admin updated user: ${user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user (admin only) - Soft delete
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Soft delete by setting active to false
    await user.update({ active: false });

    logger.info(`Admin soft-deleted user: ${user.email}`);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};