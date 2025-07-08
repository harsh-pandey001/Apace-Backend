'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove role column from users table
    await queryInterface.removeColumn('users', 'role');
    
    // Remove availability_status column from users table (only drivers need this)
    await queryInterface.removeColumn('users', 'availability_status');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the role column
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'driver', 'admin']]
      }
    });

    // Add back the availability_status column
    await queryInterface.addColumn('users', 'availability_status', {
      type: Sequelize.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline'
    });
  }
};