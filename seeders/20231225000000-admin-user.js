'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    
    await queryInterface.bulkInsert('users', [{
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@apace.com',
      password: adminPassword,
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