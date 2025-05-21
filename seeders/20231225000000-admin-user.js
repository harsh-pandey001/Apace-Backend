'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@apace.com',
      phone: '+1234567890', // Add a phone number since it's required now
      role: 'admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@apace.com' }, {});
  }
};