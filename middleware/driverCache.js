const driverCacheManager = require('../utils/driverCache');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Driver-specific caching middleware for Express routes
 */

/**
 * Generic driver cache middleware
 * @param {string} dataType - Type of driver data (profile, status, shipments, documents, preferences)
 * @param {number} ttl - TTL in seconds
 * @param {string} subType - Optional subtype
 * @param {Function} skipCache - Function to determine if caching should be skipped
 */
const driverCacheMiddleware = (dataType, ttl = 300, subType = null, skipCache = () => false) => {
  return async (req, res, next) => {
    try {
      // Check if caching is enabled
      if (process.env.CACHE_ENABLED === 'false' || skipCache(req)) {
        return next();
      }

      // Only cache GET requests by default
      if (req.method !== 'GET') {
        return next();
      }

      // Extract driver ID from authenticated user
      const driverId = req.user?.id || req.user?.driverId;
      if (!driverId) {
        logger.debug('No driver ID found in request, skipping cache');
        return next();
      }

      // Check if user has driver role
      if (req.user?.role !== 'driver' && !req.user?.isDriver) {
        logger.debug('User is not a driver, skipping driver cache');
        return next();
      }

      const cacheKey = driverCacheManager.generateDriverKey(dataType, driverId, subType);
      
      // Try to get from cache using the appropriate method
      let cachedData = null;
      if (dataType === 'profile') {
        cachedData = await driverCacheManager.getDriverProfile(driverId);
      } else if (dataType === 'status') {
        cachedData = await driverCacheManager.getDriverStatus(driverId);
      } else if (dataType === 'shipments') {
        cachedData = await driverCacheManager.getDriverShipments(driverId);
      } else if (dataType === 'documents') {
        cachedData = await driverCacheManager.getDriverDocuments(driverId);
      } else if (dataType === 'preferences') {
        cachedData = await driverCacheManager.getDriverPreferences(driverId);
      }
      
      if (cachedData) {
        logger.debug(`Driver cache HIT for: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Cache miss - intercept response to cache it
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response asynchronously
        setImmediate(async () => {
          try {
            if (dataType === 'profile') {
              await driverCacheManager.cacheDriverProfile(driverId, data, ttl);
            } else if (dataType === 'status') {
              await driverCacheManager.cacheDriverStatus(driverId, data, ttl);
            } else if (dataType === 'shipments') {
              await driverCacheManager.cacheDriverShipments(driverId, data, ttl);
            } else if (dataType === 'documents') {
              await driverCacheManager.cacheDriverDocuments(driverId, data, ttl);
            } else if (dataType === 'preferences') {
              await driverCacheManager.cacheDriverPreferences(driverId, data, ttl);
            }
            logger.debug(`Driver cache SET for: ${cacheKey}`);
          } catch (error) {
            logger.error(`Failed to cache driver response for ${cacheKey}:`, error);
          }
        });

        // Send the original response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Driver cache middleware error:', error);
      // Don't let caching errors break the request
      next();
    }
  };
};

/**
 * Driver profile caching middleware
 */
const driverProfileCacheMiddleware = (ttl = 300) => {
  return driverCacheMiddleware('profile', ttl);
};

/**
 * Driver status caching middleware
 */
const driverStatusCacheMiddleware = (ttl = 300) => {
  return driverCacheMiddleware('status', ttl);
};

/**
 * Driver shipments caching middleware
 */
const driverShipmentsCacheMiddleware = (ttl = 180) => {
  return driverCacheMiddleware('shipments', ttl, 'assigned');
};

/**
 * Driver documents caching middleware
 */
const driverDocumentsCacheMiddleware = (ttl = 600) => {
  return driverCacheMiddleware('documents', ttl);
};

/**
 * Driver preferences caching middleware
 */
const driverPreferencesCacheMiddleware = (ttl = 600) => {
  return driverCacheMiddleware('preferences', ttl);
};

/**
 * Driver cache invalidation middleware
 * Clears specific driver cache entries after successful mutations
 */
const clearDriverCacheMiddleware = (options = {}) => {
  const {
    dataTypes = [], // Array of data types to invalidate (profile, status, shipments, documents, preferences)
    customInvalidation = null // Custom invalidation function
  } = options;

  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    
    res.send = function(data) {
      const statusCode = this.statusCode;
      
      // Only invalidate cache on successful operations (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        setImmediate(async () => {
          try {
            const driverId = req.user?.id || req.user?.driverId;
            
            if (driverId) {
              if (customInvalidation) {
                await customInvalidation(req, res, driverId);
              } else {
                // Invalidate specified data types
                for (const dataType of dataTypes) {
                  if (dataType === 'shipments') {
                    await driverCacheManager.invalidateDriverShipmentsCache(driverId);
                  } else {
                    await driverCacheManager.invalidateDriverCache(driverId, dataType);
                  }
                  logger.debug(`Driver cache invalidated for ${dataType}: driver ${driverId}`);
                }
              }
            }
          } catch (error) {
            logger.error('Driver cache invalidation error:', error);
          }
        });
      }
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to invalidate all driver cache
 */
const clearAllDriverCacheMiddleware = () => {
  return clearDriverCacheMiddleware({
    customInvalidation: async (req, res, driverId) => {
      await driverCacheManager.invalidateAllDriverCache(driverId);
      logger.debug(`All driver cache invalidated for driver ${driverId}`);
    }
  });
};

/**
 * Middleware to invalidate driver shipments cache when shipment status changes
 */
const invalidateDriverShipmentsMiddleware = () => {
  return clearDriverCacheMiddleware({
    customInvalidation: async (req, res, driverId) => {
      // Invalidate driver's shipments cache
      await driverCacheManager.invalidateDriverShipmentsCache(driverId);
      
      // Also invalidate any other driver's shipments cache if this affects multiple drivers
      const shipmentId = req.params.id;
      if (shipmentId) {
        // This could be enhanced to find all drivers affected by this shipment
        logger.debug(`Shipment ${shipmentId} updated, driver shipments cache invalidated`);
      }
    }
  });
};

/**
 * Helper function to get driver ID from request
 */
const getDriverIdFromRequest = (req) => {
  return req.user?.id || req.user?.driverId || req.params?.driverId;
};

module.exports = {
  driverCacheMiddleware,
  driverProfileCacheMiddleware,
  driverStatusCacheMiddleware,
  driverShipmentsCacheMiddleware,
  driverDocumentsCacheMiddleware,
  driverPreferencesCacheMiddleware,
  clearDriverCacheMiddleware,
  clearAllDriverCacheMiddleware,
  invalidateDriverShipmentsMiddleware,
  getDriverIdFromRequest
};