const notificationService = require('../services/notificationService');
const { User, Driver, Vehicle } = require('../models');
const { logger } = require('../utils/logger');

class NotificationMiddleware {
  /**
   * Send booking confirmation notification when shipment is created
   */
  static async onShipmentCreated(shipment) {
    try {
      if (!shipment.userId) {
        logger.info(`Skipping booking confirmation for guest shipment ${shipment.id}`);
        return;
      }

      // Get user details for notification
      const user = await User.findByPk(shipment.userId);
      if (!user) {
        logger.warn(`User not found for shipment ${shipment.id}`);
        return;
      }

      const templateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        pickupTime: shipment.scheduledPickupDate ? 
          new Date(shipment.scheduledPickupDate).toLocaleString() : 'To be scheduled',
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        vehicleType: shipment.vehicleType,
        weight: shipment.weight,
        price: shipment.price,
        distance: shipment.distance
      };

      const additionalData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        userId: shipment.userId,
        priority: 'normal',
        actionRequired: false
      };

      await notificationService.sendToUser(
        shipment.userId, 
        'booking_confirmed', 
        templateData,
        additionalData
      );

      logger.info(`Booking confirmation sent for shipment ${shipment.id} to user ${shipment.userId}`);
    } catch (error) {
      logger.error('Failed to send booking confirmation:', error);
      // Don't throw error to prevent breaking the shipment creation process
    }
  }

  /**
   * Send driver assignment notification to both customer and driver
   */
  static async onDriverAssigned(shipment, driverId) {
    try {
      // Get driver, vehicle, and user information
      const [driver, vehicle, user] = await Promise.all([
        Driver.findByPk(driverId),
        Vehicle.findOne({ where: { driverId } }),
        shipment.userId ? User.findByPk(shipment.userId) : null
      ]);

      if (!driver) {
        logger.warn(`Driver not found for assignment: ${driverId}`);
        return;
      }

      const currentTime = new Date();
      const estimatedPickupTime = shipment.scheduledPickupDate || 
        new Date(currentTime.getTime() + 30 * 60 * 1000); // Default 30 minutes from now

      // Notify customer about driver assignment (only for authenticated users)
      if (shipment.userId && user) {
        const customerTemplateData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          customerName: `${user.firstName} ${user.lastName}`,
          driverName: driver.name,
          driverPhone: driver.phone,
          rating: driver.rating || '4.5',
          vehicleNumber: driver.vehicleNumber || vehicle?.vehicleNumber || 'N/A',
          vehicleType: driver.vehicleType,
          vehicleDetails: vehicle ? 
            `${vehicle.type} - ${vehicle.vehicleNumber}` : 
            `${driver.vehicleType} - ${driver.vehicleNumber}`,
          estimatedPickupTime: estimatedPickupTime.toLocaleString(),
          pickupAddress: shipment.pickupAddress,
          deliveryAddress: shipment.deliveryAddress
        };

        const customerAdditionalData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          driverId: driver.id,
          driverPhone: driver.phone,
          vehicleId: vehicle?.id,
          priority: 'high',
          actionRequired: false,
          category: 'driver_assignment'
        };

        await notificationService.sendToUser(
          shipment.userId,
          'driver_assigned',
          customerTemplateData,
          customerAdditionalData
        );

        logger.info(`Driver assignment notification sent to user ${shipment.userId} for shipment ${shipment.id}`);
      }

      // Notify driver about new assignment
      const driverTemplateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        customerName: user ? `${user.firstName} ${user.lastName}` : 
          (shipment.guestName || 'Guest Customer'),
        customerPhone: user?.phone || shipment.guestPhone || 'N/A',
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        pickupArea: this.extractArea(shipment.pickupAddress),
        deliveryArea: this.extractArea(shipment.deliveryAddress),
        weight: shipment.weight,
        vehicleType: shipment.vehicleType,
        price: shipment.price,
        distance: shipment.distance,
        scheduledPickupTime: estimatedPickupTime.toLocaleString(),
        specialInstructions: shipment.specialInstructions || 'None'
      };

      const driverAdditionalData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        customerId: shipment.userId,
        userType: shipment.userType || 'authenticated',
        priority: 'high',
        actionRequired: true,
        category: 'new_assignment'
      };

      await notificationService.sendToDriver(
        driverId,
        'new_assignment',
        driverTemplateData,
        driverAdditionalData
      );

      logger.info(`New assignment notification sent to driver ${driverId} for shipment ${shipment.id}`);

      // Schedule pickup reminder for 15 minutes before pickup time
      this.schedulePickupReminder(shipment, driver.id, estimatedPickupTime);

    } catch (error) {
      logger.error('Failed to send driver assignment notifications:', error);
      // Don't throw error to prevent breaking the assignment process
    }
  }

  /**
   * Send status update notifications for shipment status changes
   */
  static async onStatusUpdate(shipment, oldStatus, newStatus) {
    try {
      // Define comprehensive status-to-notification-type mapping
      const statusNotificationMap = {
        'pending': null, // No notification needed for initial pending status
        'assigned': 'driver_assigned', // Handled separately in onDriverAssigned
        'in_transit': 'shipment_picked_up',
        'out_for_delivery': 'shipment_in_transit', 
        'delivered': 'shipment_delivered',
        'cancelled': 'shipment_cancelled',
        'delayed': 'shipment_delayed'
      };

      const notificationType = statusNotificationMap[newStatus];
      if (!notificationType) {
        logger.debug(`No notification defined for status transition: ${oldStatus} -> ${newStatus}`);
        return;
      }

      // Get driver and user information for comprehensive notifications
      const [driver, user, vehicle] = await Promise.all([
        shipment.vehicleId ? Vehicle.findOne({ 
          where: { id: shipment.vehicleId }, 
          include: [{ model: Driver, as: 'driverOwner' }] 
        }).then(v => v?.driverOwner) : null,
        shipment.userId ? User.findByPk(shipment.userId) : null,
        shipment.vehicleId ? Vehicle.findByPk(shipment.vehicleId) : null
      ]);

      const currentTime = new Date();

      // Send notification to customer (user)
      if (shipment.userId && user) {
        const customerTemplateData = this.buildCustomerNotificationTemplate(
          shipment, 
          user, 
          driver, 
          vehicle, 
          notificationType, 
          currentTime
        );

        const customerAdditionalData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          oldStatus,
          newStatus,
          driverId: driver?.id,
          driverPhone: driver?.phone,
          priority: this.getNotificationPriority(notificationType),
          actionRequired: notificationType === 'shipment_delivered',
          category: 'status_update',
          timestamp: currentTime.toISOString()
        };

        await notificationService.sendToUser(
          shipment.userId,
          notificationType,
          customerTemplateData,
          customerAdditionalData
        );

        logger.info(`Status update notification sent to user ${shipment.userId}: ${notificationType}`);
      }

      // Send driver-specific notifications
      if (driver?.id) {
        await this.sendDriverStatusNotification(
          shipment, 
          driver.id, 
          notificationType, 
          oldStatus, 
          newStatus,
          user
        );
      }

      // Handle special status-specific actions
      await this.handleSpecialStatusActions(shipment, newStatus, driver, user);

      logger.info(`Status update notifications completed for shipment ${shipment.id}: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      logger.error('Failed to send status update notifications:', error);
      // Don't throw error to prevent breaking status update process
    }
  }

  /**
   * Build customer notification template based on status
   */
  static buildCustomerNotificationTemplate(shipment, user, driver, vehicle, notificationType, currentTime) {
    const baseTemplate = {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      customerName: `${user.firstName} ${user.lastName}`,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      driverName: driver?.name || 'Your Driver',
      driverPhone: driver?.phone || 'N/A',
      vehicleNumber: vehicle?.vehicleNumber || driver?.vehicleNumber || 'N/A',
      vehicleType: shipment.vehicleType,
      currentTime: currentTime.toLocaleString()
    };

    switch (notificationType) {
      case 'shipment_picked_up':
        return {
          ...baseTemplate,
          estimatedDeliveryTime: shipment.estimatedDeliveryDate ? 
            new Date(shipment.estimatedDeliveryDate).toLocaleString() : 
            'Within 2 hours',
          transitStatus: 'Package has been picked up and is on the way'
        };

      case 'shipment_in_transit':
        return {
          ...baseTemplate,
          eta: '30-45 minutes',
          currentLocation: 'En route to delivery address',
          transitStatus: 'Package is out for delivery'
        };

      case 'shipment_delivered':
        return {
          ...baseTemplate,
          deliveryTime: shipment.actualDeliveryDate ? 
            new Date(shipment.actualDeliveryDate).toLocaleString() : 
            currentTime.toLocaleString(),
          deliveryConfirmation: 'Package successfully delivered',
          price: shipment.price,
          paymentStatus: shipment.paymentStatus || 'completed'
        };

      case 'shipment_cancelled':
        return {
          ...baseTemplate,
          cancellationReason: shipment.cancellationReason || 'Cancelled by request',
          refundInfo: 'Refund will be processed within 3-5 business days',
          supportContact: 'Please contact support for assistance'
        };

      case 'shipment_delayed':
        return {
          ...baseTemplate,
          delayReason: shipment.delayReason || 'Unexpected delay occurred',
          newEstimatedTime: shipment.estimatedDeliveryDate ? 
            new Date(new Date(shipment.estimatedDeliveryDate).getTime() + 60*60*1000).toLocaleString() :
            'Updated ETA will be provided shortly',
          apologyMessage: 'We apologize for any inconvenience caused'
        };

      default:
        return baseTemplate;
    }
  }

  /**
   * Send driver-specific status notifications
   */
  static async sendDriverStatusNotification(shipment, driverId, notificationType, oldStatus, newStatus, user) {
    try {
      const driverNotificationMap = {
        'shipment_picked_up': 'pickup_confirmed',
        'shipment_in_transit': 'delivery_in_progress', 
        'shipment_delivered': 'delivery_completed',
        'shipment_cancelled': 'assignment_cancelled'
      };

      const driverNotificationType = driverNotificationMap[notificationType];
      if (!driverNotificationType) {
        return; // No driver notification needed for this status
      }

      const driverTemplateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        customerName: user ? `${user.firstName} ${user.lastName}` : 
          (shipment.guestName || 'Guest Customer'),
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        statusUpdate: `Status changed from ${oldStatus} to ${newStatus}`,
        nextAction: this.getDriverNextAction(newStatus),
        price: shipment.price,
        distance: shipment.distance
      };

      const driverAdditionalData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        customerId: shipment.userId,
        oldStatus,
        newStatus,
        priority: 'normal',
        actionRequired: newStatus === 'delivered',
        category: 'status_confirmation'
      };

      await notificationService.sendToDriver(
        driverId,
        driverNotificationType,
        driverTemplateData,
        driverAdditionalData
      );

      logger.info(`Driver status notification sent: ${driverNotificationType} for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send driver status notification:', error);
    }
  }

  /**
   * Handle special actions for specific status changes
   */
  static async handleSpecialStatusActions(shipment, newStatus, driver, user) {
    try {
      switch (newStatus) {
        case 'delivered':
          // Send payment confirmation to driver
          if (driver?.id) {
            await this.sendPaymentConfirmation(shipment, driver.id);
          }
          // Send delivery rating request to customer (after 5 minutes)
          if (user?.id) {
            setTimeout(() => {
              this.sendRatingRequest(shipment, user.id);
            }, 5 * 60 * 1000); // 5 minutes delay
          }
          break;

        case 'delayed':
          // Send apology and updated ETA
          await this.sendDelayApology(shipment, user?.id, driver?.id);
          break;

        case 'cancelled':
          // Send cancellation confirmation and refund info
          await this.sendCancellationConfirmation(shipment, user?.id, driver?.id);
          break;
      }
    } catch (error) {
      logger.error('Failed to handle special status actions:', error);
    }
  }

  /**
   * Send payment confirmation to driver
   */
  static async sendPaymentConfirmation(shipment, driverId) {
    try {
      const templateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        amount: shipment.price,
        deliveryTime: new Date().toLocaleString(),
        paymentMethod: shipment.paymentMethod || 'cash',
        commission: shipment.driverCommission || 'Standard rate applies'
      };

      const additionalData = {
        shipmentId: shipment.id,
        paymentMethod: shipment.paymentMethod || 'cash',
        transactionId: shipment.transactionId,
        priority: 'normal',
        category: 'payment_confirmation'
      };

      await notificationService.sendToDriver(
        driverId,
        'payment_received',
        templateData,
        additionalData
      );

      logger.info(`Payment confirmation sent to driver ${driverId} for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send payment confirmation:', error);
    }
  }

  /**
   * Send pickup reminder to driver
   */
  static async sendPickupReminder(shipment, driverId, minutesUntilPickup = 15) {
    try {
      const templateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        scheduledTime: shipment.scheduledPickupDate ? 
          new Date(shipment.scheduledPickupDate).toLocaleString() : 'As soon as possible',
        minutesUntilPickup,
        urgencyMessage: minutesUntilPickup <= 5 ? 
          'URGENT: Pickup time approaching!' : 
          'Reminder: Pickup scheduled soon'
      };

      const additionalData = {
        shipmentId: shipment.id,
        urgency: minutesUntilPickup <= 5 ? 'high' : 'normal',
        priority: minutesUntilPickup <= 5 ? 'high' : 'normal',
        actionRequired: true,
        category: 'pickup_reminder'
      };

      await notificationService.sendToDriver(
        driverId,
        'pickup_reminder',
        templateData,
        additionalData
      );

      logger.info(`Pickup reminder sent to driver ${driverId} for shipment ${shipment.id} (${minutesUntilPickup} min)`);
    } catch (error) {
      logger.error('Failed to send pickup reminder:', error);
    }
  }

  /**
   * Schedule pickup reminder for future delivery
   */
  static schedulePickupReminder(shipment, driverId, scheduledPickupTime) {
    try {
      const reminderTime = new Date(scheduledPickupTime.getTime() - 15 * 60 * 1000); // 15 minutes before
      const currentTime = new Date();
      
      if (reminderTime > currentTime) {
        const delay = reminderTime.getTime() - currentTime.getTime();
        
        setTimeout(async () => {
          await this.sendPickupReminder(shipment, driverId, 15);
        }, delay);
        
        logger.info(`Pickup reminder scheduled for shipment ${shipment.id} at ${reminderTime.toLocaleString()}`);
      }
    } catch (error) {
      logger.error('Failed to schedule pickup reminder:', error);
    }
  }

  /**
   * Send payment reminder notifications
   */
  static async sendPaymentReminder(shipment, recipientType = 'user') {
    try {
      const templateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        amount: shipment.price,
        dueDate: shipment.paymentDueDate ? 
          new Date(shipment.paymentDueDate).toLocaleDateString() : 
          'Immediate',
        paymentMethod: shipment.paymentMethod || 'cash',
        deliveryAddress: shipment.deliveryAddress
      };

      const additionalData = {
        shipmentId: shipment.id,
        amount: shipment.price,
        priority: 'high',
        actionRequired: true,
        category: 'payment_reminder'
      };

      if (recipientType === 'user' && shipment.userId) {
        await notificationService.sendToUser(
          shipment.userId,
          'payment_reminder',
          templateData,
          additionalData
        );
        logger.info(`Payment reminder sent to user ${shipment.userId} for shipment ${shipment.id}`);
      }
    } catch (error) {
      logger.error('Failed to send payment reminder:', error);
    }
  }

  /**
   * Send rating request after delivery
   */
  static async sendRatingRequest(shipment, userId) {
    try {
      const templateData = {
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        deliveryDate: new Date().toLocaleDateString(),
        driverName: 'Your driver' // Will be populated by template engine
      };

      const additionalData = {
        shipmentId: shipment.id,
        priority: 'low',
        actionRequired: true,
        category: 'rating_request'
      };

      await notificationService.sendToUser(
        userId,
        'rating_request',
        templateData,
        additionalData
      );

      logger.info(`Rating request sent to user ${userId} for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send rating request:', error);
    }
  }

  /**
   * Send delay apology notification
   */
  static async sendDelayApology(shipment, userId, driverId) {
    try {
      if (userId) {
        const userTemplateData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          originalTime: shipment.scheduledPickupDate ? 
            new Date(shipment.scheduledPickupDate).toLocaleString() : 'Scheduled time',
          newEstimatedTime: 'Will be updated shortly',
          delayReason: shipment.delayReason || 'Unexpected circumstances',
          compensationInfo: 'We appreciate your patience'
        };

        await notificationService.sendToUser(
          userId,
          'delivery_delayed',
          userTemplateData,
          { shipmentId: shipment.id, priority: 'high', category: 'delay_apology' }
        );
      }

      if (driverId) {
        const driverTemplateData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          delayReason: shipment.delayReason || 'Please update status',
          instructions: 'Please contact customer and provide updated ETA'
        };

        await notificationService.sendToDriver(
          driverId,
          'delay_notification',
          driverTemplateData,
          { shipmentId: shipment.id, priority: 'high', actionRequired: true }
        );
      }

      logger.info(`Delay apology sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send delay apology:', error);
    }
  }

  /**
   * Send cancellation confirmation
   */
  static async sendCancellationConfirmation(shipment, userId, driverId) {
    try {
      if (userId) {
        const userTemplateData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          cancellationReason: shipment.cancellationReason || 'Cancelled as requested',
          refundAmount: shipment.price,
          refundTimeline: '3-5 business days',
          supportContact: 'Contact support for assistance'
        };

        await notificationService.sendToUser(
          userId,
          'booking_cancelled',
          userTemplateData,
          { shipmentId: shipment.id, priority: 'high', category: 'cancellation' }
        );
      }

      if (driverId) {
        const driverTemplateData = {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          cancellationReason: shipment.cancellationReason || 'Assignment cancelled',
          message: 'This delivery assignment has been cancelled'
        };

        await notificationService.sendToDriver(
          driverId,
          'assignment_cancelled',
          driverTemplateData,
          { shipmentId: shipment.id, priority: 'normal', category: 'cancellation' }
        );
      }

      logger.info(`Cancellation confirmation sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send cancellation confirmation:', error);
    }
  }

  /**
   * Get notification priority based on type
   */
  static getNotificationPriority(notificationType) {
    const highPriorityTypes = [
      'driver_assigned', 
      'shipment_picked_up', 
      'shipment_delivered', 
      'payment_reminder',
      'pickup_reminder'
    ];
    
    return highPriorityTypes.includes(notificationType) ? 'high' : 'normal';
  }

  /**
   * Get next action for driver based on status
   */
  static getDriverNextAction(status) {
    const actionMap = {
      'pending': 'Prepare for pickup',
      'assigned': 'Head to pickup location',
      'in_transit': 'Proceed to delivery address',
      'out_for_delivery': 'Complete delivery',
      'delivered': 'Mark as completed',
      'cancelled': 'Assignment cancelled'
    };
    
    return actionMap[status] || 'Check app for details';
  }

  /**
   * Send delay notification (legacy method for backward compatibility)
   */
  static async onDelay(shipment, delayMinutes, reason) {
    try {
      // Update shipment with delay information
      if (shipment.update) {
        await shipment.update({ 
          delayReason: reason,
          status: 'delayed'
        });
      }

      // Use the enhanced delay notification system
      await this.sendDelayApology(shipment, shipment.userId, shipment.driverId);

      logger.info(`Delay notification sent for shipment ${shipment.id}: ${delayMinutes} min delay`);
    } catch (error) {
      logger.error('Failed to send delay notification:', error);
    }
  }

  /**
   * Retry notification delivery for failed notifications
   */
  static async retryFailedNotification(notificationId, maxRetries = 3) {
    try {
      const { Notification } = require('../models');
      const notification = await Notification.findByPk(notificationId);
      
      if (!notification || notification.status !== 'failed') {
        logger.warn(`Cannot retry notification ${notificationId}: not found or not failed`);
        return false;
      }

      if (notification.retryCount >= maxRetries) {
        logger.warn(`Max retries exceeded for notification ${notificationId}`);
        return false;
      }

      // Attempt to resend
      const result = await notificationService.sendNotification({
        userId: notification.userId,
        driverId: notification.driverId,
        type: notification.type,
        templateData: {
          title: notification.title,
          body: notification.body
        },
        additionalData: notification.data
      });

      // Update retry count
      await notification.update({ 
        retryCount: (notification.retryCount || 0) + 1,
        status: result.success ? 'sent' : 'failed',
        error: result.success ? null : 'Retry failed'
      });

      logger.info(`Notification ${notificationId} retry ${result.success ? 'succeeded' : 'failed'}`);
      return result.success;

    } catch (error) {
      logger.error('Failed to retry notification:', error);
      return false;
    }
  }

  /**
   * Async notification processing to handle multiple concurrent shipments
   */
  static async processNotificationQueue(notifications) {
    try {
      const results = await Promise.allSettled(
        notifications.map(async (notificationData) => {
          const { type, shipment, additionalParams = {} } = notificationData;
          
          switch (type) {
            case 'shipment_created':
              return await this.onShipmentCreated(shipment);
            case 'driver_assigned':
              return await this.onDriverAssigned(shipment, additionalParams.driverId);
            case 'status_update':
              return await this.onStatusUpdate(shipment, additionalParams.oldStatus, additionalParams.newStatus);
            case 'pickup_reminder':
              return await this.sendPickupReminder(shipment, additionalParams.driverId, additionalParams.minutesUntilPickup);
            case 'payment_reminder':
              return await this.sendPaymentReminder(shipment, additionalParams.recipientType);
            default:
              logger.warn(`Unknown notification type: ${type}`);
              return { success: false, error: 'Unknown notification type' };
          }
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      logger.info(`Notification queue processed: ${successful} successful, ${failed} failed`);
      
      return {
        total: results.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      logger.error('Failed to process notification queue:', error);
      throw error;
    }
  }

  /**
   * Extract area/locality from full address
   */
  static extractArea(address) {
    if (!address) return 'Unknown Area';
    
    // Simple extraction - can be improved with geocoding services
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    
    return address.length > 30 ? address.substring(0, 30) + '...' : address;
  }

  /**
   * Batch send notifications (for admin operations)
   */
  static async sendBatchNotifications(recipients, type, templateData, additionalData = {}) {
    try {
      const results = [];

      for (const recipient of recipients) {
        try {
          let result;
          if (recipient.userId) {
            result = await notificationService.sendToUser(
              recipient.userId,
              type,
              templateData,
              additionalData
            );
          } else if (recipient.driverId) {
            result = await notificationService.sendToDriver(
              recipient.driverId,
              type,
              templateData,
              additionalData
            );
          }
          
          results.push({ ...recipient, success: result?.success || false });
        } catch (error) {
          results.push({ ...recipient, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`Batch notifications sent: ${successCount}/${recipients.length} successful`);

      return {
        success: successCount > 0,
        total: recipients.length,
        successful: successCount,
        failed: recipients.length - successCount,
        results
      };
    } catch (error) {
      logger.error('Failed to send batch notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule pickup reminders for upcoming shipments
   */
  static async scheduleUpcomingPickupReminders() {
    try {
      const { Shipment } = require('../models');
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

      // Find shipments scheduled for pickup in the next 15-30 minutes
      const upcomingShipments = await Shipment.findAll({
        where: {
          status: 'pending',
          scheduledPickupTime: {
            [require('sequelize').Op.between]: [reminderTime, new Date(reminderTime.getTime() + 15 * 60 * 1000)]
          },
          driverId: {
            [require('sequelize').Op.not]: null
          }
        }
      });

      for (const shipment of upcomingShipments) {
        const minutesUntilPickup = Math.round((new Date(shipment.scheduledPickupTime) - now) / (1000 * 60));
        await this.sendPickupReminder(shipment, minutesUntilPickup);
      }

      logger.info(`Processed ${upcomingShipments.length} pickup reminders`);
    } catch (error) {
      logger.error('Failed to schedule pickup reminders:', error);
    }
  }
}

module.exports = NotificationMiddleware;