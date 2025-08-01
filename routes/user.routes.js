const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { updateProfileValidation, createUserValidation, updateUserValidation } = require('../validations/user.validation');
const { userCacheMiddleware, clearCacheMiddleware, resourceCacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get current user profile (with caching)
router.get('/profile', userCacheMiddleware('profile', 300), userController.getProfile);

// Update user profile (with cache invalidation)
router.patch(
  '/profile',
  updateProfileValidation,
  clearCacheMiddleware({ userDataTypes: ['profile'] }),
  userController.updateProfile
);

// Admin only routes
router.use(restrictTo('admin'));

// Get all users
router.get('/', userController.getAllUsers);

// Get a single user (with caching)
router.get('/:id', resourceCacheMiddleware('user', 'id', 300), userController.getUser);

// Create a new user (by admin)
router.post(
  '/',
  createUserValidation,
  userController.createUser
);

// Update a user (with cache invalidation)
router.patch('/:id', 
  updateUserValidation, 
  clearCacheMiddleware({ resourceType: 'user' }),
  userController.updateUser
);

// Permanently delete a user (hard delete) - MUST come before generic /:id route
router.delete('/:id/permanent', 
  clearCacheMiddleware({ resourceType: 'user' }),
  userController.permanentDeleteUser
);

// Delete a user (soft delete)
router.delete('/:id', 
  clearCacheMiddleware({ resourceType: 'user' }),
  userController.deleteUser
);

module.exports = router;