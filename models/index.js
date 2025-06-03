const { sequelize } = require('../config/database');
const User = require('./user.model');
const Shipment = require('./shipment.model');
const Vehicle = require('./vehicle.model');
const Address = require('./address.model');
const UserPreferences = require('./userPreferences.model');
const OtpVerification = require('./otpVerification.model');
const DriverDocument = require('./driverDocument.model')(sequelize);

// Define model associations here
User.hasMany(Shipment, { foreignKey: 'userId', as: 'shipments' });
Shipment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Vehicle.hasMany(Shipment, { foreignKey: 'vehicleId', as: 'shipments' });
Shipment.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Address associations
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserPreferences associations
User.hasOne(UserPreferences, { foreignKey: 'userId', as: 'preferences' });
UserPreferences.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DriverDocument associations
User.hasOne(DriverDocument, { foreignKey: 'driver_id', as: 'driverDocument' });
DriverDocument.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

module.exports = {
  sequelize,
  User,
  Shipment,
  Vehicle,
  Address,
  UserPreferences,
  OtpVerification,
  DriverDocument
};