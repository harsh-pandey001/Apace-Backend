const redisConfig = require('../config/redis');
const { setupLogger } = require('./logger');

const logger = setupLogger();

class CacheManager {
  constructor() {
    this.defaultTTL = 300; // 5 minutes in seconds
    this.keyPrefix = 'apace:';
  }

  /**
   * Generate a structured cache key
   * @param {string} type - The type of data (user, shipment, etc.)
   * @param {string} subtype - The subtype (profile, shipments, preferences)
   * @param {string|number} id - The identifier
   * @returns {string} Formatted cache key
   */
  generateKey(type, subtype, id) {
    return `${this.keyPrefix}${type}:${subtype}:${id}`;
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached data or null if not found
   */
  async getFromCache(key) {
    try {
      if (!redisConfig.isRedisAvailable()) {
        logger.debug('Redis not available, skipping cache read');
        return null;
      }

      const client = redisConfig.getClient();
      const cachedData = await client.get(key);
      
      if (cachedData) {
        logger.debug(`Cache HIT for key: ${key}`);
        return JSON.parse(cachedData);
      } else {
        logger.debug(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Cache read error for key ${key}:`, error);
      return null; // Fail silently and fall back to DB
    }
  }

  /**
   * Set data to cache with TTL
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - TTL in seconds (optional, uses default if not provided)
   * @returns {Promise<boolean>} Success status
   */
  async setToCache(key, data, ttl = this.defaultTTL) {
    try {
      if (!redisConfig.isRedisAvailable()) {
        logger.debug('Redis not available, skipping cache write');
        return false;
      }

      const client = redisConfig.getClient();
      const serializedData = JSON.stringify(data);
      
      await client.setEx(key, ttl, serializedData);
      logger.debug(`Cache SET for key: ${key} with TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`Cache write error for key ${key}:`, error);
      return false; // Fail silently
    }
  }

  /**
   * Invalidate cache by key
   * @param {string} key - Cache key to invalidate
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCache(key) {
    try {
      if (!redisConfig.isRedisAvailable()) {
        logger.debug('Redis not available, skipping cache invalidation');
        return false;
      }

      const client = redisConfig.getClient();
      const result = await client.del(key);
      
      if (result > 0) {
        logger.debug(`Cache INVALIDATED for key: ${key}`);
      } else {
        logger.debug(`Cache key not found for invalidation: ${key}`);
      }
      
      return result > 0;
    } catch (error) {
      logger.error(`Cache invalidation error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate multiple cache keys by pattern
   * @param {string} pattern - Pattern to match keys (e.g., 'user:*:123')
   * @returns {Promise<number>} Number of keys invalidated
   */
  async invalidateCachePattern(pattern) {
    try {
      if (!redisConfig.isRedisAvailable()) {
        logger.debug('Redis not available, skipping pattern invalidation');
        return 0;
      }

      const client = redisConfig.getClient();
      const fullPattern = `${this.keyPrefix}${pattern}`;
      
      // Get all keys matching the pattern
      const keys = await client.keys(fullPattern);
      
      if (keys.length === 0) {
        logger.debug(`No keys found for pattern: ${fullPattern}`);
        return 0;
      }

      // Delete all matching keys
      const result = await client.del(keys);
      logger.debug(`Cache PATTERN INVALIDATED: ${result} keys for pattern: ${fullPattern}`);
      
      return result;
    } catch (error) {
      logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set cache data (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if cache miss
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<any>} Data from cache or fetch function
   */
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cachedData = await this.getFromCache(key);
      if (cachedData !== null) {
        return cachedData;
      }

      // Cache miss - fetch data
      logger.debug(`Fetching fresh data for key: ${key}`);
      const freshData = await fetchFunction();
      
      // Cache the fresh data
      if (freshData !== null && freshData !== undefined) {
        await this.setToCache(key, freshData, ttl);
      }
      
      return freshData;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // If caching fails, still try to return fresh data
      try {
        return await fetchFunction();
      } catch (fetchError) {
        logger.error(`Fetch function error for key ${key}:`, fetchError);
        throw fetchError;
      }
    }
  }

  /**
   * Cache user-specific data
   */
  async cacheUserData(userId, dataType, data, ttl = this.defaultTTL) {
    const key = this.generateKey('user', dataType, userId);
    return await this.setToCache(key, data, ttl);
  }

  /**
   * Get user-specific cached data
   */
  async getUserCachedData(userId, dataType) {
    const key = this.generateKey('user', dataType, userId);
    return await this.getFromCache(key);
  }

  /**
   * Invalidate all user-specific cache
   */
  async invalidateUserCache(userId) {
    const pattern = `user:*:${userId}`;
    return await this.invalidateCachePattern(pattern);
  }

  /**
   * Get cache statistics (if available)
   */
  async getCacheStats() {
    try {
      if (!redisConfig.isRedisAvailable()) {
        return { available: false };
      }

      const client = redisConfig.getClient();
      const info = await client.info('memory');
      
      return {
        available: true,
        connected: redisConfig.isRedisAvailable(),
        memory: info
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return { available: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new CacheManager();