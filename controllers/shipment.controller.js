const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Shipment, User, Vehicle, Driver, DriverDocument, VehicleType, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const NotificationMiddleware = require('../middleware/notificationMiddleware');

// Helper function for pagination
const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Helper function to check vehicle type compatibility
const checkVehicleTypeCompatibility = async (driverVehicleType, shipmentVehicleType) => {
  try {
    logger.info(`checkVehicleTypeCompatibility called with: driver=${driverVehicleType}, shipment=${shipmentVehicleType}`);
    
    // Direct match (case-insensitive)
    if (driverVehicleType.toLowerCase() === shipmentVehicleType.toLowerCase()) {
      logger.info('Direct match found');
      return true;
    }

    // Check if there's a vehicle type mapping
    const vehicleTypeMapping = await VehicleType.findOne({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('vehicleType')),
            sequelize.fn('LOWER', shipmentVehicleType)
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('label')),
            sequelize.fn('LOWER', shipmentVehicleType)
          )
        ]
      }
    });

    if (vehicleTypeMapping) {
      logger.info(`Vehicle type mapping found: vehicleType=${vehicleTypeMapping.vehicleType}, label=${vehicleTypeMapping.label}`);
      
      // Check if driver's vehicle type matches either the type or label
      const typeMatch = driverVehicleType.toLowerCase() === vehicleTypeMapping.vehicleType.toLowerCase();
      const labelMatch = driverVehicleType.toLowerCase() === vehicleTypeMapping.label.toLowerCase();
      
      logger.info(`Type match: ${typeMatch}, Label match: ${labelMatch}`);
      
      return typeMatch || labelMatch;
    }

    logger.info('No vehicle type mapping found');
    return false;
  } catch (error) {
    logger.error('Error checking vehicle type compatibility:', error);
    return false;
  }
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
    
    // Log the request for debugging
    logger.info('Fetching user shipments', {
      userId: req.user.id,
      requestTimestamp: new Date().toISOString(),
      filters: { status, fromDate, toDate, page, limit }
    });
    
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

    // Log response for debugging
    logger.info('Returning user shipments', {
      userId: req.user.id,
      shipmentsFound: shipments.length,
      totalCount: count,
      responseTimestamp: new Date().toISOString(),
      latestShipmentTime: shipments.length > 0 ? shipments[0].createdAt : null
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
    
    logger.info(logMessage, {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      userId: req.user?.id,
      userType: userType,
      timestamp: shipment.createdAt,
      debugTimestamp: new Date().toISOString()
    });

    // Send booking confirmation notification (only for authenticated users)
    if (userType === 'authenticated') {
      try {
        await NotificationMiddleware.onShipmentCreated(shipment);
      } catch (notificationError) {
        logger.error('Failed to send booking confirmation notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

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
    
    // If driver has no vehicles assigned, return empty result
    if (vehicleIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        totalShipments: 0,
        totalPages: 0,
        currentPage: page,
        data: {
          shipments: []
        },
        message: 'No vehicles assigned to this driver'
      });
    }
    
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

    // Store old status for notification
    const oldStatus = shipment.status;

    // Update shipment
    await shipment.update(updateData);

    logger.info(`Shipment ${shipment.trackingNumber} status updated to ${status}`);

    // Send status update notifications
    try {
      await NotificationMiddleware.onStatusUpdate(shipment, oldStatus, status);
    } catch (notificationError) {
      logger.error('Failed to send status update notification:', notificationError);
      // Don't fail the request if notification fails
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

// Assign a shipment to a driver (admin)
exports.assignShipment = async (req, res, next) => {
  try {
    // 🔍 DEEP INSPECTION: Log all incoming request data
    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Request received:', {
      method: req.method,
      url: req.url,
      params: req.params,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? `Bearer ${req.headers.authorization.substring(7, 20)}...` : 'none',
        'content-type': req.headers['content-type']
      },
      user: req.user ? { id: req.user.id, role: req.user.role } : 'none',
      timestamp: new Date().toISOString()
    });

    // 🔍 DEEP INSPECTION: Environment and DB config check
    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_HOST: process.env.DATABASE_HOST ? 'configured' : 'missing',
      DATABASE_NAME: process.env.DATABASE_NAME ? 'configured' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      serverTime: new Date().toISOString()
    });

    // 🔍 DEEP INSPECTION: Test database connection
    try {
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      logger.info('🔍 ASSIGN SHIPMENT DEBUG - Database connection test: SUCCESS');
    } catch (dbTestError) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Database connection test: FAILED', {
        error: dbTestError.message,
        stack: dbTestError.stack
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Validation errors:', errors.array());
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { driverId, vehicleId, estimatedDeliveryDate, notes } = req.body;

    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Extracted data:', {
      driverId,
      vehicleId,
      estimatedDeliveryDate,
      notes,
      shipmentId: req.params.id
    });

    if (!driverId) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Missing driver ID');
      return next(new AppError('Driver ID is required', 400));
    }

    // Find the driver and verify they have verified documents
    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Looking up driver:', { driverId });
    
    let driver;
    try {
      driver = await Driver.findByPk(driverId, {
        include: [
          {
            model: DriverDocument,
            as: 'documents',
            where: {
              status: 'verified'
            },
            required: true
          }
        ]
      });
    } catch (driverLookupError) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Driver lookup error:', {
        error: driverLookupError.message,
        stack: driverLookupError.stack,
        driverId
      });
      throw driverLookupError;
    }

    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Driver lookup result:', {
      found: !!driver,
      driverData: driver ? {
        id: driver.id,
        name: driver.name,
        isActive: driver.isActive,
        vehicleType: driver.vehicleType,
        documentsCount: driver.documents ? driver.documents.length : 0
      } : null
    });

    if (!driver) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Driver not found or documents not verified');
      return next(new AppError('Driver not found or documents not verified', 404));
    }

    // Check if driver is active and available
    if (!driver.isActive) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Driver is not active');
      return next(new AppError('Driver is not active', 400));
    }

    // Find shipment
    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Looking up shipment:', { shipmentId: req.params.id });
    
    let shipment;
    try {
      shipment = await Shipment.findByPk(req.params.id);
    } catch (shipmentLookupError) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Shipment lookup error:', {
        error: shipmentLookupError.message,
        stack: shipmentLookupError.stack,
        shipmentId: req.params.id
      });
      throw shipmentLookupError;
    }
    
    logger.info('🔍 ASSIGN SHIPMENT DEBUG - Shipment lookup result:', {
      found: !!shipment,
      shipmentData: shipment ? {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        vehicleType: shipment.vehicleType,
        vehicleId: shipment.vehicleId
      } : null
    });
    
    if (!shipment) {
      logger.error('🔍 ASSIGN SHIPMENT DEBUG - Shipment not found');
      return next(new AppError('Shipment not found', 404));
    }

    // Verify driver's vehicle type matches shipment's vehicle type (with mapping support)
    logger.info(`Checking vehicle type compatibility: driver=${driver.vehicleType}, shipment=${shipment.vehicleType}`);
    const isCompatible = await checkVehicleTypeCompatibility(driver.vehicleType, shipment.vehicleType);
    logger.info(`Vehicle type compatibility result: ${isCompatible}`);
    if (!isCompatible) {
      return next(new AppError(`Driver's vehicle type (${driver.vehicleType}) does not match shipment's vehicle type (${shipment.vehicleType})`, 400));
    }

    // Handle vehicle assignment - support both explicit vehicleId and driver-based assignment
    let vehicle;
    
    if (vehicleId) {
      // Case 1: Explicit vehicle ID provided (new admin panel approach)
      vehicle = await Vehicle.findByPk(vehicleId);
      
      if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
      }
      
      // Verify the vehicle belongs to the specified driver
      if (vehicle.driverId !== driver.id) {
        return next(new AppError('Vehicle does not belong to the specified driver', 400));
      }
      
      logger.info(`Using explicitly specified vehicle: ${vehicle.vehicleNumber} for driver ${driver.name}`);
      
    } else {
      // Case 2: Driver-based assignment (current approach - find or create vehicle)
      vehicle = await Vehicle.findOne({
        where: {
          driverId: driver.id,
          vehicleNumber: driver.vehicleNumber
        }
      });

      if (!vehicle) {
        // Map driver vehicle types to vehicle model types
        const vehicleTypeMapping = {
          'bike': 'motorcycle',
          'motorcycle': 'motorcycle',
          'car': 'car',
          'van': 'van',
          'truck': 'truck',
          'mini_truck': 'truck'
        };
        
        const mappedVehicleType = vehicleTypeMapping[driver.vehicleType.toLowerCase()] || 'car';
        
        // Parse capacity and weight from driver data, with defaults
        let capacity = null;
        let maxWeight = null;
        
        if (driver.vehicleCapacity && !isNaN(parseFloat(driver.vehicleCapacity))) {
          capacity = parseFloat(driver.vehicleCapacity);
          maxWeight = parseFloat(driver.vehicleCapacity);
        }
        
        // Create vehicle record from driver information
        try {
          vehicle = await Vehicle.create({
            vehicleNumber: driver.vehicleNumber,
            type: mappedVehicleType,
            model: driver.vehicleType, // Use original vehicle type as model
            licensePlate: driver.vehicleNumber, // Use vehicle number as license plate for now
            capacity: capacity,
            maxWeight: maxWeight,
            driverId: driver.id,
            status: 'available'
          });
        } catch (vehicleCreateError) {
          logger.error(`Failed to create vehicle for driver ${driver.name}:`, vehicleCreateError);
          throw new AppError(`Failed to create vehicle record: ${vehicleCreateError.message}`, 500);
        }
        
        logger.info(`Created new vehicle record: ${vehicle.vehicleNumber} for driver ${driver.name}`);
      } else {
        logger.info(`Using existing vehicle: ${vehicle.vehicleNumber} for driver ${driver.name}`);
      }
    }

    // Prepare shipment update data
    const updateData = { 
      vehicleId: vehicle.id
    };
    
    // Add optional fields if provided
    if (estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = estimatedDeliveryDate;
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    // Assign vehicle to shipment (keep status as pending until pickup starts)
    try {
      await shipment.update(updateData);
      logger.info(`Successfully updated shipment ${shipment.trackingNumber} with vehicle ${vehicle.id}`);
    } catch (updateError) {
      logger.error(`Failed to update shipment ${shipment.trackingNumber}:`, updateError);
      throw new AppError(`Failed to assign vehicle to shipment: ${updateError.message}`, 500);
    }
    
    logger.info(`Admin assigned shipment ${shipment.trackingNumber} to driver ${driver.name} (${driver.vehicleNumber})`);

    // Send driver assignment notifications
    try {
      await NotificationMiddleware.onDriverAssigned(shipment, driver.id);
    } catch (notificationError) {
      logger.error('Failed to send driver assignment notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Get updated shipment with driver and vehicle info
    const updatedShipment = await Shipment.findByPk(req.params.id, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            {
              model: Driver,
              as: 'driverOwner',
              attributes: ['id', 'name', 'email', 'phone', 'vehicleType', 'vehicleNumber', 'vehicleCapacity']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      message: `Shipment assigned to driver ${driver.name}`,
      data: {
        shipment: updatedShipment,
        assignedDriver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehicleNumber: driver.vehicleNumber,
          vehicleCapacity: driver.vehicleCapacity
        }
      }
    });
  } catch (error) {
    // 🔍 DEEP INSPECTION: Comprehensive error logging as requested
    logger.error("🔍 ASSIGN SHIPMENT DEBUG - Assign shipment failed:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      shipmentId: req.params.id,
      driverId: req.body?.driverId,
      vehicleId: req.body?.vehicleId,
      estimatedDeliveryDate: req.body?.estimatedDeliveryDate,
      notes: req.body?.notes,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      timestamp: new Date().toISOString(),
      // Additional context
      url: req.url,
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });
    
    // Return detailed error for debugging (only in development, generic in production)
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ 
        message: "Internal Server Error", 
        details: error.message,
        stack: error.stack
      });
    } else {
      return res.status(500).json({ 
        message: "Internal Server Error", 
        details: error.message 
      });
    }
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