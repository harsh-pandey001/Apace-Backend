const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DeviceToken = sequelize.define('DeviceToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios', 'web'),
    allowNull: false,
    defaultValue: 'android'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional device information like model, OS version, etc.'
  }
}, {
  tableName: 'device_tokens',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      fields: ['userId'],
      name: 'device_tokens_user_id_idx'
    },
    {
      fields: ['driverId'],
      name: 'device_tokens_driver_id_idx'
    },
    {
      fields: ['token'],
      name: 'device_tokens_token_idx',
      unique: true
    },
    {
      fields: ['isActive'],
      name: 'device_tokens_is_active_idx'
    },
    {
      fields: ['platform'],
      name: 'device_tokens_platform_idx'
    }
  ],
  validate: {
    userOrDriverRequired() {
      if (!this.userId && !this.driverId) {
        throw new Error('Either userId or driverId must be provided');
      }
      if (this.userId && this.driverId) {
        throw new Error('Cannot have both userId and driverId');
      }
    }
  }
});

// Instance methods
DeviceToken.prototype.updateLastUsed = function() {
  return this.update({ lastUsed: new Date() });
};

DeviceToken.prototype.deactivate = function() {
  return this.update({ isActive: false });
};

// Class methods
DeviceToken.findActiveTokensForUser = function(userId) {
  return this.findAll({
    where: {
      userId,
      isActive: true
    }
  });
};

DeviceToken.findActiveTokensForDriver = function(driverId) {
  return this.findAll({
    where: {
      driverId,
      isActive: true
    }
  });
};

DeviceToken.deactivateOldTokens = async function(userId = null, driverId = null, currentToken = null) {
  const whereClause = { isActive: true };
  
  if (userId) whereClause.userId = userId;
  if (driverId) whereClause.driverId = driverId;
  if (currentToken) whereClause.token = { [sequelize.Sequelize.Op.ne]: currentToken };
  
  return this.update(
    { isActive: false },
    { where: whereClause }
  );
};

module.exports = DeviceToken;