'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('vehicle_types', 'iconKey', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default',
      validate: {
        isIn: {
          args: [['truck', 'bike', 'car', 'van', 'bus', 'tractor', 'container', 'default']],
          msg: 'Icon key must be one of: truck, bike, car, van, bus, tractor, container, default'
        }
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('vehicle_types', 'iconKey');
  }
};
