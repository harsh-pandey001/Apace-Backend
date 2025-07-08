const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { User, Driver, Admin } = require('../models');

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
    // 1) Get token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists based on role
    // If token doesn't have role (old tokens), try to find in all tables
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
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    const { user: currentUser, role, activeField } = userResult;

    // 4) Check if user account is active
    if (!currentUser[activeField]) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    req.user.role = role; // Ensure role is available on req.user
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
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