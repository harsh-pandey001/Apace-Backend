const { body, param } = require('express-validator');

// Address validation rules
exports.createAddressValidator = [
  body('label')
    .notEmpty()
    .withMessage('Label is required')
    .isString()
    .withMessage('Label must be a string')
    .isLength({ max: 100 })
    .withMessage('Label cannot exceed 100 characters'),
  
  body('addressLine1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isString()
    .withMessage('Address line 1 must be a string')
    .isLength({ max: 255 })
    .withMessage('Address line 1 cannot exceed 255 characters'),
  
  body('addressLine2')
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string')
    .isLength({ max: 255 })
    .withMessage('Address line 2 cannot exceed 255 characters'),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .withMessage('City must be a string')
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .withMessage('State must be a string')
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('zip')
    .notEmpty()
    .withMessage('ZIP code is required')
    .isString()
    .withMessage('ZIP code must be a string')
    .isLength({ max: 20 })
    .withMessage('ZIP code cannot exceed 20 characters'),
  
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isString()
    .withMessage('Country must be a string')
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

exports.updateAddressValidator = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid address ID format'),
  
  body('label')
    .optional()
    .isString()
    .withMessage('Label must be a string')
    .isLength({ max: 100 })
    .withMessage('Label cannot exceed 100 characters'),
  
  body('addressLine1')
    .optional()
    .isString()
    .withMessage('Address line 1 must be a string')
    .isLength({ max: 255 })
    .withMessage('Address line 1 cannot exceed 255 characters'),
  
  body('addressLine2')
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string')
    .isLength({ max: 255 })
    .withMessage('Address line 2 cannot exceed 255 characters'),
  
  body('city')
    .optional()
    .isString()
    .withMessage('City must be a string')
    .isLength({ max: 100 })
    .withMessage('City cannot exceed 100 characters'),
  
  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string')
    .isLength({ max: 100 })
    .withMessage('State cannot exceed 100 characters'),
  
  body('zip')
    .optional()
    .isString()
    .withMessage('ZIP code must be a string')
    .isLength({ max: 20 })
    .withMessage('ZIP code cannot exceed 20 characters'),
  
  body('country')
    .optional()
    .isString()
    .withMessage('Country must be a string')
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value')
];

exports.addressIdValidator = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid address ID format')
];