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
    .withMessage('Please provide a valid phone number'),
  
  body('profilePicture')
    .optional({ checkFalsy: false })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      if (typeof value === 'string' && /^https?:\/\/.+\..+/.test(value)) {
        return true;
      }
      throw new Error('Profile picture must be a valid URL or null');
    }),
  
  // Custom validation to ensure at least one field is provided
  body().custom((value, { req }) => {
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'profilePicture'];
    const providedFields = Object.keys(req.body).filter(field => allowedFields.includes(field));
    
    if (providedFields.length === 0) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  })
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

exports.updateUserValidation = [
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
    .withMessage('Please provide a valid phone number'),
    
  body('role')
    .optional()
    .isIn(['user', 'driver'])
    .withMessage('Role can only be updated to user or driver'),
    
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean value')
];