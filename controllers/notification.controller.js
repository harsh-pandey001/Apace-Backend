const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const fcmService = require('../services/fcmService');
const { DeviceToken, Notification } = require('../models');
const logger = require('../utils/logger');

class NotificationController {
  /**
   * Register a device token for push notifications
   */
  async registerToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { token, platform = 'android', deviceInfo = {} } = req.body;
      const { userId, driverId } = req.user; // From auth middleware

      // Determine if this is a user or driver request
      const targetUserId = userId || null;
      const targetDriverId = driverId || null;

      if (!targetUserId && !targetDriverId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const deviceToken = await notificationService.registerDeviceToken(
        targetUserId,
        targetDriverId,
        token,
        platform,
        deviceInfo
      );

      res.status(201).json({
        success: true,
        message: 'Device token registered successfully',
        data: {
          id: deviceToken.id,
          platform: deviceToken.platform,
          isActive: deviceToken.isActive,
          createdAt: deviceToken.createdAt
        }
      });

    } catch (error) {
      logger.error('Failed to register device token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register device token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Remove a device token
   */
  async removeToken(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { token } = req.body;
      const success = await notificationService.removeDeviceToken(token);

      if (success) {
        res.json({
          success: true,
          message: 'Device token removed successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Device token not found'
        });
      }

    } catch (error) {
      logger.error('Failed to remove device token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove device token',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Send a notification to users/drivers (Admin only)
   */
  async sendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userIds = [], driverIds = [], type, title, body, data = {}, priority = 'normal' } = req.body;

      if (userIds.length === 0 && driverIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one user ID or driver ID must be provided'
        });
      }

      const results = [];

      // Send to users
      for (const userId of userIds) {
        try {
          const templateData = type === 'general' ? { title, body } : data;
          const result = await notificationService.sendToUser(userId, type, templateData, data);
          results.push({ userId, ...result });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      // Send to drivers
      for (const driverId of driverIds) {
        try {
          const templateData = type === 'general' ? { title, body } : data;
          const result = await notificationService.sendToDriver(driverId, type, templateData, data);
          results.push({ driverId, ...result });
        } catch (error) {
          results.push({ driverId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        success: successCount > 0,
        message: `Sent ${successCount} notifications successfully, ${failureCount} failed`,
        data: {
          successCount,
          failureCount,
          results
        }
      });

    } catch (error) {
      logger.error('Failed to send notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get notification history for the authenticated user/driver
   */
  async getNotificationHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { limit = 50, offset = 0, status, type } = req.query;
      const { userId, driverId } = req.user;

      let result;
      if (userId) {
        result = await notificationService.getUserNotificationHistory(userId, parseInt(limit), parseInt(offset));
      } else if (driverId) {
        result = await notificationService.getDriverNotificationHistory(driverId, parseInt(limit), parseInt(offset));
      } else {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Apply additional filters if provided
      let notifications = result.rows;
      if (status) {
        notifications = notifications.filter(n => n.status === status);
      }
      if (type) {
        notifications = notifications.filter(n => n.type === type);
      }

      res.json({
        success: true,
        data: {
          notifications,
          total: result.count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error) {
      logger.error('Failed to get notification history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { userId, driverId } = req.user;

      const notification = await notificationService.markNotificationAsRead(
        parseInt(id),
        userId,
        driverId
      );

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          id: notification.id,
          status: notification.status,
          readAt: notification.readAt
        }
      });

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Notification not found or access denied'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to mark notification as read',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId, driverId } = req.body;

      const result = await notificationService.sendTestNotification(userId, driverId);

      res.json({
        success: result.success,
        message: result.success ? 'Test notification sent successfully' : 'Test notification failed',
        data: result
      });

    } catch (error) {
      logger.error('Failed to send test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Subscribe to FCM topic
   */
  async subscribeToTopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { topic, tokens } = req.body;
      const { userId, driverId } = req.user;

      // If no tokens provided, use user's/driver's tokens
      let targetTokens = tokens;
      if (!targetTokens || targetTokens.length === 0) {
        targetTokens = await notificationService.getActiveTokens(userId, driverId);
      }

      if (targetTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active device tokens found'
        });
      }

      const result = await fcmService.subscribeToTopic(targetTokens, topic);

      res.json({
        success: result.successCount > 0,
        message: `Subscribed ${result.successCount} tokens to topic '${topic}', ${result.failureCount} failed`,
        data: {
          topic,
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });

    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to topic',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Unsubscribe from FCM topic
   */
  async unsubscribeFromTopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { topic, tokens } = req.body;
      const { userId, driverId } = req.user;

      // If no tokens provided, use user's/driver's tokens
      let targetTokens = tokens;
      if (!targetTokens || targetTokens.length === 0) {
        targetTokens = await notificationService.getActiveTokens(userId, driverId);
      }

      if (targetTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active device tokens found'
        });
      }

      const result = await fcmService.unsubscribeFromTopic(targetTokens, topic);

      res.json({
        success: result.successCount > 0,
        message: `Unsubscribed ${result.successCount} tokens from topic '${topic}', ${result.failureCount} failed`,
        data: {
          topic,
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });

    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from topic',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get notification service status
   */
  async getStatus(req, res) {
    try {
      const status = notificationService.getStatus();
      
      // Get some basic stats
      const totalNotifications = await Notification.count();
      const pendingNotifications = await Notification.count({ where: { status: 'pending' } });
      const activeTokens = await DeviceToken.count({ where: { isActive: true } });

      res.json({
        success: true,
        data: {
          services: status,
          stats: {
            totalNotifications,
            pendingNotifications,
            activeTokens
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get notification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get device tokens for the authenticated user/driver
   */
  async getDeviceTokens(req, res) {
    try {
      const { userId, driverId } = req.user;

      const tokens = await DeviceToken.findAll({
        where: {
          ...(userId && { userId }),
          ...(driverId && { driverId })
        },
        attributes: ['id', 'platform', 'isActive', 'lastUsed', 'deviceInfo', 'createdAt'],
        order: [['lastUsed', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          tokens,
          count: tokens.length
        }
      });

    } catch (error) {
      logger.error('Failed to get device tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get device tokens',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new NotificationController();