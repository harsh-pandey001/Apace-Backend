const cacheManager = require('./cache');
const { setupLogger } = require('./logger');

const logger = setupLogger();

/**
 * Driver-specific cache management utilities
 * Implements structured caching for driver-side API responses
 */
class DriverCacheManager {
  constructor() {
    this.defaultTTL = 300; // 5 minutes for driver data
    this.keyPrefix = 'driver:';
  }

  /**
   * Generate structured cache keys for driver data
   * @param {string} dataType - Type of driver data (profile, status, shipments, preferences, documents)
   * @param {string|number} driverId - Driver ID
   * @param {string} subType - Optional subtype for granular caching
   * @returns {string} Formatted cache key
   */
  generateDriverKey(dataType, driverId, subType = null) {
    const baseKey = `${this.keyPrefix}${dataType}:${driverId}`;
    return subType ? `${baseKey}:${subType}` : baseKey;
  }

  /**
   * Cache driver profile data
   * @param {string} driverId - Driver ID
   * @param {Object} profileData - Driver profile data
   * @param {number} ttl - TTL in seconds (default: 5 minutes)
   */
  async cacheDriverProfile(driverId, profileData, ttl = this.defaultTTL) {
    const key = this.generateDriverKey('profile', driverId);
    return await cacheManager.setToCache(key, profileData, ttl);
  }

  /**
   * Get cached driver profile data
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object|null>} Cached profile data or null
   */
  async getDriverProfile(driverId) {
    const key = this.generateDriverKey('profile', driverId);
    return await cacheManager.getFromCache(key);
  }

  /**
   * Cache driver availability status
   * @param {string} driverId - Driver ID
   * @param {Object} statusData - Driver status data
   * @param {number} ttl - TTL in seconds (default: 5 minutes)
   */
  async cacheDriverStatus(driverId, statusData, ttl = this.defaultTTL) {
    const key = this.generateDriverKey('status', driverId);
    return await cacheManager.setToCache(key, statusData, ttl);
  }

  /**
   * Get cached driver status
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object|null>} Cached status data or null
   */
  async getDriverStatus(driverId) {
    const key = this.generateDriverKey('status', driverId);
    return await cacheManager.getFromCache(key);
  }

  /**
   * Cache driver assigned shipments
   * @param {string} driverId - Driver ID
   * @param {Array} shipmentsData - Array of assigned shipments
   * @param {number} ttl - TTL in seconds (default: 3 minutes for shipments)
   */
  async cacheDriverShipments(driverId, shipmentsData, ttl = 180) {
    const key = this.generateDriverKey('shipments', driverId, 'assigned');
    return await cacheManager.setToCache(key, shipmentsData, ttl);
  }

  /**
   * Get cached driver shipments
   * @param {string} driverId - Driver ID
   * @returns {Promise<Array|null>} Cached shipments data or null
   */
  async getDriverShipments(driverId) {
    const key = this.generateDriverKey('shipments', driverId, 'assigned');
    return await cacheManager.getFromCache(key);
  }

  /**
   * Cache driver documents
   * @param {string} driverId - Driver ID
   * @param {Object} documentsData - Driver documents data
   * @param {number} ttl - TTL in seconds (default: 10 minutes for documents)
   */
  async cacheDriverDocuments(driverId, documentsData, ttl = 600) {
    const key = this.generateDriverKey('documents', driverId);
    return await cacheManager.setToCache(key, documentsData, ttl);
  }

  /**
   * Get cached driver documents
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object|null>} Cached documents data or null
   */
  async getDriverDocuments(driverId) {
    const key = this.generateDriverKey('documents', driverId);
    return await cacheManager.getFromCache(key);
  }

  /**
   * Cache driver preferences
   * @param {string} driverId - Driver ID
   * @param {Object} preferencesData - Driver preferences data
   * @param {number} ttl - TTL in seconds (default: 10 minutes)
   */
  async cacheDriverPreferences(driverId, preferencesData, ttl = 600) {
    const key = this.generateDriverKey('preferences', driverId);
    return await cacheManager.setToCache(key, preferencesData, ttl);
  }

  /**
   * Get cached driver preferences
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object|null>} Cached preferences data or null
   */
  async getDriverPreferences(driverId) {
    const key = this.generateDriverKey('preferences', driverId);
    return await cacheManager.getFromCache(key);
  }

  /**
   * Invalidate specific driver cache by data type
   * @param {string} driverId - Driver ID
   * @param {string} dataType - Type of data to invalidate (profile, status, shipments, documents, preferences)
   * @param {string} subType - Optional subtype
   */
  async invalidateDriverCache(driverId, dataType, subType = null) {
    const key = this.generateDriverKey(dataType, driverId, subType);
    const result = await cacheManager.invalidateCache(key);
    
    if (result) {
      logger.debug(`Driver cache invalidated: ${key}`);
    }
    
    return result;
  }

  /**
   * Invalidate all cache for a specific driver
   * @param {string} driverId - Driver ID
   * @returns {Promise<number>} Number of keys invalidated
   */
  async invalidateAllDriverCache(driverId) {
    const pattern = `driver:*:${driverId}*`;
    const count = await cacheManager.invalidateCachePattern(pattern);
    
    if (count > 0) {
      logger.debug(`All driver cache invalidated for driver ${driverId}: ${count} keys`);
    }
    
    return count;
  }

  /**
   * Invalidate driver shipments cache (when shipment status changes)
   * @param {string} driverId - Driver ID
   */
  async invalidateDriverShipmentsCache(driverId) {
    return await this.invalidateDriverCache(driverId, 'shipments', 'assigned');
  }

  /**
   * Cache-aside pattern for driver data
   * @param {string} driverId - Driver ID
   * @param {string} dataType - Type of data
   * @param {Function} fetchFunction - Function to fetch data if cache miss
   * @param {number} ttl - TTL in seconds
   * @param {string} subType - Optional subtype
   * @returns {Promise<any>} Data from cache or fetch function
   */
  async getOrSetDriverData(driverId, dataType, fetchFunction, ttl = this.defaultTTL, subType = null) {
    const key = this.generateDriverKey(dataType, driverId, subType);
    
    try {
      // Try to get from cache first
      const cachedData = await cacheManager.getFromCache(key);
      if (cachedData !== null) {
        logger.debug(`Driver cache HIT: ${key}`);
        return cachedData;
      }

      // Cache miss - fetch data
      logger.debug(`Driver cache MISS: ${key} - fetching fresh data`);
      const freshData = await fetchFunction();
      
      // Cache the fresh data
      if (freshData !== null && freshData !== undefined) {
        await cacheManager.setToCache(key, freshData, ttl);
        logger.debug(`Driver cache SET: ${key}`);
      }
      
      return freshData;
    } catch (error) {
      logger.error(`Driver cache error for key ${key}:`, error);
      // If caching fails, still try to return fresh data
      try {
        return await fetchFunction();
      } catch (fetchError) {
        logger.error(`Driver fetch function error for key ${key}:`, fetchError);
        throw fetchError;
      }
    }
  }

  /**
   * Get driver cache statistics
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Cache statistics for the driver
   */
  async getDriverCacheStats(driverId) {
    const pattern = `${cacheManager.keyPrefix}driver:*:${driverId}*`;
    
    try {
      const redisConfig = require('../config/redis');
      if (!redisConfig.isRedisAvailable()) {
        return { available: false, driverId };
      }

      const client = redisConfig.getClient();
      const keys = await client.keys(pattern);
      
      const stats = {
        driverId,
        totalKeys: keys.length,
        keys: keys,
        available: true
      };

      // Get TTL for each key
      for (const key of keys) {
        const ttl = await client.ttl(key);
        stats[key] = { ttl };
      }

      return stats;
    } catch (error) {
      logger.error(`Error getting driver cache stats for ${driverId}:`, error);
      return { available: false, driverId, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new DriverCacheManager();