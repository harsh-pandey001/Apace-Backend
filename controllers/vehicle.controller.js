const { Vehicle, Driver } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

// Get all available vehicles for admin assignment
exports.getAvailableVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: {
        status: 'available'
      },
      include: [{
        model: Driver,
        as: 'driverOwner',
        attributes: ['id', 'name', 'phone', 'isActive'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: vehicles.length,
      data: {
        vehicles
      }
    });
  } catch (error) {
    logger.error('Error fetching available vehicles:', error);
    next(error);
  }
};

// Get all vehicles (admin only)
exports.getAllVehicles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      include: [{
        model: Driver,
        as: 'driverOwner',
        attributes: ['id', 'name', 'phone', 'isActive'],
        required: false
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: vehicles.length,
      totalVehicles: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        vehicles
      }
    });
  } catch (error) {
    logger.error('Error fetching all vehicles:', error);
    next(error);
  }
};

// Create a new vehicle
exports.createVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, type, model, licensePlate, capacity, maxWeight, driverId } = req.body;

    // Check if vehicle number or license plate already exists
    const existingVehicle = await Vehicle.findOne({
      where: {
        [Op.or]: [
          { vehicleNumber },
          { licensePlate }
        ]
      }
    });

    if (existingVehicle) {
      return next(new AppError('Vehicle number or license plate already exists', 400));
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      type,
      model,
      licensePlate,
      capacity,
      maxWeight,
      driverId,
      status: 'available'
    });

    logger.info(`New vehicle created: ${vehicle.vehicleNumber}`);

    res.status(201).json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    logger.error('Error creating vehicle:', error);
    next(error);
  }
};

// Update vehicle status
exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, driverId } = req.body;

    const vehicle = await Vehicle.findByPk(id);
    
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    await vehicle.update({
      status,
      driverId: driverId || vehicle.driverId
    });

    logger.info(`Vehicle ${vehicle.vehicleNumber} status updated to ${status}`);

    res.status(200).json({
      status: 'success',
      data: {
        vehicle
      }
    });
  } catch (error) {
    logger.error('Error updating vehicle status:', error);
    next(error);
  }
};