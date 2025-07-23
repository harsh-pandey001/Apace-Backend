const cacheManager = require('../utils/cache');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Generic caching middleware for API responses
 * @param {Object} options - Caching options
 * @param {string} options.keyGenerator - Function to generate cache key
 * @param {number} options.ttl - TTL in seconds
 * @param {Function} options.skipCache - Function to determine if caching should be skipped
 */
const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator = (req) => `api:${req.method}:${req.originalUrl}`,
    ttl = 300, // 5 minutes default
    skipCache = () => false
  } = options;

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

      const cacheKey = keyGenerator(req);
      
      // Try to get from cache
      const cachedData = await cacheManager.getFromCache(cacheKey);
      
      if (cachedData) {
        logger.info(`🎯 CACHE HIT: ${cacheKey}`, {
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
          path: req.originalUrl
        });
        return res.json(cachedData);
      } else {
        logger.info(`❌ CACHE MISS: ${cacheKey}`, {
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
          path: req.originalUrl
        });
      }

      // Intercept response to cache it
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response asynchronously
        setImmediate(async () => {
          try {
            await cacheManager.setToCache(cacheKey, data, ttl);
          } catch (error) {
            logger.error(`Failed to cache response for ${cacheKey}:`, error);
          }
        });

        // Send the original response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Don't let caching errors break the request
      next();
    }
  };
};

/**
 * User-specific caching middleware
 * Caches responses based on user ID from JWT token
 */
const userCacheMiddleware = (dataType, ttl = 300) => {
  return cacheMiddleware({
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return cacheManager.generateKey('user', dataType, userId);
    },
    ttl,
    skipCache: (req) => !req.user?.id // Skip if no user ID
  });
};

/**
 * Resource-specific caching middleware
 * Caches responses based on resource ID from URL parameters
 */
const resourceCacheMiddleware = (resourceType, paramName = 'id', ttl = 300) => {
  return cacheMiddleware({
    keyGenerator: (req) => {
      const resourceId = req.params[paramName];
      const userId = req.user?.id || 'anonymous';
      return cacheManager.generateKey(resourceType, userId, resourceId);
    },
    ttl,
    skipCache: (req) => !req.params[paramName]
  });
};

/**
 * Public API caching middleware
 * For endpoints that don't require authentication
 */
const publicCacheMiddleware = (resourceType, ttl = 600) => {
  return cacheMiddleware({
    keyGenerator: (req) => {
      const path = req.route?.path || req.path;
      return cacheManager.generateKey('public', resourceType, path);
    },
    ttl
  });
};

/**
 * Cache invalidation helper for controllers
 */
const invalidateUserCache = async (userId, dataType = null) => {
  try {
    if (dataType) {
      const key = cacheManager.generateKey('user', dataType, userId);
      await cacheManager.invalidateCache(key);
      logger.info(`🗑️ CACHE INVALIDATED: ${key}`, {
        userId,
        dataType,
        timestamp: new Date().toISOString()
      });
    } else {
      // Invalidate all user cache
      await cacheManager.invalidateUserCache(userId);
      logger.info(`🗑️ CACHE INVALIDATED ALL: user:*:${userId}`, {
        userId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error(`Failed to invalidate cache for user ${userId}:`, error);
  }
};

/**
 * Cache invalidation for resource updates
 */
const invalidateResourceCache = async (resourceType, resourceId, userId = null) => {
  try {
    if (userId) {
      const key = cacheManager.generateKey(resourceType, userId, resourceId);
      await cacheManager.invalidateCache(key);
    } else {
      // Invalidate all related cache entries
      const pattern = `${resourceType}:*:${resourceId}`;
      await cacheManager.invalidateCachePattern(pattern);
    }
  } catch (error) {
    logger.error(`Failed to invalidate cache for ${resourceType} ${resourceId}:`, error);
  }
};

/**
 * Middleware to clear cache after mutations
 */
const clearCacheMiddleware = (options = {}) => {
  const {
    userDataTypes = [],
    resourceType = null,
    customInvalidation = null
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
            if (customInvalidation) {
              await customInvalidation(req, res);
            } else {
              const userId = req.user?.id;
              
              // Invalidate user-specific cache
              if (userId && userDataTypes.length > 0) {
                for (const dataType of userDataTypes) {
                  await invalidateUserCache(userId, dataType);
                }
              }
              
              // Invalidate resource-specific cache
              if (resourceType && req.params?.id) {
                await invalidateResourceCache(resourceType, req.params.id, userId);
              }
            }
          } catch (error) {
            logger.error('Cache invalidation error:', error);
          }
        });
      }
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  cacheMiddleware,
  userCacheMiddleware,
  resourceCacheMiddleware,
  publicCacheMiddleware,
  clearCacheMiddleware,
  invalidateUserCache,
  invalidateResourceCache
};