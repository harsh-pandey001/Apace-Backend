const notificationService = require('../services/notificationService');
const { /* User, */ Driver, Vehicle } = require('../models');
const logger = require('../utils/logger');

class NotificationMiddleware {
  /**
   * Send booking confirmation notification
   */
  static async onShipmentCreated(shipment) {
    try {
      if (!shipment.userId) return;

      const templateData = {
        shipmentId: shipment.id,
        pickupTime: shipment.scheduledPickupTime ? 
          new Date(shipment.scheduledPickupTime).toLocaleTimeString() : null,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress
      };

      await notificationService.sendToUser(
        shipment.userId, 
        'booking_confirmed', 
        templateData,
        { shipmentId: shipment.id }
      );

      logger.info(`Booking confirmation sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send booking confirmation:', error);
    }
  }

  /**
   * Send driver assignment notification to both customer and driver
   */
  static async onDriverAssigned(shipment, driverId) {
    try {
      // Get driver and vehicle information
      const driver = await Driver.findByPk(driverId);
      const vehicle = await Vehicle.findOne({ where: { driverId } });

      if (!driver) {
        logger.warn(`Driver not found for assignment: ${driverId}`);
        return;
      }

      // Notify customer about driver assignment
      if (shipment.userId) {
        const customerTemplateData = {
          shipmentId: shipment.id,
          driverName: driver.name,
          rating: driver.rating || '4.5',
          vehicleDetails: vehicle ? 
            `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate}` : 
            'Vehicle details unavailable'
        };

        await notificationService.sendToUser(
          shipment.userId,
          'driver_assigned',
          customerTemplateData,
          { 
            shipmentId: shipment.id,
            driverId: driver.id,
            driverPhone: driver.phone
          }
        );
      }

      // Notify driver about new assignment
      const driverTemplateData = {
        shipmentId: shipment.id,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        pickupArea: this.extractArea(shipment.pickupAddress),
        deliveryArea: this.extractArea(shipment.deliveryAddress),
        amount: shipment.totalAmount,
        scheduledPickupTime: shipment.scheduledPickupTime,
        customerPhone: shipment.customerPhone
      };

      await notificationService.sendToDriver(
        driverId,
        'new_assignment',
        driverTemplateData,
        { 
          shipmentId: shipment.id,
          customerId: shipment.userId
        }
      );

      logger.info(`Driver assignment notifications sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send driver assignment notifications:', error);
    }
  }

  /**
   * Send status update notifications
   */
  static async onStatusUpdate(shipment, oldStatus, newStatus) {
    try {
      // Define status-to-notification-type mapping
      const statusNotificationMap = {
        'in_transit': 'pickup_completed',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'cancelled': 'cancelled'
      };

      const notificationType = statusNotificationMap[newStatus];
      if (!notificationType) {
        logger.debug(`No notification defined for status: ${newStatus}`);
        return;
      }

      // Send to customer
      if (shipment.userId) {
        let templateData;
        
        switch (notificationType) {
        case 'pickup_completed':
          templateData = {
            shipmentId: shipment.id,
            deliveryAddress: shipment.deliveryAddress,
            estimatedDeliveryTime: shipment.estimatedDeliveryTime
          };
          break;
            
        case 'out_for_delivery':
          templateData = {
            shipmentId: shipment.id,
            eta: 30, // Default ETA in minutes
            deliveryAddress: shipment.deliveryAddress,
            driverPhone: shipment.driverPhone
          };
          break;
            
        case 'delivered':
          templateData = {
            shipmentId: shipment.id,
            deliveryAddress: shipment.deliveryAddress
          };
          break;
            
        case 'cancelled':
          templateData = {
            shipmentId: shipment.id,
            reason: shipment.cancellationReason || 'Please contact customer support for details.'
          };
          break;
            
        default:
          templateData = { shipmentId: shipment.id };
        }

        await notificationService.sendToUser(
          shipment.userId,
          notificationType,
          templateData,
          { shipmentId: shipment.id }
        );
      }

      // Send payment confirmation to driver if delivered
      if (newStatus === 'delivered' && shipment.driverId) {
        await notificationService.sendToDriver(
          shipment.driverId,
          'payment_received',
          {
            shipment,
            amount: shipment.totalAmount
          },
          { 
            shipmentId: shipment.id,
            paymentMethod: shipment.paymentMethod || 'cash',
            transactionId: shipment.transactionId
          }
        );
      }

      logger.info(`Status update notifications sent for shipment ${shipment.id}: ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      logger.error('Failed to send status update notifications:', error);
    }
  }

  /**
   * Send pickup reminder to driver
   */
  static async sendPickupReminder(shipment, minutesUntilPickup = 15) {
    try {
      if (!shipment.driverId) return;

      const templateData = {
        shipment,
        minutesUntilPickup
      };

      await notificationService.sendToDriver(
        shipment.driverId,
        'pickup_reminder',
        templateData,
        { 
          shipmentId: shipment.id,
          urgency: minutesUntilPickup <= 5 ? 'high' : 'normal'
        }
      );

      logger.info(`Pickup reminder sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send pickup reminder:', error);
    }
  }

  /**
   * Send delay notification
   */
  static async onDelay(shipment, delayMinutes, reason) {
    try {
      if (!shipment.userId) return;

      const templateData = {
        shipment,
        delayMinutes,
        reason
      };

      await notificationService.sendToUser(
        shipment.userId,
        'delayed',
        templateData,
        { 
          shipmentId: shipment.id,
          delayMinutes,
          reason
        }
      );

      logger.info(`Delay notification sent for shipment ${shipment.id}`);
    } catch (error) {
      logger.error('Failed to send delay notification:', error);
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