'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if the old constraint exists before trying to remove it
      try {
        await queryInterface.removeConstraint('driver_documents', 'driver_documents_ibfk_1');
        console.log('Removed old foreign key constraint');
      } catch (error) {
        console.log('Old constraint does not exist, continuing...');
      }
      
      // Clean up orphaned driver documents that reference non-existent drivers
      await queryInterface.sequelize.query(`
        DELETE dd FROM driver_documents dd 
        LEFT JOIN drivers d ON dd.driver_id = d.id 
        WHERE d.id IS NULL
      `);
      
      console.log('Cleaned up orphaned driver documents');
      
      // Add new foreign key constraint pointing to drivers table
      await queryInterface.addConstraint('driver_documents', {
        fields: ['driver_id'],
        type: 'foreign key',
        name: 'driver_documents_driver_id_fkey',
        references: {
          table: 'drivers',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      console.log('Successfully updated driver_documents foreign key constraint');
    } catch (error) {
      console.error('Error updating driver_documents foreign key:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove the new constraint
      await queryInterface.removeConstraint('driver_documents', 'driver_documents_driver_id_fkey');
      
      // Add back the old constraint (pointing to users table)
      await queryInterface.addConstraint('driver_documents', {
        fields: ['driver_id'],
        type: 'foreign key',
        name: 'driver_documents_ibfk_1',
        references: {
          table: 'users',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    } catch (error) {
      console.error('Error reverting driver_documents foreign key:', error);
      throw error;
    }
  }
};