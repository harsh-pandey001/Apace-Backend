const { body, param, query } = require('express-validator');

const registerTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('FCM token is required')
    .isLength({ min: 100 })
    .withMessage('FCM token must be at least 100 characters long'),
  
  body('platform')
    .optional()
    .isIn(['android', 'ios', 'web'])
    .withMessage('Platform must be one of: android, ios, web'),
  
  body('deviceInfo')
    .optional()
    .isObject()
    .withMessage('Device info must be an object'),
  
  body('deviceInfo.model')
    .optional()
    .isString()
    .withMessage('Device model must be a string'),
  
  body('deviceInfo.osVersion')
    .optional()
    .isString()
    .withMessage('OS version must be a string'),
  
  body('deviceInfo.appVersion')
    .optional()
    .isString()
    .withMessage('App version must be a string')
];

const removeTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('FCM token is required')
    .isLength({ min: 100 })
    .withMessage('FCM token must be at least 100 characters long')
];

const sendNotificationValidation = [
  body('userIds')
    .optional()
    .isArray()
    .withMessage('User IDs must be an array')
    .custom((value) => {
      if (value && value.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error('All user IDs must be positive integers');
      }
      return true;
    }),
  
  body('driverIds')
    .optional()
    .isArray()
    .withMessage('Driver IDs must be an array')
    .custom((value) => {
      if (value && value.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error('All driver IDs must be positive integers');
      }
      return true;
    }),
  
  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn([
      'booking_confirmed',
      'driver_assigned',
      'pickup_completed',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'delayed',
      'new_assignment',
      'pickup_reminder',
      'payment_received',
      'general'
    ])
    .withMessage('Invalid notification type'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('body')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Body must be between 1 and 1000 characters'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be one of: low, normal, high'),
  
  body('channels')
    .optional()
    .isArray()
    .withMessage('Channels must be an array')
    .custom((value) => {
      const validChannels = ['push', 'email', 'sms'];
      if (value && value.some(channel => !validChannels.includes(channel))) {
        throw new Error('Invalid notification channel');
      }
      return true;
    })
];

const notificationHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('status')
    .optional()
    .isIn(['pending', 'sent', 'delivered', 'failed', 'read'])
    .withMessage('Invalid status filter'),
  
  query('type')
    .optional()
    .isIn([
      'booking_confirmed',
      'driver_assigned',
      'pickup_completed',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'delayed',
      'new_assignment',
      'pickup_reminder',
      'payment_received',
      'general'
    ])
    .withMessage('Invalid notification type filter')
];

const markAsReadValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
];

const sendTestNotificationValidation = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  body('driverId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Driver ID must be a positive integer'),
  
  body()
    .custom((value) => {
      if (!value.userId && !value.driverId) {
        throw new Error('Either userId or driverId must be provided');
      }
      if (value.userId && value.driverId) {
        throw new Error('Cannot specify both userId and driverId');
      }
      return true;
    })
];

const subscribeToTopicValidation = [
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Topic can only contain alphanumeric characters, underscores, and hyphens')
    .isLength({ min: 1, max: 900 })
    .withMessage('Topic must be between 1 and 900 characters'),
  
  body('tokens')
    .optional()
    .isArray()
    .withMessage('Tokens must be an array')
    .custom((value) => {
      if (value && value.length > 1000) {
        throw new Error('Cannot subscribe more than 1000 tokens at once');
      }
      return true;
    })
];

const unsubscribeFromTopicValidation = [
  body('topic')
    .notEmpty()
    .withMessage('Topic is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Topic can only contain alphanumeric characters, underscores, and hyphens')
    .isLength({ min: 1, max: 900 })
    .withMessage('Topic must be between 1 and 900 characters'),
  
  body('tokens')
    .optional()
    .isArray()
    .withMessage('Tokens must be an array')
    .custom((value) => {
      if (value && value.length > 1000) {
        throw new Error('Cannot unsubscribe more than 1000 tokens at once');
      }
      return true;
    })
];

module.exports = {
  registerTokenValidation,
  removeTokenValidation,
  sendNotificationValidation,
  notificationHistoryValidation,
  markAsReadValidation,
  sendTestNotificationValidation,
  subscribeToTopicValidation,
  unsubscribeFromTopicValidation
};