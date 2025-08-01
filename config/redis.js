const { createClient } = require('redis');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis configuration options
      const redisOptions = {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      };

      // Add password if provided
      if (process.env.REDIS_PASSWORD) {
        redisOptions.password = process.env.REDIS_PASSWORD;
      }

      // Add URL if provided (overrides individual options)
      if (process.env.REDIS_URL) {
        redisOptions.url = process.env.REDIS_URL;
        delete redisOptions.socket;
        delete redisOptions.password;
      }

      this.client = createClient(redisOptions);

      // Error handling
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      await this.client.connect();
      logger.info('Redis connection established successfully');
      
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      // Don't throw error - allow app to run without Redis
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  getClient() {
    return this.client;
  }

  isRedisAvailable() {
    return this.isConnected && this.client;
  }
}

// Create singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;