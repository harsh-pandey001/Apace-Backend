const { sequelize } = require('../config/database');
const User = require('./user.model');
const Shipment = require('./shipment.model');
const Vehicle = require('./vehicle.model');

// Define model associations here
User.hasMany(Shipment, { foreignKey: 'userId', as: 'shipments' });
Shipment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Vehicle.hasMany(Shipment, { foreignKey: 'vehicleId', as: 'shipments' });
Shipment.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

module.exports = {
  sequelize,
  User,
  Shipment,
  Vehicle
};