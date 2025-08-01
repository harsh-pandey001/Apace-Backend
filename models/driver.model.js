const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
      is: /^[a-zA-Z\s]+$/
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'isActive'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'isVerified'
  },
  availability_status: {
    type: DataTypes.ENUM('online', 'offline'),
    allowNull: false,
    defaultValue: 'offline'
  },
  vehicleType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  vehicleCapacity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isValidVehicleNumber(value) {
        const vehicleNumberRegex = /^[A-Z]{2}\d{2}\s[A-Z]{2}\d{4}$/;
        if (!vehicleNumberRegex.test(value)) {
          throw new Error('Vehicle number must match format: AB09 CD1234');
        }
      }
    }
  }
}, {
  timestamps: true,
  tableName: 'drivers'
});

// Define associations
Driver.associate = (models) => {
  Driver.hasMany(models.DriverDocument, {
    foreignKey: 'driver_id',
    as: 'documents'
  });
};

module.exports = Driver;