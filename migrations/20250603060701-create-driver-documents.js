'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('driver_documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driving_license_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      passport_photo_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      vehicle_rc_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      insurance_paper_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploaded_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('driver_documents', ['driver_id']);
    await queryInterface.addIndex('driver_documents', ['status']);
  },

  async down (queryInterface, _Sequelize) {
    await queryInterface.dropTable('driver_documents');
  }
};
