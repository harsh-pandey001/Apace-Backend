import api from './api';

class NotificationService {
  /**
   * Get notification service status
   */
  async getStatus() {
    try {
      const response = await api.get('/notifications/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification status:', error);
      throw error;
    }
  }

  /**
   * Send notification to users/drivers
   */
  async sendNotification(notificationData) {
    try {
      const response = await api.post('/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(userId = null, driverId = null) {
    try {
      const response = await api.post('/notifications/test', {
        userId,
        driverId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get notification types for dropdown
   */
  getNotificationTypes() {
    return [
      { value: 'booking_confirmed', label: 'Booking Confirmed' },
      { value: 'driver_assigned', label: 'Driver Assigned' },
      { value: 'pickup_completed', label: 'Pickup Completed' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'out_for_delivery', label: 'Out for Delivery' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'delayed', label: 'Delayed' },
      { value: 'new_assignment', label: 'New Assignment (Driver)' },
      { value: 'pickup_reminder', label: 'Pickup Reminder (Driver)' },
      { value: 'payment_received', label: 'Payment Received (Driver)' },
      { value: 'general', label: 'General' }
    ];
  }

  /**
   * Get notification priority options
   */
  getPriorityOptions() {
    return [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' }
    ];
  }

  /**
   * Get notification channel options
   */
  getChannelOptions() {
    return [
      { value: 'push', label: 'Push Notification' },
      { value: 'email', label: 'Email (Coming Soon)' },
      { value: 'sms', label: 'SMS (Coming Soon)' }
    ];
  }

  /**
   * Format notification data for sending
   */
  formatNotificationData({
    userIds = [],
    driverIds = [],
    type,
    title,
    body,
    data = {},
    priority = 'normal',
    channels = ['push']
  }) {
    return {
      userIds: userIds.filter(id => id && !isNaN(id)).map(id => parseInt(id)),
      driverIds: driverIds.filter(id => id && !isNaN(id)).map(id => parseInt(id)),
      type,
      title: type === 'general' ? title : undefined,
      body: type === 'general' ? body : undefined,
      data,
      priority,
      channels
    };
  }

  /**
   * Validate notification data
   */
  validateNotificationData(notificationData) {
    const errors = [];

    if (!notificationData.userIds?.length && !notificationData.driverIds?.length) {
      errors.push('At least one user ID or driver ID must be provided');
    }

    if (!notificationData.type) {
      errors.push('Notification type is required');
    }

    if (notificationData.type === 'general') {
      if (!notificationData.title?.trim()) {
        errors.push('Title is required for general notifications');
      }
      if (!notificationData.body?.trim()) {
        errors.push('Body is required for general notifications');
      }
    }

    return errors;
  }
}

const notificationService = new NotificationService();
export default notificationService;