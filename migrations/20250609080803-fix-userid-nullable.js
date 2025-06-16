'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop foreign key constraint first
    await queryInterface.removeConstraint('shipments', 'shipments_ibfk_1');
    
    // Make userId nullable
    await queryInterface.changeColumn('shipments', 'userId', {
      type: Sequelize.UUID,
      allowNull: true
    });
    
    // Re-add foreign key constraint with nullable userId
    await queryInterface.addConstraint('shipments', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'shipments_userId_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    // Drop foreign key constraint
    await queryInterface.removeConstraint('shipments', 'shipments_userId_fkey');
    
    // Make userId non-nullable again
    await queryInterface.changeColumn('shipments', 'userId', {
      type: Sequelize.UUID,
      allowNull: false
    });
    
    // Re-add foreign key constraint
    await queryInterface.addConstraint('shipments', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'shipments_ibfk_1',
      references: {
        table: 'users',
        field: 'id'
      }
    });
  }
};