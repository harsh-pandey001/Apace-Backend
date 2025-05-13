const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

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

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user
    }
  });
};

// Register a new user
exports.register = async (req, res, next) => {
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

    // Create the user
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role || 'user'
    });

    logger.info(`New user registered: ${newUser.email}`);

    // Generate tokens and send response
    createSendTokens(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// User login
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.correctPassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if user account is active
    if (!user.active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    logger.info(`User logged in: ${user.email}`);

    // 4) If everything ok, send tokens to client
    createSendTokens(user, 200, res);
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

    // Remove password from output
    user.password = undefined;

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

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // 1) Get user based on email
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }

    // 2) Generate the random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save to user model (would need to add these fields to the model)
    await user.update({
      passwordResetToken,
      passwordResetExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // 3) In a real app, send email with the reset token
    // For this template, we'll just return the token in the response
    logger.info(`Password reset requested for: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      resetToken // In a real app, you would not send this here
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.info(`Password reset completed for: ${user.email}`);

    // 3) Update changedPasswordAt property for the user
    // This is handled by a hook in the model

    // 4) Log the user in, send JWT
    createSendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Change password (when logged in)
exports.changePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // 1) Get user from collection
    const user = await User.findByPk(req.user.id);

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    await user.save();
    
    logger.info(`Password changed for: ${user.email}`);

    // 4) Log user in, send JWT
    createSendTokens(user, 200, res);
  } catch (error) {
    next(error);
  }
};