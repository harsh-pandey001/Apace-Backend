const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Driver, Admin, OtpVerification } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { 
  createOrUpdateOTP, 
  verifyOTP, 
  sendOTPviaSMS 
} = require('../utils/otpUtils');

// Helper function to find user by phone across all role tables
const findUserByPhone = async (phone) => {
  // Check User table
  let user = await User.findOne({ where: { phone } });
  if (user) return { user, role: 'user' };

  // Check Driver table
  user = await Driver.findOne({ where: { phone } });
  if (user) return { user, role: 'driver' };

  // Check Admin table
  user = await Admin.findOne({ where: { phone } });
  if (user) return { user, role: 'admin' };

  return null;
};

// Helper function to find user by email across all role tables
const findUserByEmail = async (email) => {
  // Check User table
  let user = await User.findOne({ where: { email } });
  if (user) return { user, role: 'user' };

  // Check Driver table
  user = await Driver.findOne({ where: { email } });
  if (user) return { user, role: 'driver' };

  // Check Admin table
  user = await Admin.findOne({ where: { email } });
  if (user) return { user, role: 'admin' };

  return null;
};

// Helper function to find user by ID across all role tables
const findUserById = async (id) => {
  // Check User table
  let user = await User.findByPk(id);
  if (user) return { user, role: 'user' };

  // Check Driver table
  user = await Driver.findByPk(id);
  if (user) return { user, role: 'driver' };

  // Check Admin table
  user = await Admin.findByPk(id);
  if (user) return { user, role: 'admin' };

  return null;
};

// Helper function to generate tokens
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const signRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  });
};

// Create and send tokens with response
const createSendTokens = (user, role, statusCode, res) => {
  const token = signToken(user.id, role);
  const refreshToken = signRefreshToken(user.id, role);

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user: {
        ...user.dataValues,
        role
      }
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

    // Check if user exists with this phone across all role tables
    const userResult = await findUserByPhone(phone);
    
    // Only allow phone number 1234567890 for admin users
    if (userResult && userResult.role === 'admin' && phone !== '1234567890') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter correct number'
      });
    }
    
    // If user doesn't exist, return error
    if (!userResult) {
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

    // Check if the user exists across all role tables
    const userResult = await findUserByPhone(phone);

    if (!userResult) {
      return next(new AppError('User not found. Please sign up first.', 404));
    }

    const { user, role } = userResult;

    // Check if user account is active
    if (!user.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    logger.info(`User authenticated via OTP: ${user.email}`);
      
    // Generate tokens and send response
    createSendTokens(user, role, 200, res);
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

    const { phone, firstName, lastName, email, role } = req.body;

    // Check if phone already exists across all role tables
    const existingUserWithPhone = await findUserByPhone(phone);
    if (existingUserWithPhone) {
      return next(new AppError('Phone number already registered', 400));
    }

    // Check if email already exists across all role tables
    const existingUserWithEmail = await findUserByEmail(email);
    if (existingUserWithEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Determine which table to use based on role
    const userRole = role || 'user';
    let Model;
    
    switch (userRole) {
      case 'driver':
        Model = Driver;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        Model = User;
    }

    // Create new user in the appropriate table
    const userData = { email, phone };
    
    // Handle different field names for different models
    if (userRole === 'driver') {
      userData.name = `${firstName} ${lastName}`;
    } else {
      userData.firstName = firstName;
      userData.lastName = lastName;
    }
    
    const newUser = await Model.create(userData);

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

    // Find the user across all role tables
    const userResult = await findUserById(decoded.id);

    if (!userResult) {
      return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    const { user, role } = userResult;

    if (!user.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // Generate new tokens
    const token = signToken(user.id, role);
    const newRefreshToken = signRefreshToken(user.id, role);

    res.status(200).json({
      status: 'success',
      token,
      refreshToken: newRefreshToken,
      data: {
        user: {
          ...user.dataValues,
          role
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

// Logout
exports.logout = (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Successfully logged out'
  });
};