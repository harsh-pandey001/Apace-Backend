'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert admin into the new admins table
    await queryInterface.bulkInsert('admins', [{
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@apace.com',
      phone: '1234567890',
      active: true,
      profilePicture: null,
      permissions: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admins', { email: 'admin@apace.com' }, {});
  }
};