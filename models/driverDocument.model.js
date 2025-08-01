const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DriverDocument = sequelize.define('DriverDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    driver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id'
      }
    },
    driving_license_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passport_photo_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    vehicle_rc_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    insurance_paper_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'driver_documents',
    timestamps: false,
    indexes: [
      {
        fields: ['driver_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  DriverDocument.associate = (models) => {
    DriverDocument.belongsTo(models.Driver, {
      foreignKey: 'driver_id',
      as: 'driver'
    });
  };

  return DriverDocument;
};