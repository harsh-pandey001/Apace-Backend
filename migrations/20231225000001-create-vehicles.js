'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('car', 'van', 'truck', 'motorcycle'),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      licensePlate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      capacity: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      maxWeight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      currentLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      currentLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('available', 'in_use', 'maintenance', 'out_of_service'),
        defaultValue: 'available'
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lastMaintenanceDate: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('vehicles');
  }
};