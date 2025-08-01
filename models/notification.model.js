const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  shipmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'shipments',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  type: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data payload for the notification'
  },
  channels: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['push'],
    comment: 'Array of channels used: push, email, sms'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
    allowNull: false,
    defaultValue: 'pending'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fcmMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'FCM message ID for tracking'
  },
  fcmResponse: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'FCM response data'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if notification failed'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high'),
    allowNull: false,
    defaultValue: 'normal'
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'For scheduled notifications (future feature)'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['userId'],
      name: 'notifications_user_id_idx'
    },
    {
      fields: ['driverId'],
      name: 'notifications_driver_id_idx'
    },
    {
      fields: ['shipmentId'],
      name: 'notifications_shipment_id_idx'
    },
    {
      fields: ['type'],
      name: 'notifications_type_idx'
    },
    {
      fields: ['status'],
      name: 'notifications_status_idx'
    },
    {
      fields: ['priority'],
      name: 'notifications_priority_idx'
    },
    {
      fields: ['createdAt'],
      name: 'notifications_created_at_idx'
    },
    {
      fields: ['sentAt'],
      name: 'notifications_sent_at_idx'
    }
  ],
  validate: {
    userOrDriverRequired() {
      if (!this.userId && !this.driverId) {
        throw new Error('Either userId or driverId must be provided');
      }
    }
  }
});

// Instance methods
Notification.prototype.markAsSent = function(fcmMessageId = null, fcmResponse = null) {
  return this.update({
    status: 'sent',
    sentAt: new Date(),
    fcmMessageId,
    fcmResponse
  });
};

Notification.prototype.markAsDelivered = function() {
  return this.update({
    status: 'delivered'
  });
};

Notification.prototype.markAsRead = function() {
  return this.update({
    status: 'read',
    readAt: new Date()
  });
};

Notification.prototype.markAsFailed = function(error) {
  return this.update({
    status: 'failed',
    error: error.toString()
  });
};

// Class methods
Notification.findUnreadForUser = function(userId, limit = 50, offset = 0) {
  return this.findAndCountAll({
    where: {
      userId,
      status: ['sent', 'delivered']
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.findUnreadForDriver = function(driverId, limit = 50, offset = 0) {
  return this.findAndCountAll({
    where: {
      driverId,
      status: ['sent', 'delivered']
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.getHistoryForUser = function(userId, limit = 100, offset = 0) {
  return this.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.getHistoryForDriver = function(driverId, limit = 100, offset = 0) {
  return this.findAndCountAll({
    where: { driverId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Notification.findPendingNotifications = function(limit = 100) {
  return this.findAll({
    where: {
      status: 'pending'
    },
    order: [['priority', 'DESC'], ['createdAt', 'ASC']],
    limit
  });
};

module.exports = Notification;