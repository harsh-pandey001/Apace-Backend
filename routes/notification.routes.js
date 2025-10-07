const express = require('express');
const router = express.Router();

// Load controller with fallback
let notificationController;
try {
  console.log('🔍 Loading notification controller...');
  const controller = require('../controllers/notification.controller');
  console.log('✓ Notification controller loaded successfully');
  console.log('✓ registerToken type:', typeof controller.registerToken);
  
  // Bind all methods properly to avoid 'this' context issues
  notificationController = {
    registerToken: controller.registerToken.bind(controller),
    removeToken: controller.removeToken.bind(controller),
    getDeviceTokens: controller.getDeviceTokens.bind(controller),
    getNotificationHistory: controller.getNotificationHistory.bind(controller),
    markAsRead: controller.markAsRead.bind(controller),
    deleteNotification: controller.deleteNotification.bind(controller),
    deleteAllNotifications: controller.deleteAllNotifications.bind(controller),
    subscribeToTopic: controller.subscribeToTopic.bind(controller),
    unsubscribeFromTopic: controller.unsubscribeFromTopic.bind(controller),
    getStatus: controller.getStatus.bind(controller),
    sendNotification: controller.sendNotification.bind(controller),
    sendTestNotification: controller.sendTestNotification.bind(controller)
  };
  console.log('✓ Methods bound successfully');
} catch (error) {
  console.error('❌ Failed to load notification controller, using fallback:', error.message);
  
  // Provide fallback controller methods
  notificationController = {
    registerToken: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    removeToken: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    getDeviceTokens: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    getNotificationHistory: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    markAsRead: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    deleteNotification: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    deleteAllNotifications: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    subscribeToTopic: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    unsubscribeFromTopic: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    getStatus: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    sendNotification: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' }),
    sendTestNotification: (req, res) => res.status(503).json({ success: false, message: 'Notification service temporarily unavailable' })
  };
}
const authMiddleware = require('../middleware/auth');

// Load validations with fallback
let validations;
try {
  validations = require('../validations/notification.validation');
  console.log('✓ Notification validations loaded');
} catch (error) {
  console.error('❌ Failed to load notification validations:', error.message);
  // Provide empty validation arrays as fallback
  validations = {
    registerTokenValidation: [],
    removeTokenValidation: [],
    sendNotificationValidation: [],
    notificationHistoryValidation: [],
    markAsReadValidation: [],
    sendTestNotificationValidation: [],
    subscribeToTopicValidation: [],
    unsubscribeFromTopicValidation: [],
    deleteNotificationValidation: []
  };
}

const {
  registerTokenValidation,
  removeTokenValidation,
  sendNotificationValidation,
  notificationHistoryValidation,
  markAsReadValidation,
  sendTestNotificationValidation,
  subscribeToTopicValidation,
  unsubscribeFromTopicValidation,
  deleteNotificationValidation
} = validations;

// Middleware to check if user is authenticated
const requireAuth = authMiddleware.protect;

// Middleware to check if user is admin (for sending notifications)
const requireAdmin = authMiddleware.restrictTo('admin');

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register a device token for push notifications
 * @access  Private (User/Driver)
 */
router.post('/register-token', 
  requireAuth, 
  registerTokenValidation, 
  notificationController.registerToken
);

/**
 * @route   DELETE /api/notifications/remove-token
 * @desc    Remove a device token
 * @access  Private (User/Driver)
 */
router.delete('/remove-token', 
  requireAuth, 
  removeTokenValidation, 
  notificationController.removeToken
);

/**
 * @route   GET /api/notifications/tokens
 * @desc    Get device tokens for authenticated user/driver
 * @access  Private (User/Driver)
 */
router.get('/tokens', 
  requireAuth, 
  notificationController.getDeviceTokens
);

/**
 * @route   GET /api/notifications/history
 * @desc    Get notification history for authenticated user/driver
 * @access  Private (User/Driver)
 */
router.get('/history', 
  requireAuth, 
  notificationHistoryValidation, 
  notificationController.getNotificationHistory
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private (User/Driver)
 */
router.put('/:id/read', 
  requireAuth, 
  markAsReadValidation, 
  notificationController.markAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a specific notification
 * @access  Private (User/Driver)
 */
router.delete('/:id', 
  requireAuth,
  deleteNotificationValidation, 
  notificationController.deleteNotification
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for authenticated user/driver
 * @access  Private (User/Driver)
 */
router.delete('/', 
  requireAuth, 
  notificationController.deleteAllNotifications
);

/**
 * @route   POST /api/notifications/subscribe-topic
 * @desc    Subscribe to FCM topic
 * @access  Private (User/Driver)
 */
router.post('/subscribe-topic', 
  requireAuth, 
  subscribeToTopicValidation, 
  notificationController.subscribeToTopic
);

/**
 * @route   POST /api/notifications/unsubscribe-topic
 * @desc    Unsubscribe from FCM topic
 * @access  Private (User/Driver)
 */
router.post('/unsubscribe-topic', 
  requireAuth, 
  unsubscribeFromTopicValidation, 
  notificationController.unsubscribeFromTopic
);

/**
 * @route   GET /api/notifications/status
 * @desc    Get notification service status
 * @access  Private (Admin)
 */
router.get('/status', 
  requireAuth, 
  requireAdmin, 
  notificationController.getStatus
);

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification to users/drivers (Admin only)
 * @access  Private (Admin)
 */
router.post('/send', 
  requireAuth, 
  requireAdmin, 
  sendNotificationValidation, 
  notificationController.sendNotification
);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (Admin only)
 * @access  Private (Admin)
 */
router.post('/test', 
  requireAuth, 
  requireAdmin, 
  sendTestNotificationValidation, 
  notificationController.sendTestNotification
);

module.exports = router;