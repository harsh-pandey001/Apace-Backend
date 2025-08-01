const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { User, Driver, Admin } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Helper function to find user by ID and role
 */
const findUserByIdAndRole = async (id, role) => {
  let user;
  
  switch (role) {
  case 'driver':
    user = await Driver.findByPk(id);
    if (user) {
      return { user, role: 'driver', activeField: 'isActive' };
    }
    break;
  case 'admin':
    user = await Admin.findByPk(id);
    if (user) {
      return { user, role: 'admin', activeField: 'active' };
    }
    break;
  case 'user':
  default:
    user = await User.findByPk(id);
    if (user) {
      return { user, role: 'user', activeField: 'active' };
    }
    break;
  }
  
  return null;
};

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = async (req, res, next) => {
  try {
    logger.info(`🔐 JWT Protection - ${req.method} ${req.originalUrl}`);
    
    // 1) Get token from Authorization header
    let token;
    const authHeader = req.headers.authorization;
    
    logger.info(`🔍 Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
      logger.info(`🎫 Token extracted: ${token ? `${token.substring(0, 20)}...` : 'Empty'}`);
    }

    if (!token) {
      logger.warn(`❌ No token provided for ${req.originalUrl}`);
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    logger.info(`🔓 Verifying token with secret: ${process.env.JWT_SECRET ? 'Present' : 'Missing'}`);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info(`✅ Token verified successfully. User ID: ${decoded.id}, Role: ${decoded.role || 'legacy'}`);
    } catch (verifyError) {
      logger.error('❌ JWT Verification failed:', {
        error: verifyError.name,
        message: verifyError.message,
        expiredAt: verifyError.expiredAt,
        tokenPreview: token.substring(0, 50)
      });
      throw verifyError;
    }

    // 3) Check if user still exists based on role
    logger.info(`👤 Looking for user ID: ${decoded.id}, Role: ${decoded.role || 'checking all tables'}`);
    
    let userResult;
    if (decoded.role) {
      userResult = await findUserByIdAndRole(decoded.id, decoded.role);
    } else {
      // For backward compatibility, check all tables
      userResult = await findUserByIdAndRole(decoded.id, 'user') ||
                   await findUserByIdAndRole(decoded.id, 'driver') ||
                   await findUserByIdAndRole(decoded.id, 'admin');
    }
    
    if (!userResult) {
      logger.error(`❌ User not found for ID: ${decoded.id}`);
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    const { user: currentUser, role, activeField } = userResult;
    logger.info(`👤 User found: ${currentUser.id}, Role: ${role}, Active field: ${activeField}`);

    // 4) Check if user account is active
    if (!currentUser[activeField]) {
      logger.warn(`⚠️ User account inactive: ${currentUser.id}`);
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    req.user.role = role; // Ensure role is available on req.user
    logger.info(`✅ Authentication successful for user: ${currentUser.id}`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token format. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please refresh your token or log in again.', 401));
    }
    next(error);
  }
};

/**
 * Middleware to restrict access to certain roles
 * @param  {...String} roles - The roles allowed to access the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array e.g. ['admin', 'driver']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};