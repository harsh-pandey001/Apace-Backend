const { validationResult } = require('express-validator');
const { User, Driver, Admin } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user.profilePicture) {
      user.profilePicture = 'https://example.com/default-avatar.png';
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

    // Build dynamic update object with only provided fields
    const updatedFields = {};
    
    // Handle profilePicture separately to allow null values
    if (req.body.profilePicture !== undefined) {
      updatedFields.profilePicture = req.body.profilePicture;
    }
    
    // Handle other fields only if they have truthy values
    if (req.body.firstName) {
      updatedFields.firstName = req.body.firstName;
    }
    if (req.body.lastName) {
      updatedFields.lastName = req.body.lastName;
    }
    if (req.body.email) {
      updatedFields.email = req.body.email;
    }
    if (req.body.phone) {
      updatedFields.phone = req.body.phone;
    }

    // Check if any fields were provided for update
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No fields provided to update'
      });
    }

    // Check if email already exists if trying to change it
    if (updatedFields.email && updatedFields.email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email: updatedFields.email } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Perform dynamic update - only update provided fields
    await User.update(updatedFields, {
      where: { id: req.user.id }
    });

    // Fetch updated user
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    // Handle default avatar for response
    const userResponse = user.toJSON();
    if (!userResponse.profilePicture) {
      userResponse.profilePicture = 'https://example.com/default-avatar.png';
    }

    logger.info(`User updated profile: ${user.email} - Fields: ${Object.keys(updatedFields).join(', ')}`);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin routes below

// Get all users and drivers (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    // Get users
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    // Get drivers
    const drivers = await Driver.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'isActive', 'isVerified', 'availability_status', 'vehicleType', 'vehicleCapacity', 'vehicleNumber', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    // Format data to include type and combine
    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      userType: 'user',
      role: 'user'
    }));

    const formattedDrivers = drivers.map(driver => ({
      ...driver.toJSON(),
      userType: 'driver',
      role: 'driver',
      firstName: driver.name.split(' ')[0] || driver.name,
      lastName: driver.name.split(' ').slice(1).join(' ') || '',
      active: driver.isActive
    }));

    // Combine and sort by creation date
    const allUsers = [...formattedUsers, ...formattedDrivers].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply pagination to combined results
    const totalCount = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    res.status(200).json({
      status: 'success',
      results: paginatedUsers.length,
      totalUsers: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: {
        users: paginatedUsers,
        summary: {
          totalUsers: formattedUsers.length,
          totalDrivers: formattedDrivers.length,
          totalAll: totalCount
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

// Get a single user (admin only) - searches across User, Driver, and Admin tables
exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    let user = null;
    let userType = null;
    let userRole = null;

    // Check User table first
    user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (user) {
      userType = 'user';
      userRole = 'user';
      
      // Format user data to include role
      const userData = user.toJSON();
      user = {
        ...userData,
        role: 'user',
        userType: 'user'
      };
    } else {
      // Check Driver table
      user = await Driver.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'phone', 'isActive', 'isVerified', 'availability_status', 'vehicleType', 'vehicleCapacity', 'vehicleNumber', 'createdAt', 'updatedAt']
      });
      
      if (user) {
        userType = 'driver';
        userRole = 'driver';
        
        // Format driver data to match user structure
        const driverData = user.toJSON();
        user = {
          ...driverData,
          firstName: driverData.name.split(' ')[0] || driverData.name,
          lastName: driverData.name.split(' ').slice(1).join(' ') || '',
          active: driverData.isActive,
          role: 'driver',
          userType: 'driver',
          // Add driver-specific fields
          vehicleInfo: {
            vehicleType: driverData.vehicleType,
            vehicleCapacity: driverData.vehicleCapacity,
            vehicleNumber: driverData.vehicleNumber
          },
          isVerified: driverData.isVerified,
          availability_status: driverData.availability_status
        };
      } else {
        // Check Admin table
        user = await Admin.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });
        
        if (user) {
          userType = 'admin';
          userRole = 'admin';
          
          // Format admin data
          const adminData = user.toJSON();
          user = {
            ...adminData,
            role: 'admin',
            userType: 'admin'
          };
        }
      }
    }

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      userType,
      role: userRole,
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

// Permanently delete a user (admin only) - Hard delete
exports.permanentDeleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Validate user ID format
    if (!userId || userId === 'permanent') {
      return next(new AppError('Invalid user ID provided', 400));
    }

    // Check in User table first
    let user = await User.findByPk(userId);
    let userType = 'user';
    let userEmail = null;
    
    // If not found in User table, check Driver table
    if (!user) {
      user = await Driver.findByPk(userId);
      userType = 'driver';
    }
    
    // If still not found, check Admin table
    if (!user) {
      user = await Admin.findByPk(userId);
      userType = 'admin';
    }
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent deletion of admin users
    if (userType === 'admin') {
      return next(new AppError('Cannot permanently delete admin users', 403));
    }

    // Store user info for logging before deletion
    userEmail = user.email || user.phone;
    const userName = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;

    // Permanently delete the user from database
    const destroyResult = await user.destroy();
    
    // Verify deletion was successful
    if (!destroyResult) {
      return next(new AppError('Failed to delete user', 500));
    }

    logger.info(`Admin permanently deleted ${userType}: ${userEmail} (${userName})`);

    // Return success response
    return res.status(200).json({
      status: 'success',
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} permanently deleted successfully`,
      data: {
        deletedUser: {
          id: userId,
          email: userEmail,
          name: userName,
          type: userType
        }
      }
    });
  } catch (error) {
    logger.error(`Error in permanentDeleteUser: ${error.message}`);
    next(error);
  }
};