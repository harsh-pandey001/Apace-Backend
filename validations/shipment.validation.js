const { body } = require('express-validator');

exports.createShipmentValidation = [
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  body('scheduledPickupDate')
    .isISO8601()
    .withMessage('Valid pickup date is required'),
  
  body('estimatedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Valid delivery date is required'),
  
  body('pickupLat')
    .optional()
    .isFloat()
    .withMessage('Pickup latitude must be a valid number'),
  
  body('pickupLng')
    .optional()
    .isFloat()
    .withMessage('Pickup longitude must be a valid number'),
  
  body('deliveryLat')
    .optional()
    .isFloat()
    .withMessage('Delivery latitude must be a valid number'),
  
  body('deliveryLng')
    .optional()
    .isFloat()
    .withMessage('Delivery longitude must be a valid number'),
  
  body('weight')
    .optional()
    .isFloat()
    .withMessage('Weight must be a valid number'),
  
  body('dimensions')
    .optional()
    .isString()
    .withMessage('Dimensions must be a string'),
  
  body('specialInstructions')
    .optional()
    .isString()
];

exports.updateShipmentStatusValidation = [
  body('status')
    .isIn(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('notes')
    .optional()
    .isString()
];

exports.assignShipmentValidation = [
  body('vehicleId')
    .isUUID()
    .withMessage('Valid vehicle ID is required'),
  
  body('driverId')
    .optional()
    .isUUID()
    .withMessage('Driver ID must be a valid UUID')
];