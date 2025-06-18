'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('shipments', 'distance', {
      type: Sequelize.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: 1.0,
          msg: 'Distance must be at least 1 kilometer'
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('shipments', 'distance');
  }
};