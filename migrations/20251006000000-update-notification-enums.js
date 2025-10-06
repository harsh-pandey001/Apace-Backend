'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // For MySQL, we need to modify the ENUM by altering the column
      
      // Update notification type ENUM to include admin notification types
      await queryInterface.changeColumn('notifications', 'type', {
        type: Sequelize.ENUM(
          'booking_confirmed',
          'driver_assigned', 
          'pickup_completed',
          'in_transit',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'delayed',
          'new_assignment',
          'pickup_reminder',
          'payment_received',
          'general',
          'system_announcement',
          'service_update',
          'emergency_alert',
          'maintenance_notice'
        ),
        allowNull: false
      }, { transaction });

      // Update priority ENUM to include urgent
      await queryInterface.changeColumn('notifications', 'priority', {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Successfully updated notification ENUMs');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to update notification ENUMs:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert notification type ENUM to original values
      await queryInterface.changeColumn('notifications', 'type', {
        type: Sequelize.ENUM(
          'booking_confirmed',
          'driver_assigned',
          'pickup_completed', 
          'in_transit',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'delayed',
          'new_assignment',
          'pickup_reminder',
          'payment_received',
          'general'
        ),
        allowNull: false
      }, { transaction });

      // Revert priority ENUM to original values
      await queryInterface.changeColumn('notifications', 'priority', {
        type: Sequelize.ENUM('low', 'normal', 'high'),
        allowNull: false,
        defaultValue: 'normal'
      }, { transaction });

      await transaction.commit();
      console.log('✅ Successfully reverted notification ENUMs');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Failed to revert notification ENUMs:', error);
      throw error;
    }
  }
};