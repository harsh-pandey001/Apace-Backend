const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VehicleType = sequelize.define('VehicleType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleType: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Vehicle type already exists'
    },
    validate: {
      notEmpty: {
        msg: 'Vehicle type cannot be empty'
      },
      len: {
        args: [2, 50],
        msg: 'Vehicle type must be between 2 and 50 characters'
      }
    }
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Label cannot be empty'
      },
      len: {
        args: [2, 100],
        msg: 'Label must be between 2 and 100 characters'
      }
    }
  },
  capacity: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Capacity cannot be empty'
      }
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Base price must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Base price must be a positive number'
      }
    }
  },
  pricePerKm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Price per km must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Price per km must be a positive number'
      }
    }
  },
  startingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Starting price must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Starting price must be a positive number'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  iconKey: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default',
    validate: {
      isIn: {
        args: [['truck', 'bike', 'car', 'van', 'bus', 'tractor', 'container', 'default']],
        msg: 'Icon key must be one of: truck, bike, car, van, bus, tractor, container, default'
      }
    }
  }
}, {
  timestamps: true,
  tableName: 'vehicle_types',
  hooks: {
    beforeCreate: (vehicleType) => {
      // Convert vehicleType to lowercase with underscores for consistency
      if (vehicleType.vehicleType) {
        vehicleType.vehicleType = vehicleType.vehicleType.toLowerCase().replace(/\s+/g, '_');
      }
    },
    beforeUpdate: (vehicleType) => {
      // Convert vehicleType to lowercase with underscores for consistency
      if (vehicleType.vehicleType) {
        vehicleType.vehicleType = vehicleType.vehicleType.toLowerCase().replace(/\s+/g, '_');
      }
    }
  }
});

module.exports = VehicleType;