const fcmService = require('./fcmService');
const { DeviceToken, Notification, User, Driver, UserPreferences } = require('../models');
const { generateNotificationContent, getNotificationPriority, getNotificationChannels } = require('../utils/notificationTemplates');
const { logger } = require('../utils/logger');

class NotificationService {
  /**
   * Initialize the notification service
   */
  async initialize() {
    const fcmInitialized = await fcmService.initialize();
    if (fcmInitialized) {
      logger.info('Notification Service initialized with FCM support');
    } else {
      logger.warn('Notification Service initialized without FCM support');
    }
    return fcmInitialized;
  }

  /**
   * Send notification to a user
   */
  async sendToUser(userId, type, templateData, additionalData = {}) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserPreferences, as: 'preferences' }]
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      return await this.sendNotification({
        userId,
        type,
        templateData,
        additionalData,
        userPreferences: user.preferences
      });

    } catch (error) {
      logger.error('Failed to send notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to a driver
   */
  async sendToDriver(driverId, type, templateData, additionalData = {}) {
    try {
      const driver = await Driver.findByPk(driverId);

      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }

      return await this.sendNotification({
        driverId,
        type,
        templateData,
        additionalData,
        userPreferences: { pushNotifications: true } // Assume drivers want push notifications
      });

    } catch (error) {
      logger.error('Failed to send notification to driver:', error);
      throw error;
    }
  }

  /**
   * Core notification sending logic
   */
  async sendNotification({ userId = null, driverId = null, type, templateData, additionalData = {}, userPreferences = {} }) {
    try {
      // Generate notification content
      const content = generateNotificationContent(type, templateData, additionalData);
      const priority = getNotificationPriority(type);
      const channels = getNotificationChannels(type, userPreferences);

      // Create notification record
      const notification = await Notification.create({
        userId,
        driverId,
        shipmentId: additionalData.shipmentId || null,
        type,
        title: content.title,
        body: content.body,
        data: content.data,
        channels,
        priority,
        status: 'pending'
      });

      // Send via configured channels
      const results = {};
      
      if (channels.includes('push')) {
        results.push = await this.sendPushNotification(userId, driverId, content, { priority, notification });
      }

      if (channels.includes('email')) {
        results.email = await this.sendEmailNotification(userId, driverId, content, { notification });
      }

      if (channels.includes('sms')) {
        results.sms = await this.sendSMSNotification(userId, driverId, content, { notification });
      }

      // Update notification status based on results
      const anySuccess = Object.values(results).some(result => result && result.success);
      
      if (anySuccess) {
        await notification.markAsSent(
          results.push?.messageId || null,
          results.push?.response || null
        );
      } else {
        await notification.markAsFailed('All channels failed');
      }

      return {
        success: anySuccess,
        notification,
        results
      };

    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(userId, driverId, content, options = {}) {
    try {
      // Ensure FCM is initialized before checking availability
      if (!fcmService.isAvailable()) {
        logger.info('FCM service not available, attempting to initialize...');
        const initialized = await fcmService.initialize();
        if (!initialized) {
          logger.warn('FCM initialization failed, skipping push notification');
          return { success: false, error: 'FCM not available' };
        }
      }

      // Get active device tokens
      const tokens = await this.getActiveTokens(userId, driverId);
      
      if (tokens.length === 0) {
        logger.info(`No active device tokens found for ${userId ? 'user' : 'driver'}: ${userId || driverId}`);
        return { success: false, error: 'No active device tokens' };
      }

      const payload = {
        title: content.title,
        body: content.body,
        data: content.data
      };

      const fcmOptions = {
        priority: options.priority === 'high' ? 'high' : 'normal'
      };

      let result;
      if (tokens.length === 1) {
        result = await fcmService.sendToToken(tokens[0], payload, fcmOptions);
      } else {
        result = await fcmService.sendToMultipleTokens(tokens, payload, fcmOptions);
      }

      // Update token last used timestamp
      if (result.success) {
        await this.updateTokenLastUsed(tokens);
      }

      return result;

    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification (placeholder for future implementation)
   */
  async sendEmailNotification(userId, driverId, content, _options = {}) {
    // TODO: Implement email service integration (SendGrid, NodeMailer, etc.)
    logger.info('Email notification requested but not implemented yet');
    return { success: false, error: 'Email service not implemented' };
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   */
  async sendSMSNotification(userId, driverId, content, _options = {}) {
    // TODO: Implement SMS service integration (Twilio, etc.)
    logger.info('SMS notification requested but not implemented yet');
    return { success: false, error: 'SMS service not implemented' };
  }

  /**
   * Get active device tokens for user or driver
   */
  async getActiveTokens(userId, driverId) {
    try {
      const tokens = await DeviceToken.findAll({
        where: {
          ...(userId && { userId }),
          ...(driverId && { driverId }),
          isActive: true
        },
        attributes: ['token'],
        raw: true
      });

      return tokens.map(t => t.token);
    } catch (error) {
      logger.error('Failed to get active tokens:', error);
      return [];
    }
  }

  /**
   * Update last used timestamp for tokens
   */
  async updateTokenLastUsed(tokens) {
    try {
      await DeviceToken.update(
        { lastUsed: new Date() },
        { where: { token: tokens } }
      );
    } catch (error) {
      logger.error('Failed to update token last used:', error);
    }
  }

  /**
   * Register a new device token
   */
  async registerDeviceToken(userId, driverId, token, platform = 'android', deviceInfo = {}) {
    try {
      // Debug logging
      logger.info(`🔧 Service received - userId: ${userId}, driverId: ${driverId}, token: ${token?.substring(0, 20)}...`);
      
      // Validate token with FCM (if available)
      if (fcmService.isAvailable()) {
        const isValid = await fcmService.validateToken(token);
        if (!isValid) {
          throw new Error('Invalid FCM token');
        }
      }

      // Deactivate old tokens for this user/driver
      logger.info(`🔄 Deactivating old tokens for userId: ${userId}, driverId: ${driverId}`);
      try {
        const deactivateResult = await DeviceToken.deactivateOldTokens(userId, driverId, token);
        logger.info('✅ Deactivate result:', deactivateResult);
      } catch (deactivateError) {
        logger.error('❌ Deactivate error:', deactivateError.message);
        // Continue anyway - deactivation failure shouldn't block registration
      }

      // Create or update token
      logger.info(`🆕 Creating/finding token with userId: ${userId}, driverId: ${driverId}`);
      logger.info(`📋 Defaults object: ${JSON.stringify({ userId, driverId, platform, deviceInfo })}`);
      
      // Clean up null values for Sequelize
      const cleanDefaults = {
        platform,
        deviceInfo,
        isActive: true,
        lastUsed: new Date()
      };
      
      if (userId) cleanDefaults.userId = userId;
      if (driverId) cleanDefaults.driverId = driverId;
      
      logger.info(`🧹 Clean defaults object: ${JSON.stringify(cleanDefaults)}`);
      
      const [deviceToken, created] = await DeviceToken.findOrCreate({
        where: { token },
        defaults: cleanDefaults
      });

      if (!created) {
        // Update existing token
        await deviceToken.update({
          userId,
          driverId,
          platform,
          deviceInfo,
          isActive: true,
          lastUsed: new Date()
        });
      }

      logger.info(`Device token ${created ? 'registered' : 'updated'} for ${userId ? 'user' : 'driver'}: ${userId || driverId}`);
      
      return deviceToken;

    } catch (error) {
      logger.error('Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Remove a device token
   */
  async removeDeviceToken(token) {
    try {
      const result = await DeviceToken.update(
        { isActive: false },
        { where: { token } }
      );

      logger.info(`Device token deactivated: ${token.substring(0, 20)}...`);
      return result[0] > 0; // Returns true if any rows were updated

    } catch (error) {
      logger.error('Failed to remove device token:', error);
      throw error;
    }
  }

  /**
   * Get notification history for user
   */
  async getUserNotificationHistory(userId, limit = 50, offset = 0) {
    try {
      return await Notification.getHistoryForUser(userId, limit, offset);
    } catch (error) {
      logger.error('Failed to get user notification history:', error);
      throw error;
    }
  }

  /**
   * Get notification history for driver
   */
  async getDriverNotificationHistory(driverId, limit = 50, offset = 0) {
    try {
      return await Notification.getHistoryForDriver(driverId, limit, offset);
    } catch (error) {
      logger.error('Failed to get driver notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId, userId = null, driverId = null) {
    try {
      const whereClause = { id: notificationId };
      if (userId) whereClause.userId = userId;
      if (driverId) whereClause.driverId = driverId;

      const notification = await Notification.findOne({ where: whereClause });
      
      if (!notification) {
        throw new Error('Notification not found or access denied');
      }

      await notification.markAsRead();
      return notification;

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId = null, driverId = null) {
    try {
      const testData = {
        title: 'Test Notification',
        body: 'This is a test notification from APACE Transportation',
        customData: { test: true }
      };

      return await this.sendNotification({
        userId,
        driverId,
        type: 'general',
        templateData: testData,
        additionalData: testData
      });

    } catch (error) {
      logger.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId, userId = null, driverId = null) {
    try {
      const whereCondition = {
        id: notificationId
      };

      // Add user/driver filter for security
      if (userId) {
        whereCondition.userId = userId;
      }
      if (driverId) {
        whereCondition.driverId = driverId;
      }

      const deleted = await Notification.destroy({
        where: whereCondition
      });

      if (deleted > 0) {
        logger.info(`Notification ${notificationId} deleted for user: ${userId}, driver: ${driverId}`);
        return true;
      } else {
        logger.warn(`Notification ${notificationId} not found or access denied`);
        return false;
      }

    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user/driver
   */
  async deleteAllNotifications(userId = null, driverId = null) {
    try {
      const whereCondition = {};

      // Add user/driver filter
      if (userId) {
        whereCondition.userId = userId;
      }
      if (driverId) {
        whereCondition.driverId = driverId;
      }

      if (!userId && !driverId) {
        throw new Error('Either userId or driverId must be provided');
      }

      const deletedCount = await Notification.destroy({
        where: whereCondition
      });

      logger.info(`Deleted ${deletedCount} notifications for user: ${userId}, driver: ${driverId}`);
      return {
        success: true,
        deletedCount,
        message: `${deletedCount} notifications deleted successfully`
      };

    } catch (error) {
      logger.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      fcm: fcmService.getStatus(),
      email: { implemented: false },
      sms: { implemented: false }
    };
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;