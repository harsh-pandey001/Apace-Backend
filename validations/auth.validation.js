const { body } = require('express-validator');

// Validation for requesting an OTP
exports.requestOtpValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// Validation for verifying an OTP
exports.verifyOtpValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

// Validation for signing up a new user
exports.signupValidation = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('role')
    .optional()
    .isIn(['user', 'driver', 'admin'])
    .withMessage('Role must be either user, driver, or admin')
];