'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      trackingNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM(
          'pending', 
          'in_transit', 
          'out_for_delivery', 
          'delivered', 
          'failed', 
          'cancelled'
        ),
        defaultValue: 'pending'
      },
      pickupAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      pickupLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      pickupLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      deliveryLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      deliveryLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      scheduledPickupDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      estimatedDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actualPickupDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      dimensions: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specialInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vehicleId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shipments');
  }
};