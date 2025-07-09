'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Try to drop the existing foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint('vehicles', 'vehicles_ibfk_1');
    } catch (error) {
      console.log('Foreign key constraint vehicles_ibfk_1 does not exist or was already dropped');
    }
    
    // Step 2: Clear existing invalid driverIds (set to NULL)
    await queryInterface.sequelize.query('UPDATE vehicles SET driverId = NULL WHERE driverId IS NOT NULL;');
    
    // Step 3: Add new foreign key constraint to drivers table
    await queryInterface.addConstraint('vehicles', {
      fields: ['driverId'],
      type: 'foreign key',
      name: 'vehicles_driverId_fkey',
      references: {
        table: 'drivers',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the new foreign key constraint
    await queryInterface.removeConstraint('vehicles', 'vehicles_driverId_fkey');
    
    // Restore the original foreign key constraint to users table
    await queryInterface.addConstraint('vehicles', {
      fields: ['driverId'],
      type: 'foreign key',
      name: 'vehicles_ibfk_1',
      references: {
        table: 'users',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};