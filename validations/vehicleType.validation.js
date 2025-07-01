const { body, param } = require('express-validator');

exports.createVehicleTypeValidation = [
  body('vehicleType')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle type must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_\-\s]+$/)
    .withMessage('Vehicle type can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('label')
    .notEmpty()
    .withMessage('Label is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Label must be between 2 and 100 characters'),
  
  body('capacity')
    .notEmpty()
    .withMessage('Capacity is required')
    .isString()
    .withMessage('Capacity must be a string'),
  
  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number')
    .toFloat(),
  
  body('pricePerKm')
    .notEmpty()
    .withMessage('Price per km is required')
    .isFloat({ min: 0 })
    .withMessage('Price per km must be a positive number')
    .toFloat(),
  
  body('startingPrice')
    .notEmpty()
    .withMessage('Starting price is required')
    .isFloat({ min: 0 })
    .withMessage('Starting price must be a positive number')
    .toFloat(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean(),

  body('iconKey')
    .optional()
    .isIn(['truck', 'bike', 'car', 'van', 'bus', 'tractor', 'container', 'default'])
    .withMessage('Icon key must be one of: truck, bike, car, van, bus, tractor, container, default')
];

exports.updateVehicleTypeValidation = [
  param('vehicleId')
    .isUUID()
    .withMessage('Valid vehicle ID is required'),
  
  body('vehicleType')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Vehicle type must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_\-\s]+$/)
    .withMessage('Vehicle type can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('label')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Label must be between 2 and 100 characters'),
  
  body('capacity')
    .optional()
    .isString()
    .withMessage('Capacity must be a string'),
  
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number')
    .toFloat(),
  
  body('pricePerKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per km must be a positive number')
    .toFloat(),
  
  body('startingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Starting price must be a positive number')
    .toFloat(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
    .toBoolean(),

  body('iconKey')
    .optional()
    .isIn(['truck', 'bike', 'car', 'van', 'bus', 'tractor', 'container', 'default'])
    .withMessage('Icon key must be one of: truck, bike, car, van, bus, tractor, container, default')
];

exports.getVehicleTypeValidation = [
  param('vehicleId')
    .isUUID()
    .withMessage('Valid vehicle ID is required')
];