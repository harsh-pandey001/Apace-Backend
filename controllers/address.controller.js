const { Address } = require('../models');
const { logger } = require('../utils/logger');

/**
 * Get all addresses for the logged-in user
 */
exports.getAllAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: {
        addresses
      }
    });
  } catch (error) {
    logger.error('Error fetching addresses:', error);
    next(error);
  }
};

/**
 * Get a specific address by ID
 */
exports.getAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    logger.error('Error fetching address:', error);
    next(error);
  }
};

/**
 * Create a new address
 */
exports.createAddress = async (req, res, next) => {
  try {
    // If this is the first address or isDefault is true, ensure it's set as default
    const addressCount = await Address.count({ where: { userId: req.user.id } });
    const isDefault = addressCount === 0 || req.body.isDefault === true;
    
    // If setting as default, unset any current default
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    const newAddress = await Address.create({
      ...req.body,
      userId: req.user.id,
      isDefault
    });

    res.status(201).json({
      status: 'success',
      data: {
        address: newAddress
      }
    });
  } catch (error) {
    logger.error('Error creating address:', error);
    next(error);
  }
};

/**
 * Update an address
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // If setting as default, unset any current default
    if (req.body.isDefault === true) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    // Update the address
    await address.update(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    logger.error('Error updating address:', error);
    next(error);
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    
    // Delete the address
    await address.destroy();

    // If deleted address was default, set another address as default if any exist
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      
      if (nextAddress) {
        await nextAddress.update({ isDefault: true });
      }
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting address:', error);
    next(error);
  }
};

/**
 * Set an address as default
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // Unset all default addresses
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );

    // Set the current address as default
    await address.update({ isDefault: true });

    res.status(200).json({
      status: 'success',
      data: {
        address
      }
    });
  } catch (error) {
    logger.error('Error setting default address:', error);
    next(error);
  }
};