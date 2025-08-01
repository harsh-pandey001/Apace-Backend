const { sequelize } = require('../config/database');
const User = require('./user.model');
const Driver = require('./driver.model');
const Admin = require('./admin.model');
const Shipment = require('./shipment.model');
const Vehicle = require('./vehicle.model');
const Address = require('./address.model');
const UserPreferences = require('./userPreferences.model');
const OtpVerification = require('./otpVerification.model');
const DriverDocument = require('./driverDocument.model')(sequelize);
const VehicleType = require('./vehicleType.model');
const DeviceToken = require('./deviceToken.model');
const Notification = require('./notification.model');

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

// DriverDocument associations with User (legacy)
User.hasOne(DriverDocument, { foreignKey: 'driver_id', as: 'driverDocument' });
DriverDocument.belongsTo(User, { foreignKey: 'driver_id', as: 'userDriver' });

// Vehicle-Driver associations (keep existing for backward compatibility)
Vehicle.belongsTo(User, { foreignKey: 'driverId', as: 'legacyDriver' });
User.hasMany(Vehicle, { foreignKey: 'driverId', as: 'vehicles' });

// New Driver associations (shipments are linked through vehicles)
Driver.hasMany(Vehicle, { foreignKey: 'driverId', as: 'driverVehicles' });
Vehicle.belongsTo(Driver, { foreignKey: 'driverId', as: 'driverOwner' });

Driver.hasMany(DriverDocument, { foreignKey: 'driver_id', as: 'documents' });
DriverDocument.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driverProfile' });

// DeviceToken associations
User.hasMany(DeviceToken, { foreignKey: 'userId', as: 'deviceTokens' });
DeviceToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Driver.hasMany(DeviceToken, { foreignKey: 'driverId', as: 'deviceTokens' });
DeviceToken.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Driver.hasMany(Notification, { foreignKey: 'driverId', as: 'notifications' });
Notification.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Shipment.hasMany(Notification, { foreignKey: 'shipmentId', as: 'notifications' });
Notification.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

module.exports = {
  sequelize,
  User,
  Driver,
  Admin,
  Shipment,
  Vehicle,
  Address,
  UserPreferences,
  OtpVerification,
  DriverDocument,
  VehicleType,
  DeviceToken,
  Notification
};