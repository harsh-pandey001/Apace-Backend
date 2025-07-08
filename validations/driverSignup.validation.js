const { body } = require('express-validator');

exports.validateDriverSignup = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('vehicleType')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isString()
    .withMessage('Vehicle type must be a string')
    .isLength({ max: 20 })
    .withMessage('Vehicle type must be maximum 20 characters'),
  
  body('vehicleCapacity')
    .notEmpty()
    .withMessage('Vehicle capacity is required')
    .isString()
    .withMessage('Vehicle capacity must be a string'),
  
  body('vehicleNumber')
    .notEmpty()
    .withMessage('Vehicle number is required')
    .matches(/^[A-Z]{2}\d{2}\s[A-Z]{2}\d{4}$/)
    .withMessage('Vehicle number must match format: AB09 CD1234'),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

exports.validateDriverAvailability = [
  body('availability_status')
    .notEmpty()
    .withMessage('Availability status is required')
    .isIn(['online', 'offline'])
    .withMessage('Availability status must be either online or offline')
];

exports.validateDriverProfileUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('vehicleType')
    .optional()
    .notEmpty()
    .withMessage('Vehicle type cannot be empty')
    .isString()
    .withMessage('Vehicle type must be a string')
    .isLength({ max: 20 })
    .withMessage('Vehicle type must be maximum 20 characters'),
  
  body('vehicleCapacity')
    .optional()
    .notEmpty()
    .withMessage('Vehicle capacity cannot be empty')
    .isString()
    .withMessage('Vehicle capacity must be a string'),
  
  body('vehicleNumber')
    .optional()
    .notEmpty()
    .withMessage('Vehicle number cannot be empty')
    .matches(/^[A-Z]{2}\d{2}\s[A-Z]{2}\d{4}$/)
    .withMessage('Vehicle number must match format: AB09 CD1234'),
  
  // Custom validation to ensure phone is not included
  body('phone')
    .not()
    .exists()
    .withMessage('Phone number updates are not allowed through this endpoint'),
  
  // Custom validation to ensure at least one field is provided
  body().custom((value, { req }) => {
    const allowedFields = ['name', 'email', 'vehicleType', 'vehicleCapacity', 'vehicleNumber'];
    const providedFields = Object.keys(req.body).filter(field => allowedFields.includes(field));
    
    if (providedFields.length === 0) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  })
];