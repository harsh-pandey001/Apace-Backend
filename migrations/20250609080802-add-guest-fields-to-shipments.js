'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('shipments', 'userType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'authenticated',
      validate: {
        isIn: [['authenticated', 'guest']]
      }
    });

    await queryInterface.addColumn('shipments', 'guestName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('shipments', 'guestPhone', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('shipments', 'guestEmail', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('shipments', 'vehicleType', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Make userId nullable for guest users
    await queryInterface.changeColumn('shipments', 'userId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    // Make scheduledPickupDate optional (will be calculated automatically for guest bookings)
    await queryInterface.changeColumn('shipments', 'scheduledPickupDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('shipments', 'userType');
    await queryInterface.removeColumn('shipments', 'guestName');
    await queryInterface.removeColumn('shipments', 'guestPhone');
    await queryInterface.removeColumn('shipments', 'guestEmail');
    await queryInterface.removeColumn('shipments', 'vehicleType');

    // Revert userId to non-nullable
    await queryInterface.changeColumn('shipments', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    // Revert scheduledPickupDate to non-nullable
    await queryInterface.changeColumn('shipments', 'scheduledPickupDate', {
      type: Sequelize.DATE,
      allowNull: false
    });
  }
};
