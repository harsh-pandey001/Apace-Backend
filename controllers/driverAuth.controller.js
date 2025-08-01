const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Driver, OtpVerification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { 
  createOrUpdateOTP, 
  verifyOTP, 
  sendOTPviaSMS 
} = require('../utils/otpUtils');

// Helper function to find driver by phone
const findDriverByPhone = async (phone) => {
  return await Driver.findOne({ where: { phone } });
};

// Helper function to find driver by ID
const findDriverById = async (id) => {
  return await Driver.findByPk(id);
};

// Helper function to generate tokens
const signToken = (id, role = 'driver') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

const signRefreshToken = (id, role = 'driver') => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

// Create and send tokens with response
const createSendTokens = (driver, statusCode, res) => {
  const token = signToken(driver.id, 'driver');
  const refreshToken = signRefreshToken(driver.id, 'driver');

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleCapacity: driver.vehicleCapacity,
        vehicleNumber: driver.vehicleNumber,
        availability_status: driver.availability_status,
        isActive: driver.isActive,
        isVerified: driver.isVerified,
        role: 'driver'
      }
    }
  });
};

// Request OTP for driver login
exports.requestDriverOtp = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { phone } = req.body;

    // Check if driver exists with this phone
    const driver = await findDriverByPhone(phone);
    
    // If driver doesn't exist, return error
    if (!driver) {
      return res.status(403).json({
        status: 'fail',
        message: 'Driver not registered. Please sign up first.'
      });
    }

    // Check if driver account is active
    if (!driver.isActive) {
      return res.status(403).json({
        status: 'fail',
        message: 'Your driver account has been deactivated. Please contact support.'
      });
    }

    // Create or update OTP
    const otpRecord = await createOrUpdateOTP(phone);
    
    // Send OTP via SMS (mock)
    await sendOTPviaSMS(phone, otpRecord.otp);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent'
    });
    
    logger.info(`Driver OTP requested: ${phone}`);
  } catch (error) {
    next(error);
  }
};

// Verify OTP and login driver
exports.verifyDriverOtp = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { phone, otp } = req.body;

    // Verify the OTP
    const verificationResult = await verifyOTP(phone, otp);
    
    if (!verificationResult.valid) {
      return next(new AppError(verificationResult.message, 400));
    }

    // Check if the driver exists
    const driver = await findDriverByPhone(phone);

    if (!driver) {
      return next(new AppError('Driver not found. Please sign up first.', 404));
    }

    // Check if driver account is active
    if (!driver.isActive) {
      return next(new AppError('Your driver account has been deactivated. Please contact support.', 401));
    }

    logger.info(`Driver authenticated via OTP: ${driver.email || driver.phone}`);
      
    // Generate tokens and send response
    createSendTokens(driver, 200, res);
  } catch (error) {
    next(error);
  }
};

// Refresh token for drivers
exports.refreshDriverToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Please provide refresh token', 400));
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Ensure this is a driver token
    if (decoded.role !== 'driver') {
      return next(new AppError('Invalid token for driver authentication', 401));
    }

    // Find the driver
    const driver = await findDriverById(decoded.id);

    if (!driver) {
      return next(new AppError('The driver belonging to this token no longer exists', 401));
    }

    if (!driver.isActive) {
      return next(new AppError('Your driver account has been deactivated. Please contact support.', 401));
    }

    // Generate new tokens
    const token = signToken(driver.id, 'driver');
    const newRefreshToken = signRefreshToken(driver.id, 'driver');

    res.status(200).json({
      status: 'success',
      token,
      refreshToken: newRefreshToken,
      data: {
        user: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehicleCapacity: driver.vehicleCapacity,
          vehicleNumber: driver.vehicleNumber,
          availability_status: driver.availability_status,
          isActive: driver.isActive,
          isVerified: driver.isVerified,
          role: 'driver'
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }
    next(error);
  }
};

// Driver logout
exports.logoutDriver = (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Successfully logged out'
  });
};