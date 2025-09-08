'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create device_tokens table
    await queryInterface.createTable('device_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true
      },
      platform: {
        type: Sequelize.ENUM('android', 'ios', 'web'),
        allowNull: false,
        defaultValue: 'android'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastUsed: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deviceInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      shipmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shipments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING(255),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      channels: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: '["push"]'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
        allowNull: false,
        defaultValue: 'pending'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      fcmMessageId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fcmResponse: {
        type: Sequelize.JSON,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high'),
        allowNull: false,
        defaultValue: 'normal'
      },
      scheduledFor: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for device_tokens
    await queryInterface.addIndex('device_tokens', ['userId'], {
      name: 'device_tokens_user_id_idx'
    });
    await queryInterface.addIndex('device_tokens', ['driverId'], {
      name: 'device_tokens_driver_id_idx'
    });
    await queryInterface.addIndex('device_tokens', ['token'], {
      name: 'device_tokens_token_idx',
      unique: true
    });
    await queryInterface.addIndex('device_tokens', ['isActive'], {
      name: 'device_tokens_is_active_idx'
    });
    await queryInterface.addIndex('device_tokens', ['platform'], {
      name: 'device_tokens_platform_idx'
    });

    // Add indexes for notifications
    await queryInterface.addIndex('notifications', ['userId'], {
      name: 'notifications_user_id_idx'
    });
    await queryInterface.addIndex('notifications', ['driverId'], {
      name: 'notifications_driver_id_idx'
    });
    await queryInterface.addIndex('notifications', ['shipmentId'], {
      name: 'notifications_shipment_id_idx'
    });
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'notifications_type_idx'
    });
    await queryInterface.addIndex('notifications', ['status'], {
      name: 'notifications_status_idx'
    });
    await queryInterface.addIndex('notifications', ['priority'], {
      name: 'notifications_priority_idx'
    });
    await queryInterface.addIndex('notifications', ['createdAt'], {
      name: 'notifications_created_at_idx'
    });
    await queryInterface.addIndex('notifications', ['sentAt'], {
      name: 'notifications_sent_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('notifications', 'notifications_sent_at_idx');
    await queryInterface.removeIndex('notifications', 'notifications_created_at_idx');
    await queryInterface.removeIndex('notifications', 'notifications_priority_idx');
    await queryInterface.removeIndex('notifications', 'notifications_status_idx');
    await queryInterface.removeIndex('notifications', 'notifications_type_idx');
    await queryInterface.removeIndex('notifications', 'notifications_shipment_id_idx');
    await queryInterface.removeIndex('notifications', 'notifications_driver_id_idx');
    await queryInterface.removeIndex('notifications', 'notifications_user_id_idx');

    await queryInterface.removeIndex('device_tokens', 'device_tokens_platform_idx');
    await queryInterface.removeIndex('device_tokens', 'device_tokens_is_active_idx');
    await queryInterface.removeIndex('device_tokens', 'device_tokens_token_idx');
    await queryInterface.removeIndex('device_tokens', 'device_tokens_driver_id_idx');
    await queryInterface.removeIndex('device_tokens', 'device_tokens_user_id_idx');

    // Drop tables
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('device_tokens');
  }
};