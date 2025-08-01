const { validationResult } = require('express-validator');
const { Driver } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get current driver status
exports.getDriverStatus = async (req, res, next) => {
  try {
    // Since we're using role-based auth, req.user should already be the driver
    const driver = req.user;

    // Double-check that this is actually a driver
    if (req.user.role !== 'driver') {
      return next(new AppError('Only drivers can access this endpoint', 403));
    }

    // If we need fresh data, query the driver
    const currentDriver = await Driver.findByPk(driver.id, {
      attributes: ['id', 'availability_status', 'name', 'vehicleType']
    });

    if (!currentDriver) {
      return next(new AppError('Driver not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        status: currentDriver.availability_status,
        driver: {
          id: currentDriver.id,
          name: currentDriver.name,
          vehicleType: currentDriver.vehicleType
        }
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

    // Double-check that this is actually a driver
    if (req.user.role !== 'driver') {
      return next(new AppError('Only drivers can update availability status', 403));
    }

    // Find the driver
    const driver = await Driver.findByPk(req.user.id);

    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Update availability status
    await driver.update({ availability_status: status });

    logger.info(`Driver ${driver.id} updated status to: ${status}`);

    res.status(200).json({
      success: true,
      message: 'Driver status updated successfully',
      data: {
        status: status,
        driver: {
          id: driver.id,
          name: driver.name,
          availability_status: driver.availability_status
        }
      }
    });
  } catch (error) {
    logger.error(`Error updating driver status: ${error.message}`);
    next(error);
  }
};