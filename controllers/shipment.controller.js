const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Shipment, User, Vehicle } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Helper function for pagination
const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Get all shipments for current user
exports.getUserShipments = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    
    // Query parameters for filtering
    const status = req.query.status;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    
    // Build query conditions
    const whereConditions = { userId: req.user.id };
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (fromDate || toDate) {
      whereConditions.scheduledPickupDate = {};
      
      if (fromDate) {
        whereConditions.scheduledPickupDate[Op.gte] = new Date(fromDate);
      }
      
      if (toDate) {
        whereConditions.scheduledPickupDate[Op.lte] = new Date(toDate);
      }
    }
    
    // Find shipments
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicleNumber', 'type', 'model', 'licensePlate']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      totalShipments: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        shipments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific shipment for current user
exports.getUserShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicleNumber', 'type', 'model', 'licensePlate']
        }
      ]
    });

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new shipment (handles both authenticated and guest users)
exports.createShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { userType } = req.body;

    // Prepare shipment data based on user type
    let shipmentData = { ...req.body };

    // Ensure weight is set from estimatedWeight if needed (backup to middleware)
    if (!shipmentData.weight && shipmentData.estimatedWeight) {
      shipmentData.weight = shipmentData.estimatedWeight;
    }

    if (userType === 'authenticated') {
      // For authenticated users, use the user ID from auth middleware
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'fail',
          message: 'Authentication required for authenticated user bookings'
        });
      }
      shipmentData.userId = req.user.id;
      shipmentData.userType = 'authenticated';
      
      // Remove guest fields for authenticated users
      delete shipmentData.guestName;
      delete shipmentData.guestPhone;
      delete shipmentData.guestEmail;
      
    } else if (userType === 'guest') {
      // For guest users, set userId to null and userType to guest
      shipmentData.userId = null;
      shipmentData.userType = 'guest';
    }

    // Create shipment
    const shipment = await Shipment.create(shipmentData);

    const logMessage = userType === 'guest' 
      ? `New guest shipment created: ${shipment.trackingNumber} for ${shipment.guestName}`
      : `New shipment created: ${shipment.trackingNumber} for user ${req.user.id}`;
    
    logger.info(logMessage);

    // Prepare response data
    const responseData = {
      trackingNumber: shipment.trackingNumber,
      bookingId: shipment.id,
      status: shipment.status,
      pickupAddress: shipment.pickupAddress,
      deliveryAddress: shipment.deliveryAddress,
      scheduledPickupDate: shipment.scheduledPickupDate,
      price: shipment.price,
      distance: shipment.distance,
      paymentStatus: shipment.paymentStatus,
      createdAt: shipment.createdAt
    };

    // Add user-specific fields to response
    if (userType === 'guest') {
      responseData.guestName = shipment.guestName;
      responseData.guestPhone = shipment.guestPhone;
      responseData.guestEmail = shipment.guestEmail;
      responseData.weight = shipment.weight;
      responseData.vehicleType = shipment.vehicleType;
    } else {
      // For authenticated users, also include these fields
      responseData.weight = shipment.weight;
      responseData.vehicleType = shipment.vehicleType;
    }

    res.status(201).json({
      status: 'success',
      data: {
        shipment: responseData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Track a shipment by tracking number (no auth required)
exports.trackShipment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({
      where: { trackingNumber },
      attributes: [
        'id', 
        'trackingNumber',
        'status',
        'pickupAddress',
        'deliveryAddress',
        'scheduledPickupDate',
        'actualPickupDate',
        'actualDeliveryDate',
        'price',
        'distance',
        'paymentStatus'
      ],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleNumber', 'type']
        }
      ]
    });

    if (!shipment) {
      return next(new AppError('Shipment not found with that tracking number', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Driver routes

// Get all shipments assigned to driver
exports.getDriverShipments = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    
    // Check if user is a driver
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return next(new AppError('Access denied: Not a driver', 403));
    }
    
    // Find vehicles assigned to this driver
    const vehicles = await Vehicle.findAll({
      where: { driverId: req.user.id }
    });
    
    const vehicleIds = vehicles.map(vehicle => vehicle.id);
    
    // Status filter
    const status = req.query.status;
    const whereConditions = {
      vehicleId: { [Op.in]: vehicleIds }
    };
    
    if (status) {
      whereConditions.status = status;
    }
    
    // Find shipments
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['scheduledPickupDate', 'ASC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicleNumber', 'type', 'model', 'licensePlate']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      totalShipments: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        shipments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update shipment status (for driver)
exports.updateShipmentStatus = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    // Find the shipment
    const shipment = await Shipment.findByPk(id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle'
        }
      ]
    });

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    // Check if driver is assigned to this shipment's vehicle
    if (shipment.vehicle && shipment.vehicle.driverId !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to update this shipment', 403));
    }

    // Update status and additional fields based on status
    const updateData = { status };
    
    if (notes) {
      updateData.specialInstructions = shipment.specialInstructions 
        ? `${shipment.specialInstructions}\n\n${new Date().toISOString()}: ${notes}`
        : `${new Date().toISOString()}: ${notes}`;
    }

    // Update status-specific timestamps
    if (status === 'in_transit' && !shipment.actualPickupDate) {
      updateData.actualPickupDate = new Date();
    } else if (status === 'delivered' && !shipment.actualDeliveryDate) {
      updateData.actualDeliveryDate = new Date();
    }

    // Update shipment
    await shipment.update(updateData);

    logger.info(`Shipment ${shipment.trackingNumber} status updated to ${status}`);

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin routes

// Get all shipments (admin)
exports.getAllShipments = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    
    // Query parameters for filtering
    const status = req.query.status;
    const userId = req.query.userId;
    const vehicleId = req.query.vehicleId;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;
    
    // Build query conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (userId) {
      whereConditions.userId = userId;
    }
    
    if (vehicleId) {
      whereConditions.vehicleId = vehicleId;
    }
    
    if (fromDate || toDate) {
      whereConditions.scheduledPickupDate = {};
      
      if (fromDate) {
        whereConditions.scheduledPickupDate[Op.gte] = new Date(fromDate);
      }
      
      if (toDate) {
        whereConditions.scheduledPickupDate[Op.lte] = new Date(toDate);
      }
    }
    
    // Find shipments
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicleNumber', 'type', 'model', 'licensePlate']
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      results: shipments.length,
      totalShipments: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: {
        shipments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific shipment (admin)
exports.getShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicleNumber', 'type', 'model', 'licensePlate']
        }
      ]
    });

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a shipment (admin)
exports.updateShipment = async (req, res, next) => {
  try {
    // Find shipment
    const shipment = await Shipment.findByPk(req.params.id);
    
    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    // Update shipment
    await shipment.update(req.body);
    
    logger.info(`Admin updated shipment: ${shipment.trackingNumber}`);

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a shipment (admin)
exports.deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id);
    
    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    await shipment.destroy();
    
    logger.info(`Admin deleted shipment: ${shipment.trackingNumber}`);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Assign a shipment to a vehicle/driver (admin)
exports.assignShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { vehicleId, driverId } = req.body;

    // Verify vehicle exists
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    // If driver ID is provided, verify driver exists and is a driver
    if (driverId) {
      const driver = await User.findOne({
        where: {
          id: driverId,
          role: 'driver'
        }
      });

      if (!driver) {
        return next(new AppError('Driver not found or user is not a driver', 404));
      }

      // Update vehicle with driver
      await vehicle.update({ driverId });
    }

    // Find shipment
    const shipment = await Shipment.findByPk(req.params.id);
    
    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    // Assign vehicle to shipment
    await shipment.update({ vehicleId });
    
    logger.info(`Admin assigned shipment ${shipment.trackingNumber} to vehicle ${vehicle.vehicleNumber}`);

    // Get updated shipment with vehicle info
    const updatedShipment = await Shipment.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        shipment: updatedShipment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Guest booking routes

// Create a guest shipment booking
exports.createGuestShipment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Set shipment data for guest booking
    const shipmentData = {
      ...req.body,
      userType: 'guest',
      userId: null
    };

    // Ensure weight is set from estimatedWeight if needed (backup to middleware)
    if (!shipmentData.weight && shipmentData.estimatedWeight) {
      shipmentData.weight = shipmentData.estimatedWeight;
    }

    // Create shipment
    const shipment = await Shipment.create(shipmentData);

    logger.info(`New guest shipment created: ${shipment.trackingNumber} for ${shipment.guestName}`);

    res.status(201).json({
      status: 'success',
      data: {
        trackingNumber: shipment.trackingNumber,
        bookingId: shipment.id,
        scheduledPickupDate: shipment.scheduledPickupDate,
        price: shipment.price,
        distance: shipment.distance,
        paymentStatus: shipment.paymentStatus,
        shipment: {
          id: shipment.id,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          pickupAddress: shipment.pickupAddress,
          deliveryAddress: shipment.deliveryAddress,
          weight: shipment.weight,
          vehicleType: shipment.vehicleType,
          scheduledPickupDate: shipment.scheduledPickupDate,
          price: shipment.price,
          distance: shipment.distance,
          paymentStatus: shipment.paymentStatus,
          guestName: shipment.guestName,
          guestPhone: shipment.guestPhone,
          guestEmail: shipment.guestEmail
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Track a guest shipment by tracking number
exports.trackGuestShipment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await Shipment.findOne({
      where: { 
        trackingNumber,
        userType: 'guest'
      },
      attributes: [
        'id', 
        'trackingNumber',
        'status',
        'pickupAddress',
        'deliveryAddress',
        'weight',
        'vehicleType',
        'scheduledPickupDate',
        'actualPickupDate',
        'actualDeliveryDate',
        'guestName',
        'guestPhone',
        'guestEmail',
        'specialInstructions',
        'price',
        'distance',
        'paymentStatus',
        'createdAt'
      ],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicleNumber', 'type', 'model']
        }
      ]
    });

    if (!shipment) {
      return next(new AppError('Guest shipment not found with that tracking number', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shipment
      }
    });
  } catch (error) {
    next(error);
  }
};