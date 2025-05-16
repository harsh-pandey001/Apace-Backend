'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make estimatedDeliveryDate nullable
    await queryInterface.changeColumn('shipments', 'estimatedDeliveryDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: Make estimatedDeliveryDate required again
    await queryInterface.changeColumn('shipments', 'estimatedDeliveryDate', {
      type: Sequelize.DATE,
      allowNull: false
    });
  }
};