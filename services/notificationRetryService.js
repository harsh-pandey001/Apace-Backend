const cron = require('node-cron');
const { Notification } = require('../models');
const notificationService = require('./notificationService');
const { logger } = require('../utils/logger');

class NotificationRetryService {
  constructor() {
    this.isRunning = false;
    this.retryJob = null;
    this.maxRetries = 3;
    this.retryIntervals = [5, 15, 60]; // minutes: 5min, 15min, 1hour
  }

  /**
   * Start the retry service with scheduled cleanup
   */
  start() {
    if (this.isRunning) {
      logger.warn('Notification retry service is already running');
      return;
    }

    this.isRunning = true;

    // Run retry process every 5 minutes
    this.retryJob = cron.schedule('*/5 * * * *', async () => {
      await this.processFailedNotifications();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Cleanup old notifications daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNotifications();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info('Notification retry service started successfully');
  }

  /**
   * Stop the retry service
   */
  stop() {
    if (this.retryJob) {
      this.retryJob.destroy();
      this.retryJob = null;
    }
    this.isRunning = false;
    logger.info('Notification retry service stopped');
  }

  /**
   * Process failed notifications for retry
   */
  async processFailedNotifications() {
    try {
      const failedNotifications = await this.getFailedNotificationsForRetry();
      
      if (failedNotifications.length === 0) {
        logger.debug('No failed notifications to retry');
        return;
      }

      logger.info(`Processing ${failedNotifications.length} failed notifications for retry`);

      const results = await Promise.allSettled(
        failedNotifications.map(notification => this.retryNotification(notification))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      logger.info(`Retry batch completed: ${successful} successful, ${failed} failed`);

    } catch (error) {
      logger.error('Error processing failed notifications:', error);
    }
  }

  /**
   * Get failed notifications eligible for retry
   */
  async getFailedNotificationsForRetry() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      return await Notification.findAll({
        where: {
          status: 'failed',
          retryCount: {
            [require('sequelize').Op.lt]: this.maxRetries
          },
          createdAt: {
            [require('sequelize').Op.gte]: fiveMinutesAgo
          }
        },
        order: [['createdAt', 'ASC']],
        limit: 50 // Process in batches
      });

    } catch (error) {
      logger.error('Error fetching failed notifications:', error);
      return [];
    }
  }

  /**
   * Retry a specific notification
   */
  async retryNotification(notification) {
    try {
      const retryCount = (notification.retryCount || 0) + 1;
      const retryInterval = this.retryIntervals[Math.min(retryCount - 1, this.retryIntervals.length - 1)];
      
      // Check if enough time has passed since last attempt
      const timeSinceLastAttempt = new Date() - new Date(notification.updatedAt);
      const requiredInterval = retryInterval * 60 * 1000; // Convert to milliseconds
      
      if (timeSinceLastAttempt < requiredInterval) {
        logger.debug(`Skipping notification ${notification.id}: retry interval not met`);
        return false;
      }

      logger.info(`Retrying notification ${notification.id} (attempt ${retryCount}/${this.maxRetries})`);

      // Attempt to resend the notification
      const templateData = {
        title: notification.title,
        body: notification.body,
        ...notification.data
      };

      const result = await notificationService.sendNotification({
        userId: notification.userId,
        driverId: notification.driverId,
        type: notification.type,
        templateData,
        additionalData: notification.data || {}
      });

      // Update notification with retry result
      await notification.update({
        retryCount,
        status: result.success ? 'sent' : 'failed',
        error: result.success ? null : this.formatRetryError(result),
        lastRetryAt: new Date(),
        messageId: result.success ? (result.results?.push?.messageId || notification.messageId) : notification.messageId
      });

      if (result.success) {
        logger.info(`Notification ${notification.id} retry succeeded on attempt ${retryCount}`);
      } else {
        logger.warn(`Notification ${notification.id} retry failed on attempt ${retryCount}: ${result.results?.push?.error || 'Unknown error'}`);
      }

      return result.success;

    } catch (error) {
      logger.error(`Error retrying notification ${notification.id}:`, error);
      
      // Update notification with error info
      await notification.update({
        retryCount: (notification.retryCount || 0) + 1,
        error: `Retry error: ${error.message}`,
        lastRetryAt: new Date()
      });

      return false;
    }
  }

  /**
   * Format retry error for storage
   */
  formatRetryError(result) {
    if (result.results?.push?.error) {
      return `Push notification failed: ${result.results.push.error}`;
    }
    return 'Retry failed: Unknown error';
  }

  /**
   * Manually retry a specific notification by ID
   */
  async retryNotificationById(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification) {
        throw new Error(`Notification not found: ${notificationId}`);
      }

      if (notification.status !== 'failed') {
        throw new Error(`Notification ${notificationId} is not in failed status`);
      }

      if ((notification.retryCount || 0) >= this.maxRetries) {
        throw new Error(`Notification ${notificationId} has exceeded maximum retry attempts`);
      }

      return await this.retryNotification(notification);

    } catch (error) {
      logger.error(`Error manually retrying notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup old notifications to prevent database bloat
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedCount = await Notification.destroy({
        where: {
          createdAt: {
            [require('sequelize').Op.lt]: thirtyDaysAgo
          },
          status: {
            [require('sequelize').Op.in]: ['sent', 'failed']
          }
        }
      });

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old notifications`);
      }

    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }

  /**
   * Get retry statistics
   */
  async getRetryStatistics() {
    try {
      const { Op } = require('sequelize');
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const stats = await Notification.findOne({
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
          [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "failed" THEN 1 ELSE 0 END')), 'failed'],
          [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "sent" AND retryCount > 0 THEN 1 ELSE 0 END')), 'retrySuccessful'],
          [require('sequelize').fn('AVG', require('sequelize').col('retryCount')), 'avgRetryCount']
        ],
        where: {
          createdAt: {
            [Op.gte]: twentyFourHoursAgo
          }
        },
        raw: true
      });

      return {
        period: '24 hours',
        totalNotifications: parseInt(stats.total) || 0,
        failedNotifications: parseInt(stats.failed) || 0,
        retriedSuccessfully: parseInt(stats.retrySuccessful) || 0,
        averageRetryCount: parseFloat(stats.avgRetryCount) || 0,
        successRate: stats.total > 0 ? 
          ((stats.total - stats.failed) / stats.total * 100).toFixed(2) + '%' : '0%'
      };

    } catch (error) {
      logger.error('Error getting retry statistics:', error);
      return {
        error: 'Failed to fetch statistics'
      };
    }
  }

  /**
   * Force retry all failed notifications (admin function)
   */
  async retryAllFailedNotifications() {
    try {
      const failedNotifications = await Notification.findAll({
        where: {
          status: 'failed',
          retryCount: {
            [require('sequelize').Op.lt]: this.maxRetries
          }
        },
        limit: 100 // Safety limit
      });

      logger.info(`Force retrying ${failedNotifications.length} failed notifications`);

      const results = await Promise.allSettled(
        failedNotifications.map(notification => this.retryNotification(notification))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      return {
        total: results.length,
        successful,
        failed,
        successRate: results.length > 0 ? (successful / results.length * 100).toFixed(2) + '%' : '0%'
      };

    } catch (error) {
      logger.error('Error force retrying failed notifications:', error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationRetryService = new NotificationRetryService();

module.exports = notificationRetryService;