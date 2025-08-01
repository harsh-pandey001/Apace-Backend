const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['car', 'van', 'truck', 'motorcycle']]
    }
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  capacity: {
    type: DataTypes.FLOAT, // in cubic meters
    allowNull: true
  },
  maxWeight: {
    type: DataTypes.FLOAT, // in kg
    allowNull: true
  },
  currentLat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  currentLng: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'available',
    validate: {
      isIn: [['available', 'in_use', 'maintenance', 'out_of_service']]
    }
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  lastMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'vehicles',
  hooks: {
    beforeCreate: (vehicle) => {
      // Generate a vehicle number if not provided
      if (!vehicle.vehicleNumber) {
        const prefix = 'VEH';
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        vehicle.vehicleNumber = `${prefix}-${timestamp}-${random}`;
      }
    }
  }
});

module.exports = Vehicle;