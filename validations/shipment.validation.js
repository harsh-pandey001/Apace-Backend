const { body } = require('express-validator');
const { isValidVehicleType, getValidVehicleTypesMessage } = require('../utils/vehicleTypeValidator');

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
    .isString(),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('distance')
    .optional()
    .isFloat({ min: 1.0 })
    .withMessage('Distance must be at least 1 kilometer')
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

exports.createGuestShipmentValidation = [
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  // Accept either 'weight' or 'estimatedWeight' field
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  
  body('estimatedWeight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated weight must be a positive number'),
  
  // Custom validation to ensure at least one weight field is provided
  body('weight')
    .custom((value, { req }) => {
      if (!value && !req.body.estimatedWeight) {
        throw new Error('Weight is required (provide either weight or estimatedWeight)');
      }
      return true;
    }),
  
  body('vehicleType')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .custom(async (value) => {
      const isValid = await isValidVehicleType(value);
      if (!isValid) {
        const validTypes = await getValidVehicleTypesMessage();
        throw new Error(`Vehicle type must be one of: ${validTypes}`);
      }
      return true;
    }),
  
  body('guestName')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Guest name is required and must be between 2-100 characters'),
  
  body('guestPhone')
    .notEmpty()
    .withMessage('Guest phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10-20 characters'),
  
  body('guestEmail')
    .optional()
    .isEmail()
    .withMessage('Valid guest email address is required if provided'),
  
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
  
  body('specialInstructions')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be a string with maximum 500 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('distance')
    .optional()
    .isFloat({ min: 1.0 })
    .withMessage('Distance must be at least 1 kilometer')
    .custom((value) => {
      if (value !== undefined && value < 1.0) {
        throw new Error('Distance too short. Minimum distance is 1 kilometer for delivery.');
      }
      return true;
    })
];

// Unified validation for shipment creation that handles both authenticated and guest users
exports.createUnifiedShipmentValidation = [
  body('userType')
    .notEmpty()
    .isIn(['authenticated', 'guest'])
    .withMessage('User type is required and must be either "authenticated" or "guest"'),
  
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  // For authenticated users, scheduledPickupDate is required
  body('scheduledPickupDate')
    .if(body('userType').equals('authenticated'))
    .isISO8601()
    .withMessage('Valid pickup date is required for authenticated users'),
  
  // Weight and vehicleType are required for guest users - accept both weight and estimatedWeight
  body('weight')
    .if(body('userType').equals('guest'))
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number for guest bookings'),
  
  body('estimatedWeight')
    .if(body('userType').equals('guest'))
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated weight must be a positive number for guest bookings'),
  
  // Custom validation for guest users - ensure at least one weight field is provided
  body('weight')
    .if(body('userType').equals('guest'))
    .custom((value, { req }) => {
      if (req.body.userType === 'guest' && !value && !req.body.estimatedWeight) {
        throw new Error('Weight is required for guest bookings (provide either weight or estimatedWeight)');
      }
      return true;
    }),
  
  // For authenticated users, weight is optional
  body('weight')
    .if(body('userType').equals('authenticated'))
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  
  body('estimatedWeight')
    .if(body('userType').equals('authenticated'))
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated weight must be a positive number'),
  
  body('vehicleType')
    .if(body('userType').equals('guest'))
    .notEmpty()
    .withMessage('Vehicle type is required for guest bookings')
    .custom(async (value, { req }) => {
      if (req.body.userType === 'guest') {
        const isValid = await isValidVehicleType(value);
        if (!isValid) {
          const validTypes = await getValidVehicleTypesMessage();
          throw new Error(`Vehicle type is required for guest bookings and must be one of: ${validTypes}`);
        }
      }
      return true;
    }),
  
  body('vehicleType')
    .if(body('userType').equals('authenticated'))
    .optional()
    .custom(async (value, { req }) => {
      if (req.body.userType === 'authenticated' && value) {
        const isValid = await isValidVehicleType(value);
        if (!isValid) {
          const validTypes = await getValidVehicleTypesMessage();
          throw new Error(`Vehicle type must be one of: ${validTypes}`);
        }
      }
      return true;
    }),
  
  // Guest fields - required for guest users
  body('guestName')
    .if(body('userType').equals('guest'))
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Guest name is required and must be between 2-100 characters for guest bookings'),
  
  body('guestPhone')
    .if(body('userType').equals('guest'))
    .notEmpty()
    .withMessage('Guest phone number is required for guest bookings')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10-20 characters'),
  
  body('guestEmail')
    .if(body('userType').equals('guest'))
    .optional()
    .isEmail()
    .withMessage('Valid guest email address is required if provided'),
  
  // Guest fields should not be present for authenticated users
  body('guestName')
    .if(body('userType').equals('authenticated'))
    .isEmpty()
    .withMessage('Guest name should not be provided for authenticated users'),
  
  body('guestPhone')
    .if(body('userType').equals('authenticated'))
    .isEmpty()
    .withMessage('Guest phone should not be provided for authenticated users'),
  
  body('guestEmail')
    .if(body('userType').equals('authenticated'))
    .isEmpty()
    .withMessage('Guest email should not be provided for authenticated users'),
  
  // Optional fields for both user types
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
  
  body('dimensions')
    .optional()
    .isString()
    .withMessage('Dimensions must be a string'),
  
  body('specialInstructions')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be a string with maximum 500 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('distance')
    .optional()
    .isFloat({ min: 1.0 })
    .withMessage('Distance must be at least 1 kilometer')
    .custom((value) => {
      if (value !== undefined && value < 1.0) {
        throw new Error('Distance too short. Minimum distance is 1 kilometer for delivery.');
      }
      return true;
    })
];