const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'driver', 'admin']]
    }
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  availability_status: {
    type: DataTypes.ENUM('online', 'offline'),
    allowNull: false,
    defaultValue: 'offline'
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
    validate: {
      isUrlOrNull(value) {
        if (value !== null && value !== '' && !/^https?:\/\/.+\..+/.test(value)) {
          throw new Error('Profile picture must be a valid URL or null');
        }
      }
    }
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;