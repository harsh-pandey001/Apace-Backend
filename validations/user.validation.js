const { body } = require('express-validator');

exports.updateProfileValidation = [
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

exports.createUserValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  
  body('role')
    .isIn(['user', 'driver', 'admin'])
    .withMessage('Invalid role')
];