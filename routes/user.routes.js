const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { updateProfileValidation, createUserValidation, updateUserValidation } = require('../validations/user.validation');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.patch(
  '/profile',
  updateProfileValidation,
  userController.updateProfile
);

// Admin only routes
router.use(restrictTo('admin'));

// Get all users
router.get('/', userController.getAllUsers);

// Get a single user
router.get('/:id', userController.getUser);

// Create a new user (by admin)
router.post(
  '/',
  createUserValidation,
  userController.createUser
);

// Update a user
router.patch('/:id', updateUserValidation, userController.updateUser);

// Permanently delete a user (hard delete) - MUST come before generic /:id route
router.delete('/:id/permanent', userController.permanentDeleteUser);

// Delete a user (soft delete)
router.delete('/:id', userController.deleteUser);

module.exports = router;