const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Driver, /* OtpVerification, */ VehicleType, DriverDocument, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { 
  /* createOrUpdateOTP, */
  verifyOTP 
  /* sendOTPviaSMS */
} = require('../utils/otpUtils');

// Helper function to find driver by phone
const findDriverByPhone = async (phone) => {
  return await Driver.findOne({ where: { phone } });
};

// Helper function to find driver by email
const findDriverByEmail = async (email) => {
  return await Driver.findOne({ where: { email } });
};

// Helper function to find driver by vehicle number
const findDriverByVehicleNumber = async (vehicleNumber) => {
  return await Driver.findOne({ where: { vehicleNumber } });
};

// Driver signup endpoint (with OTP verification)
exports.driverSignup = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { 
      phone, 
      name, 
      email, 
      vehicleType, 
      vehicleCapacity, 
      vehicleNumber,
      otp 
    } = req.body;

    // Verify OTP first
    const verificationResult = await verifyOTP(phone, otp);
    
    if (!verificationResult.valid) {
      return next(new AppError(verificationResult.message, 400));
    }

    // Check if phone already exists
    const existingDriverWithPhone = await findDriverByPhone(phone);
    if (existingDriverWithPhone) {
      return next(new AppError('Phone number already registered', 400));
    }

    // Check if email already exists
    const existingDriverWithEmail = await findDriverByEmail(email);
    if (existingDriverWithEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if vehicle number already exists
    const existingDriverWithVehicle = await findDriverByVehicleNumber(vehicleNumber);
    if (existingDriverWithVehicle) {
      return next(new AppError('Vehicle number already registered', 400));
    }

    // Vehicle type validation is now handled by express-validator (max 20 characters)

    // Create new driver
    const newDriver = await Driver.create({
      name,
      email,
      phone,
      vehicleType,
      vehicleCapacity,
      vehicleNumber
    });

    logger.info(`New driver registered: ${newDriver.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Driver registration successful',
      data: {
        driver: {
          id: newDriver.id,
          name: newDriver.name,
          email: newDriver.email,
          phone: newDriver.phone,
          vehicleType: newDriver.vehicleType,
          vehicleCapacity: newDriver.vehicleCapacity,
          vehicleNumber: newDriver.vehicleNumber,
          availability_status: newDriver.availability_status,
          isActive: newDriver.isActive,
          isVerified: newDriver.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Driver signup endpoint without OTP verification
exports.driverSignupNoOTP = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    const { 
      phone, 
      name, 
      email, 
      vehicleType, 
      vehicleCapacity, 
      vehicleNumber
    } = req.body;

    // Check if phone already exists
    const existingDriverWithPhone = await findDriverByPhone(phone);
    if (existingDriverWithPhone) {
      return next(new AppError('Phone number already registered', 400));
    }

    // Check if email already exists
    const existingDriverWithEmail = await findDriverByEmail(email);
    if (existingDriverWithEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if vehicle number already exists
    const existingDriverWithVehicle = await findDriverByVehicleNumber(vehicleNumber);
    if (existingDriverWithVehicle) {
      return next(new AppError('Vehicle number already registered', 400));
    }

    // Create new driver
    const newDriver = await Driver.create({
      name,
      email,
      phone,
      vehicleType,
      vehicleCapacity,
      vehicleNumber
    });

    logger.info(`New driver registered without OTP: ${newDriver.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Driver registration successful',
      data: {
        driver: {
          id: newDriver.id,
          name: newDriver.name,
          email: newDriver.email,
          phone: newDriver.phone,
          vehicleType: newDriver.vehicleType,
          vehicleCapacity: newDriver.vehicleCapacity,
          vehicleNumber: newDriver.vehicleNumber,
          availability_status: newDriver.availability_status,
          isActive: newDriver.isActive,
          isVerified: newDriver.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all drivers (admin only)
exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.findAll({
      attributes: [
        'id', 
        'name', 
        'email', 
        'phone', 
        'vehicleType', 
        'vehicleCapacity', 
        'vehicleNumber', 
        'availability_status',
        'isActive',
        'isVerified',
        'createdAt'
      ]
    });

    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: {
        drivers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get driver by ID (admin only)
exports.getDriverById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findByPk(id, {
      attributes: [
        'id', 
        'name', 
        'email', 
        'phone', 
        'vehicleType', 
        'vehicleCapacity', 
        'vehicleNumber', 
        'availability_status',
        'isActive',
        'isVerified',
        'createdAt'
      ]
    });

    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        driver
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update driver availability status
exports.updateDriverAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availability_status } = req.body;

    // Validate availability_status
    if (!['online', 'offline'].includes(availability_status)) {
      return next(new AppError('Invalid availability status. Must be online or offline', 400));
    }

    const driver = await Driver.findByPk(id);
    
    if (!driver) {
      return next(new AppError('Driver not found', 404));
    }

    // Update availability status
    await driver.update({ availability_status });

    res.status(200).json({
      status: 'success',
      message: 'Driver availability updated successfully',
      data: {
        driver: {
          id: driver.id,
          availability_status: driver.availability_status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current driver profile
exports.getDriverProfile = async (req, res, next) => {
  try {
    // req.user is set by the auth middleware and should contain the driver info
    const driver = req.user;

    // Return driver profile information
    res.status(200).json({
      status: 'success',
      data: {
        driver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          vehicleType: driver.vehicleType,
          vehicleCapacity: driver.vehicleCapacity,
          vehicleNumber: driver.vehicleNumber,
          availability_status: driver.availability_status,
          isActive: driver.isActive,
          isVerified: driver.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update current driver profile
exports.updateDriverProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    // Get the authenticated driver ID from JWT token
    const driverId = req.user.id;

    // Extract allowed fields from request body
    const allowedFields = ['name', 'email', 'vehicleType', 'vehicleCapacity', 'vehicleNumber'];
    const updateData = {};
    
    // Only include fields that are present in the request body
    allowedFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    // Check if driver exists and update
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Driver not found'
      });
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== driver.email) {
      const existingDriverWithEmail = await Driver.findOne({
        where: { 
          email: updateData.email,
          id: { [Op.ne]: driverId }
        }
      });
      
      if (existingDriverWithEmail) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email address is already in use by another driver'
        });
      }
    }

    // Check for vehicle number uniqueness if vehicleNumber is being updated
    if (updateData.vehicleNumber && updateData.vehicleNumber !== driver.vehicleNumber) {
      const existingDriverWithVehicleNumber = await Driver.findOne({
        where: { 
          vehicleNumber: updateData.vehicleNumber,
          id: { [Op.ne]: driverId }
        }
      });
      
      if (existingDriverWithVehicleNumber) {
        return res.status(400).json({
          status: 'fail',
          message: 'Vehicle number is already in use by another driver'
        });
      }
    }

    // Update the driver
    await driver.update(updateData);

    // Fetch the updated driver data
    const updatedDriver = await Driver.findByPk(driverId);

    logger.info(`Driver profile updated successfully: ${driverId}`, {
      updatedFields: Object.keys(updateData),
      driverId
    });

    res.status(200).json({
      status: 'success',
      message: 'Driver profile updated successfully',
      data: {
        driver: {
          id: updatedDriver.id,
          name: updatedDriver.name,
          email: updatedDriver.email,
          phone: updatedDriver.phone,
          vehicleType: updatedDriver.vehicleType,
          vehicleCapacity: updatedDriver.vehicleCapacity,
          vehicleNumber: updatedDriver.vehicleNumber,
          availability_status: updatedDriver.availability_status,
          isActive: updatedDriver.isActive,
          isVerified: updatedDriver.isVerified,
          createdAt: updatedDriver.createdAt,
          updatedAt: updatedDriver.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error(`Driver profile update failed: ${error.message}`, {
      driverId: req.user?.id,
      error: error.message
    });
    next(error);
  }
};

// Get available drivers filtered by vehicle type with verified documents
exports.getAvailableDrivers = async (req, res, next) => {
  try {
    const { vehicleType } = req.query;
    
    if (!vehicleType) {
      return next(new AppError('Vehicle type parameter is required', 400));
    }

    logger.info(`Fetching available drivers for vehicle type: ${vehicleType}`);

    // Get vehicle type mapping to handle type vs name inconsistency
    const vehicleTypeMapping = await VehicleType.findOne({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('vehicleType')),
            sequelize.fn('LOWER', vehicleType)
          ),
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('label')),
            sequelize.fn('LOWER', vehicleType)
          )
        ]
      }
    });

    let searchTerms = [vehicleType];
    if (vehicleTypeMapping) {
      // Add both vehicleType and label to search terms
      searchTerms = [vehicleTypeMapping.vehicleType, vehicleTypeMapping.label];
      logger.info(`Vehicle type mapping found: ${vehicleTypeMapping.vehicleType} <-> ${vehicleTypeMapping.label}`);
    }

    logger.info(`Searching for drivers with vehicle types: ${searchTerms.join(', ')}`);

    // First, get all drivers that match basic criteria with flexible vehicle type matching
    const allDrivers = await Driver.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: searchTerms.map(term => 
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('vehicleType')),
                sequelize.fn('LOWER', term)
              )
            )
          },
          { isActive: true },
          { availability_status: 'online' }
        ]
      },
      include: [
        {
          model: DriverDocument,
          as: 'documents',
          required: false // Include all drivers, we'll filter manually
        }
      ],
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'vehicleType',
        'vehicleCapacity',
        'vehicleNumber',
        'availability_status',
        'isActive',
        'isVerified',
        'createdAt'
      ]
    });

    logger.info(`Found ${allDrivers.length} drivers matching basic criteria (vehicle type: ${vehicleType}, active: true, online: true)`);

    // Filter drivers with verified documents
    const verifiedDrivers = allDrivers.filter(driver => {
      let hasVerifiedDocs = false;
      
      if (Array.isArray(driver.documents)) {
        hasVerifiedDocs = driver.documents.some(doc => doc.status === 'verified');
      } else if (driver.documents && driver.documents.status === 'verified') {
        hasVerifiedDocs = true;
      }
      
      logger.debug(`Driver ${driver.id} (${driver.name}):`, {
        vehicleType: driver.vehicleType,
        isActive: driver.isActive,
        availability_status: driver.availability_status,
        isVerified: driver.isVerified,
        documentsType: Array.isArray(driver.documents) ? 'array' : typeof driver.documents,
        documentsCount: Array.isArray(driver.documents) ? driver.documents.length : (driver.documents ? 1 : 0),
        hasVerifiedDocs,
        documentStatus: Array.isArray(driver.documents) ? 
          driver.documents.map(doc => doc.status) : 
          (driver.documents ? driver.documents.status : 'none')
      });

      return hasVerifiedDocs;
    });

    logger.info(`Found ${verifiedDrivers.length} drivers with verified documents`);

    if (verifiedDrivers.length === 0) {
      logger.warn(`No verified drivers available for vehicle type: ${vehicleType}`);
      return res.status(200).json({
        status: 'success',
        message: `No verified drivers available for vehicle type: ${vehicleType}`,
        results: 0,
        data: {
          drivers: []
        }
      });
    }

    const responseDrivers = verifiedDrivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleCapacity: driver.vehicleCapacity,
      vehicleNumber: driver.vehicleNumber,
      availability_status: driver.availability_status,
      isActive: driver.isActive,
      isVerified: driver.isVerified,
      documentsStatus: 'verified',
      createdAt: driver.createdAt
    }));

    logger.info(`Returning ${responseDrivers.length} verified drivers for vehicle type: ${vehicleType}`, {
      driverIds: responseDrivers.map(d => d.id),
      driverNames: responseDrivers.map(d => d.name)
    });

    res.status(200).json({
      status: 'success',
      message: `Found ${verifiedDrivers.length} verified drivers for vehicle type: ${vehicleType}`,
      results: verifiedDrivers.length,
      data: {
        drivers: responseDrivers
      }
    });
  } catch (error) {
    logger.error(`Error fetching available drivers: ${error.message}`, {
      vehicleType: req.query.vehicleType,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Delete driver (admin only)
exports.deleteDriver = async (req, res, next) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Find the driver
    const driver = await Driver.findByPk(id, {
      include: [
        {
          model: DriverDocument,
          as: 'documents'
        }
      ],
      transaction
    });

    if (!driver) {
      await transaction.rollback();
      return next(new AppError('Driver not found', 404));
    }

    // Store driver info for logging before deletion
    const driverInfo = {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber
    };

    logger.info(`Starting deletion process for driver: ${driverInfo.name} (${driverInfo.id})`);

    // Check if driver has any active shipments or vehicles assigned
    // This is a safety check to prevent deleting drivers with active bookings
    const { Shipment, Vehicle } = require('../models');
    
    try {
      const activeShipments = await Shipment.findAll({
        include: [
          {
            model: Vehicle,
            as: 'vehicle',
            where: { driverId: driver.id },
            required: true
          }
        ],
        where: {
          status: { 
            [Op.in]: ['pending', 'in_transit', 'out_for_delivery'] 
          }
        },
        transaction
      });

      if (activeShipments.length > 0) {
        await transaction.rollback();
        const shipmentIds = activeShipments.map(s => s.trackingNumber).join(', ');
        return next(new AppError(
          `Cannot delete driver. Driver has ${activeShipments.length} active shipment(s): ${shipmentIds}. ` +
          'Please wait for shipments to complete or reassign them before deleting the driver.', 
          409
        ));
      }
    } catch (shipmentCheckError) {
      await transaction.rollback();
      logger.error(`Error checking active shipments for driver ${driverInfo.id}:`, shipmentCheckError);
      return next(new AppError(`Failed to check active shipments: ${shipmentCheckError.message}`, 500));
    }

    // Delete associated documents first (cascade delete should handle this, but being explicit)
    try {
      if (driver.documents && driver.documents.length > 0) {
        const documentDeleteResult = await DriverDocument.destroy({
          where: { driverId: driver.id },
          transaction
        });
        logger.info(`Deleted ${documentDeleteResult} driver documents for driver ${driverInfo.id}`);
      }
    } catch (documentDeleteError) {
      await transaction.rollback();
      logger.error(`Error deleting documents for driver ${driverInfo.id}:`, documentDeleteError);
      return next(new AppError(`Failed to delete driver documents: ${documentDeleteError.message}`, 500));
    }

    // Delete associated vehicles
    try {
      const vehicleDeleteResult = await Vehicle.destroy({
        where: { driverId: driver.id },
        transaction
      });
      logger.info(`Deleted ${vehicleDeleteResult} vehicles for driver ${driverInfo.id}`);
    } catch (vehicleDeleteError) {
      await transaction.rollback();
      logger.error(`Error deleting vehicles for driver ${driverInfo.id}:`, vehicleDeleteError);
      return next(new AppError(`Failed to delete driver vehicles: ${vehicleDeleteError.message}`, 500));
    }

    // Delete the driver
    try {
      await driver.destroy({ transaction });
      logger.info(`Successfully deleted driver record for ${driverInfo.id}`);
    } catch (driverDeleteError) {
      await transaction.rollback();
      logger.error(`Error deleting driver record ${driverInfo.id}:`, driverDeleteError);
      return next(new AppError(`Failed to delete driver record: ${driverDeleteError.message}`, 500));
    }

    // Commit the transaction
    await transaction.commit();

    logger.info('Driver deleted successfully', {
      userId: req.user?.id,
      deletedDriver: driverInfo
    });

    res.status(200).json({
      status: 'success',
      message: `Driver ${driverInfo.name} has been deleted successfully`
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting driver:', error);
    next(new AppError(`Failed to delete driver: ${error.message}`, 500));
  }
};