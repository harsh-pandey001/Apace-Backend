const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OtpVerification = sequelize.define('OtpVerification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 6]
    }
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'otp_verifications',
  underscored: true
});

// Check if OTP is expired
OtpVerification.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

module.exports = OtpVerification;