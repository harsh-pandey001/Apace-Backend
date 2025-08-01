const { validationResult } = require('express-validator');
const { UserPreferences } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get user preferences
exports.getUserPreferences = async (req, res, next) => {
  try {
    let preferences = await UserPreferences.findOne({
      where: { userId: req.user.id }
    });

    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user.id
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
exports.updateUserPreferences = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    let preferences = await UserPreferences.findOne({
      where: { userId: req.user.id }
    });

    // If no preferences exist, create them
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: req.user.id,
        ...req.body
      });
    } else {
      // Update existing preferences
      await preferences.update(req.body);
    }

    logger.info(`User preferences updated for user: ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        preferences
      }
    });
  } catch (error) {
    next(error);
  }
};