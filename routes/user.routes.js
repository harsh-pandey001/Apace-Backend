const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.patch(
  '/profile',
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email address'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
  ],
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
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('role').isIn(['user', 'driver', 'admin']).withMessage('Invalid role')
  ],
  userController.createUser
);

// Update a user
router.patch('/:id', userController.updateUser);

// Delete a user (soft delete)
router.delete('/:id', userController.deleteUser);

module.exports = router;