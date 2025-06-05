const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get current driver status
exports.getDriverStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'availability_status', 'role']
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user is a driver
    if (user.role !== 'driver') {
      return next(new AppError('Only drivers can access this endpoint', 403));
    }

    res.status(200).json({
      success: true,
      data: {
        status: user.availability_status
      }
    });
  } catch (error) {
    logger.error(`Error getting driver status: ${error.message}`);
    next(error);
  }
};

// Update driver status
exports.updateDriverStatus = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { status } = req.body;

    // Find the user
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user is a driver
    if (user.role !== 'driver') {
      return next(new AppError('Only drivers can update availability status', 403));
    }

    // Update availability status
    await user.update({ availability_status: status });

    logger.info(`Driver ${user.id} updated status to: ${status}`);

    res.status(200).json({
      success: true,
      message: 'Driver status updated successfully',
      data: {
        status: status
      }
    });
  } catch (error) {
    logger.error(`Error updating driver status: ${error.message}`);
    next(error);
  }
};