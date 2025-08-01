const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { VehicleType, Shipment } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { clearCache } = require('../utils/vehicleTypeValidator');

// Helper function for pagination
const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Get all vehicle types (Admin/Management interface with full details and pagination)
exports.getAllVehicleTypes = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    
    // Query parameters for filtering
    const isActive = req.query.isActive;
    const search = req.query.search;
    
    // Build query conditions
    const whereConditions = {};
    
    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { vehicleType: { [Op.like]: `%${search}%` } },
        { label: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Find vehicle types
    const { count, rows: vehicleTypes } = await VehicleType.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      success: true,
      data: vehicleTypes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
    
    logger.info(`Retrieved ${vehicleTypes.length} vehicle types`, {
      userId: req.user?.id,
      filters: { isActive, search }
    });
    
  } catch (error) {
    logger.error('Error retrieving vehicle types:', error);
    next(new AppError('Failed to retrieve vehicle types', 500));
  }
};

// Get all active vehicle types for public/frontend consumption (User App)
exports.getPublicVehicleTypes = async (req, res, next) => {
  try {
    // Get only active vehicle types for public consumption
    const vehicleTypes = await VehicleType.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'vehicleType', 
        'label', 
        'capacity', 
        'basePrice', 
        'pricePerKm', 
        'startingPrice',
        'iconKey'
      ],
      order: [
        ['vehicleType', 'ASC'] // Alphabetical order for consistent UI
      ]
    });

    // Transform data for frontend optimization
    const optimizedData = vehicleTypes.map(vehicle => ({
      id: vehicle.id,
      type: vehicle.vehicleType,
      name: vehicle.label,
      capacity: vehicle.capacity,
      iconKey: vehicle.iconKey,
      pricing: {
        base: parseFloat(vehicle.basePrice),
        perKm: parseFloat(vehicle.pricePerKm),
        starting: parseFloat(vehicle.startingPrice)
      },
      // Add calculated fields for frontend convenience
      displayPrice: `Starting from $${vehicle.startingPrice}`,
      priceRange: {
        min: parseFloat(vehicle.startingPrice),
        baseRate: parseFloat(vehicle.basePrice),
        kmRate: parseFloat(vehicle.pricePerKm)
      }
    }));
    
    res.json({
      success: true,
      data: optimizedData,
      meta: {
        total: vehicleTypes.length,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
    logger.info(`Public vehicle types retrieved: ${vehicleTypes.length} active types`);
    
  } catch (error) {
    logger.error('Error retrieving public vehicle types:', error);
    next(new AppError('Failed to retrieve vehicle types', 500));
  }
};

// Get vehicle type by ID
exports.getVehicleTypeById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { vehicleId } = req.params;
    
    const vehicleType = await VehicleType.findByPk(vehicleId);
    
    if (!vehicleType) {
      return next(new AppError('Vehicle type not found', 404));
    }
    
    res.json({
      success: true,
      data: vehicleType
    });
    
    logger.info(`Retrieved vehicle type ${vehicleId}`, {
      userId: req.user?.id,
      vehicleType: vehicleType.vehicleType
    });
    
  } catch (error) {
    logger.error('Error retrieving vehicle type:', error);
    next(new AppError('Failed to retrieve vehicle type', 500));
  }
};

// Create new vehicle type
exports.createVehicleType = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { vehicleType, label, capacity, basePrice, pricePerKm, startingPrice, isActive, iconKey } = req.body;
    
    // Check if vehicle type already exists
    const existingVehicleType = await VehicleType.findOne({
      where: { vehicleType: vehicleType.toLowerCase().replace(/\s+/g, '_') }
    });
    
    if (existingVehicleType) {
      return next(new AppError('Vehicle type already exists', 409));
    }
    
    // Create vehicle type
    const newVehicleType = await VehicleType.create({
      vehicleType,
      label,
      capacity,
      basePrice,
      pricePerKm,
      startingPrice,
      isActive: isActive !== undefined ? isActive : true,
      iconKey: iconKey || 'default'
    });
    
    // Clear cache since we added a new vehicle type
    clearCache();
    
    res.status(201).json({
      success: true,
      message: 'Vehicle type created successfully',
      data: newVehicleType
    });
    
    logger.info('Vehicle type created successfully', {
      userId: req.user?.id,
      vehicleTypeId: newVehicleType.id,
      vehicleType: newVehicleType.vehicleType
    });
    
  } catch (error) {
    logger.error('Error creating vehicle type:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Vehicle type already exists', 409));
    }
    
    next(new AppError('Failed to create vehicle type', 500));
  }
};

// Update vehicle type
exports.updateVehicleType = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { vehicleId } = req.params;
    const updateData = req.body;
    
    // Find vehicle type
    const vehicleType = await VehicleType.findByPk(vehicleId);
    
    if (!vehicleType) {
      return next(new AppError('Vehicle type not found', 404));
    }
    
    // Check if updating vehicleType field and if it conflicts with existing
    if (updateData.vehicleType) {
      const existingVehicleType = await VehicleType.findOne({
        where: { 
          vehicleType: updateData.vehicleType.toLowerCase().replace(/\s+/g, '_'),
          id: { [Op.ne]: vehicleId }
        }
      });
      
      if (existingVehicleType) {
        return next(new AppError('Vehicle type already exists', 409));
      }
    }
    
    // Update vehicle type
    await vehicleType.update(updateData);
    
    // Clear cache since we updated a vehicle type
    clearCache();
    
    // Reload to get updated data
    await vehicleType.reload();
    
    res.json({
      success: true,
      message: 'Vehicle type updated successfully',
      data: vehicleType
    });
    
    logger.info('Vehicle type updated successfully', {
      userId: req.user?.id,
      vehicleTypeId: vehicleType.id,
      vehicleType: vehicleType.vehicleType,
      updatedFields: Object.keys(updateData)
    });
    
  } catch (error) {
    logger.error('Error updating vehicle type:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Vehicle type already exists', 409));
    }
    
    next(new AppError('Failed to update vehicle type', 500));
  }
};

// Delete vehicle type (permanently remove from database)
exports.deleteVehicleType = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { vehicleId } = req.params;
    
    // Find vehicle type
    const vehicleType = await VehicleType.findByPk(vehicleId);
    
    if (!vehicleType) {
      return next(new AppError('Vehicle type not found', 404));
    }
    
    // Store vehicle type info for logging before deletion
    const vehicleTypeInfo = {
      id: vehicleType.id,
      vehicleType: vehicleType.vehicleType,
      label: vehicleType.label
    };
    
    // Check if this vehicle type is being used in any shipments
    const shipmentsUsingVehicleType = await Shipment.findAll({
      where: { vehicleType: vehicleType.vehicleType },
      attributes: ['id', 'trackingNumber', 'status', 'pickupAddress', 'deliveryAddress', 'createdAt'],
      limit: 5 // Show up to 5 example shipments
    });
    
    if (shipmentsUsingVehicleType.length > 0) {
      // Create a detailed error message with shipment information
      const shipmentCount = await Shipment.count({
        where: { vehicleType: vehicleType.vehicleType }
      });
      
      const shipmentDetails = shipmentsUsingVehicleType.map(shipment => 
        `${shipment.trackingNumber} (${shipment.status})`
      ).join(', ');
      
      const message = `Cannot delete vehicle type "${vehicleType.label}". It is currently being used by ${shipmentCount} shipment(s). ` +
        `Examples: ${shipmentDetails}${shipmentCount > 5 ? ' and more...' : ''}. ` +
        'Please wait for these shipments to complete or contact the system administrator to reassign them.';
      
      return next(new AppError(message, 409));
    }
    
    // Permanently delete from database
    await vehicleType.destroy();
    
    // Clear cache since we deleted a vehicle type
    clearCache();
    
    res.json({
      success: true,
      message: 'Vehicle type deleted successfully'
    });
    
    logger.info('Vehicle type deleted permanently', {
      userId: req.user?.id,
      vehicleTypeId: vehicleTypeInfo.id,
      vehicleType: vehicleTypeInfo.vehicleType,
      label: vehicleTypeInfo.label
    });
    
  } catch (error) {
    logger.error('Error deleting vehicle type:', error);
    next(new AppError('Failed to delete vehicle type', 500));
  }
};

// Get vehicle pricing by type
exports.getVehiclePricing = async (req, res, next) => {
  try {
    const { vehicleType } = req.params;
    
    const pricing = await VehicleType.findOne({
      where: { 
        vehicleType: vehicleType.toLowerCase(),
        isActive: true
      },
      attributes: ['vehicleType', 'label', 'capacity', 'basePrice', 'pricePerKm', 'startingPrice', 'iconKey']
    });
    
    if (!pricing) {
      return next(new AppError('Vehicle type not found or inactive', 404));
    }
    
    res.json({
      success: true,
      data: pricing
    });
    
    logger.info(`Retrieved pricing for vehicle type ${vehicleType}`, {
      userId: req.user?.id
    });
    
  } catch (error) {
    logger.error('Error retrieving vehicle pricing:', error);
    next(new AppError('Failed to retrieve vehicle pricing', 500));
  }
};

// Get shipments using a specific vehicle type (Admin only)
exports.getShipmentsUsingVehicleType = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    
    // Find vehicle type
    const vehicleType = await VehicleType.findByPk(vehicleId);
    
    if (!vehicleType) {
      return next(new AppError('Vehicle type not found', 404));
    }
    
    // Get shipments using this vehicle type
    const shipments = await Shipment.findAll({
      where: { vehicleType: vehicleType.vehicleType },
      attributes: [
        'id', 
        'trackingNumber', 
        'status', 
        'pickupAddress', 
        'deliveryAddress', 
        'createdAt',
        'scheduledPickupDate',
        'estimatedDeliveryDate'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        vehicleType: vehicleType.vehicleType,
        vehicleLabel: vehicleType.label,
        shipmentCount: shipments.length,
        shipments
      }
    });
    
    logger.info(`Retrieved ${shipments.length} shipments using vehicle type ${vehicleType.vehicleType}`, {
      userId: req.user?.id,
      vehicleTypeId: vehicleId
    });
    
  } catch (error) {
    logger.error('Error retrieving shipments for vehicle type:', error);
    next(new AppError('Failed to retrieve shipments', 500));
  }
};