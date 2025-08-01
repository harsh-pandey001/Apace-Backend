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
    .custom((value) => {
      // Remove " kg" suffix if present for validation
      const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
      
      // Check if it's a valid number
      if (!/^\d+(\.\d+)?$/.test(cleanValue)) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      const numValue = parseFloat(cleanValue);
      if (numValue <= 0) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      if (numValue > 100000) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      return true;
    })
    .customSanitizer((value) => {
      // Remove existing " kg" suffix and add it back
      const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
      return `${cleanValue} kg`;
    }),
  
  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
  body('pricePerKm')
    .notEmpty()
    .withMessage('Price per km is required')
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
  body('startingPrice')
    .notEmpty()
    .withMessage('Starting price is required')
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
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
    .custom((value) => {
      if (value === undefined || value === null) return true; // Optional field
      
      // Remove " kg" suffix if present for validation
      const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
      
      // Check if it's a valid number
      if (!/^\d+(\.\d+)?$/.test(cleanValue)) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      const numValue = parseFloat(cleanValue);
      if (numValue <= 0) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      if (numValue > 100000) {
        throw new Error('Enter a valid number under 100000 for capacity.');
      }
      
      return true;
    })
    .customSanitizer((value) => {
      if (value === undefined || value === null) return value;
      // Remove existing " kg" suffix and add it back
      const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
      return `${cleanValue} kg`;
    }),
  
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      if (value === undefined || value === null) return value;
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
  body('pricePerKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      if (value === undefined || value === null) return value;
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
  body('startingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Enter a valid price (number or decimal only).')
    .toFloat()
    .customSanitizer((value) => {
      if (value === undefined || value === null) return value;
      // Format to 2 decimal places
      return parseFloat(value).toFixed(2);
    }),
  
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