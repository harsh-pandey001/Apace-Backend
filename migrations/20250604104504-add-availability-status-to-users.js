'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'availability_status', {
      type: Sequelize.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline'
    });

    await queryInterface.addIndex('users', ['availability_status']);
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.removeColumn('users', 'availability_status');
  }
};
