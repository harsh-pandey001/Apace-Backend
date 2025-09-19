const admin = require('firebase-admin');
const { DeviceToken } = require('../models');
const { logger } = require('../utils/logger');

class FCMService {
  constructor() {
    this.initialized = false;
    this.app = null;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      const fcmEnabled = process.env.FCM_ENABLED === 'true';
      if (!fcmEnabled) {
        logger.info('FCM is disabled via environment variable');
        return false;
      }

      const projectId = process.env.FCM_PROJECT_ID;
      const serviceAccountKey = process.env.FCM_SERVICE_ACCOUNT_KEY;

      if (!projectId || !serviceAccountKey) {
        logger.warn('FCM configuration missing. FCM_PROJECT_ID and FCM_SERVICE_ACCOUNT_KEY required');
        return false;
      }

      // Parse service account key (could be base64 encoded or JSON string)
      let serviceAccount;
      try {
        // Try to decode from base64 first
        const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch (error) {
        try {
          // Try to parse as JSON directly
          serviceAccount = JSON.parse(serviceAccountKey);
        } catch (parseError) {
          logger.error('Invalid FCM service account key format', parseError);
          return false;
        }
      }

      // Initialize Firebase Admin
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });

      this.initialized = true;
      logger.info('FCM Service initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize FCM Service:', error);
      return false;
    }
  }

  /**
   * Check if FCM is available and initialized
   */
  isAvailable() {
    return this.initialized && this.app !== null;
  }

  /**
   * Send notification to a single device token
   */
  async sendToToken(token, payload, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('FCM Service not initialized');
      }

      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data ? this.convertDataToStrings(payload.data) : {},
        android: {
          priority: options.priority || 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: options.badge || 1
            }
          }
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png'
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`FCM message sent successfully. Message ID: ${response}`);
      
      return {
        success: true,
        messageId: response,
        token: token
      };

    } catch (error) {
      logger.error('Failed to send FCM message:', error);
      
      // Handle invalid token errors
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        await this.markTokenAsInvalid(token);
      }

      return {
        success: false,
        error: error.message,
        token: token
      };
    }
  }

  /**
   * Send notification to multiple device tokens
   */
  async sendToMultipleTokens(tokens, payload, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('FCM Service not initialized');
      }

      if (!tokens || tokens.length === 0) {
        logger.warn('No tokens provided for multicast message');
        return { success: false, error: 'No tokens provided' };
      }

      const message = {
        tokens: tokens,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data ? this.convertDataToStrings(payload.data) : {},
        android: {
          priority: options.priority || 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: options.badge || 1
            }
          }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      
      logger.info(`FCM multicast sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);

      // Handle invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && 
              (resp.error.code === 'messaging/registration-token-not-registered' ||
               resp.error.code === 'messaging/invalid-registration-token')) {
            invalidTokens.push(tokens[idx]);
          }
        });
        
        if (invalidTokens.length > 0) {
          await this.markMultipleTokensAsInvalid(invalidTokens);
        }
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };

    } catch (error) {
      logger.error('Failed to send FCM multicast message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic, payload, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('FCM Service not initialized');
      }

      const message = {
        topic: topic,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data ? this.convertDataToStrings(payload.data) : {},
        android: {
          priority: options.priority || 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`FCM topic message sent successfully. Message ID: ${response}`);
      
      return {
        success: true,
        messageId: response,
        topic: topic
      };

    } catch (error) {
      logger.error('Failed to send FCM topic message:', error);
      return {
        success: false,
        error: error.message,
        topic: topic
      };
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.isAvailable()) {
        throw new Error('FCM Service not initialized');
      }

      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      logger.info(`Subscribed to topic ${topic}. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      
      return response;
    } catch (error) {
      logger.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.isAvailable()) {
        throw new Error('FCM Service not initialized');
      }

      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed from topic ${topic}. Success: ${response.successCount}, Failed: ${response.failureCount}`);
      
      return response;
    } catch (error) {
      logger.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }

  /**
   * Validate a registration token
   */
  async validateToken(token) {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      // Send a test message with dry run
      const message = {
        token: token,
        notification: {
          title: 'Test',
          body: 'Test message'
        },
        android: {
          priority: 'high'
        }
      };

      await admin.messaging().send(message, true); // dry run
      return true;
    } catch (error) {
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        return false;
      }
      // Other errors might be temporary, so we consider the token valid
      return true;
    }
  }

  /**
   * Convert data object to strings (FCM requirement)
   */
  convertDataToStrings(data) {
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        stringData[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }
    return stringData;
  }

  /**
   * Mark a device token as invalid
   */
  async markTokenAsInvalid(token) {
    try {
      await DeviceToken.update(
        { isActive: false },
        { where: { token: token } }
      );
      logger.info(`Marked token as invalid: ${token.substring(0, 20)}...`);
    } catch (error) {
      logger.error('Failed to mark token as invalid:', error);
    }
  }

  /**
   * Mark multiple device tokens as invalid
   */
  async markMultipleTokensAsInvalid(tokens) {
    try {
      await DeviceToken.update(
        { isActive: false },
        { where: { token: tokens } }
      );
      logger.info(`Marked ${tokens.length} tokens as invalid`);
    } catch (error) {
      logger.error('Failed to mark multiple tokens as invalid:', error);
    }
  }

  /**
   * Get FCM service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      available: this.isAvailable(),
      projectId: process.env.FCM_PROJECT_ID || null,
      enabled: process.env.FCM_ENABLED === 'true'
    };
  }
}

// Create singleton instance
const fcmService = new FCMService();

module.exports = fcmService;