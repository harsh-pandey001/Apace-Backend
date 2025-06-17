'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('vehicle_types', [
      {
        id: Sequelize.literal('UUID()'),
        vehicleType: 'bike',
        label: 'Bike',
        capacity: 'Up to 5kg',
        basePrice: 50.00,
        pricePerKm: 5.00,
        startingPrice: 20.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        vehicleType: 'car',
        label: 'Car',
        capacity: 'Up to 50kg',
        basePrice: 100.00,
        pricePerKm: 8.00,
        startingPrice: 30.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        vehicleType: 'van',
        label: 'Van',
        capacity: 'Up to 200kg',
        basePrice: 150.00,
        pricePerKm: 12.00,
        startingPrice: 50.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        vehicleType: 'truck',
        label: 'Truck',
        capacity: 'Up to 1000kg',
        basePrice: 300.00,
        pricePerKm: 20.00,
        startingPrice: 80.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        vehicleType: 'mini_truck',
        label: 'Mini Truck',
        capacity: 'Up to 500kg',
        basePrice: 200.00,
        pricePerKm: 10.00,
        startingPrice: 20.00,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('vehicle_types', null, {});
  }
};
