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
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled']]
    }
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
    allowNull: true
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
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
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'authenticated',
    validate: {
      isIn: [['authenticated', 'guest']]
    }
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicleType: {
    type: DataTypes.STRING,
    allowNull: true
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
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'failed']]
    }
  }
}, {
  timestamps: true,
  tableName: 'shipments',
  hooks: {
    beforeValidate: (shipment) => {
      // Generate a tracking number if not provided
      if (!shipment.trackingNumber) {
        const prefix = 'APACE';
        const timestamp = new Date().getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        shipment.trackingNumber = `${prefix}-${timestamp}-${random}`;
      }

      // Set default pickup date for guest bookings (next business day)
      if (shipment.userType === 'guest' && !shipment.scheduledPickupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        shipment.scheduledPickupDate = tomorrow;
      }

      // Set estimated delivery date (3 business days after pickup)
      if (!shipment.estimatedDeliveryDate && shipment.scheduledPickupDate) {
        const deliveryDate = new Date(shipment.scheduledPickupDate);
        deliveryDate.setDate(deliveryDate.getDate() + 3);
        shipment.estimatedDeliveryDate = deliveryDate;
      }
    }
  }
});

module.exports = Shipment;