'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Get table info to check which columns exist
    const tableInfo = await queryInterface.describeTable('users');
    
    // Remove password-related columns from users table if they exist
    if (tableInfo.password) {
      await queryInterface.removeColumn('users', 'password');
    }
    
    if (tableInfo.passwordChangedAt) {
      await queryInterface.removeColumn('users', 'passwordChangedAt');
    }
    
    if (tableInfo.passwordResetToken) {
      await queryInterface.removeColumn('users', 'passwordResetToken');
    }
    
    if (tableInfo.passwordResetExpires) {
      await queryInterface.removeColumn('users', 'passwordResetExpires');
    }
    
    // Update any NULL phone values to a placeholder before making column NOT NULL
    await queryInterface.sequelize.query(`
      UPDATE users SET phone = CONCAT('temp-', id) WHERE phone IS NULL
    `);
    
    // Now we can safely make phone column required and unique
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Add back password-related columns if we need to revert
    await queryInterface.addColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'passwordChangedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'passwordResetToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'passwordResetExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    // Revert phone column to allow null (as it was before)
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false
    });
  }
};
