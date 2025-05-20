const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, OtpVerification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { 
  createOrUpdateOTP, 
  verifyOTP, 
  sendOTPviaSMS 
} = require('../utils/otpUtils');

// Helper function to generate tokens
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  });
};

// Create and send tokens with response
const createSendTokens = (user, statusCode, res) => {
  const token = signToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user
    }
  });
};

// Request OTP for login
exports.requestOtp = async (req, res, next) => {
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

    // Check if user exists with this phone
    const user = await User.findOne({ where: { phone } });
    
    // If user doesn't exist, return error
    if (!user) {
      return res.status(403).json({
        status: 'fail',
        message: 'User not registered. Please sign up first.'
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
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
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

    // Check if the user exists
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return next(new AppError('User not found. Please sign up first.', 404));
    }

    // Check if user account is active
    if (!user.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    logger.info(`User authenticated via OTP: ${user.email}`);
      
    // Generate tokens and send response
    createSendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Signup new user and send OTP
exports.signup = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { phone, firstName, lastName, email } = req.body;

    // Check if phone already exists
    const existingUserWithPhone = await User.findOne({ where: { phone } });
    if (existingUserWithPhone) {
      return next(new AppError('Phone number already registered', 400));
    }

    // Check if email already exists
    const existingUserWithEmail = await User.findOne({ where: { email } });
    if (existingUserWithEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      role: 'user'
    });

    logger.info(`New user registered: ${newUser.email}`);

    // Create or update OTP
    const otpRecord = await createOrUpdateOTP(phone);
    
    // Send OTP via SMS (mock)
    await sendOTPviaSMS(phone, otpRecord.otp);

    res.status(201).json({
      status: 'success',
      message: 'Signup successful. OTP sent for verification.'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Please provide refresh token', 400));
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find the user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    if (!user.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Generate new tokens
    const token = signToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      refreshToken: newRefreshToken,
      data: {
        user
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
    }
    next(error);
  }
};

// Logout
exports.logout = (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Successfully logged out'
  });
};