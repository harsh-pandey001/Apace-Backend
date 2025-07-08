'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('drivers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      availability_status: {
        type: Sequelize.ENUM('online', 'offline'),
        allowNull: false,
        defaultValue: 'offline'
      },
      profilePicture: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicleCapacity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('drivers');
  }
};