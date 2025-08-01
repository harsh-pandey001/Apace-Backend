const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth');
const {
  registerTokenValidation,
  removeTokenValidation,
  sendNotificationValidation,
  notificationHistoryValidation,
  markAsReadValidation,
  sendTestNotificationValidation,
  subscribeToTopicValidation,
  unsubscribeFromTopicValidation
} = require('../validations/notification.validation');

// Middleware to check if user is authenticated
const requireAuth = authMiddleware.authenticateToken;

// Middleware to check if user is admin (for sending notifications)
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

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