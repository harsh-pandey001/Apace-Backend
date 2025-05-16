const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPreferences = sequelize.define('UserPreferences', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  smsNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  marketingEmails: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  darkTheme: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'EN',
    validate: {
      isIn: [['EN', 'ES']]
    }
  },
  defaultVehicleType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  defaultPaymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'user_preferences'
});

module.exports = UserPreferences;