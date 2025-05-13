const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 
      'in_transit', 
      'out_for_delivery', 
      'delivered', 
      'failed', 
      'cancelled'
    ),
    defaultValue: 'pending'
  },
  pickupAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pickupLat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  pickupLng: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  deliveryLat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  deliveryLng: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  scheduledPickupDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualPickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  tableName: 'shipments',
  hooks: {
    beforeCreate: (shipment) => {
      // Generate a tracking number if not provided
      if (!shipment.trackingNumber) {
        const prefix = 'APACE';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        shipment.trackingNumber = `${prefix}-${timestamp}-${random}`;
      }
    }
  }
});

module.exports = Shipment;