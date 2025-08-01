const { body } = require('express-validator');

exports.validateUpdatePreferences = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('smsNotifications must be a boolean'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('pushNotifications must be a boolean'),
  
  body('marketingEmails')
    .optional()
    .isBoolean()
    .withMessage('marketingEmails must be a boolean'),
  
  body('darkTheme')
    .optional()
    .isBoolean()
    .withMessage('darkTheme must be a boolean'),
  
  body('language')
    .optional()
    .isIn(['EN', 'ES'])
    .withMessage('language must be either EN or ES'),
  
  body('defaultVehicleType')
    .optional()
    .isString()
    .trim()
    .withMessage('defaultVehicleType must be a string'),
  
  body('defaultPaymentMethod')
    .optional()
    .isString()
    .trim()
    .withMessage('defaultPaymentMethod must be a string')
];