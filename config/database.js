require('dotenv').config();
const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// MySQL connection configuration
const config = {
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Add SSL configuration for production (only if DATABASE_SSL is enabled)
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true') {
  config.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

// For production, use DATABASE_URL if available (common with cloud providers)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, config)
  : new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
      ...config,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT
    }
  );

// Database connection state
let isConnected = false;
let isConnecting = false;
let connectionError = null;

// Test database connection (non-blocking)
const connectDB = async () => {
  if (isConnected) return true;
  if (isConnecting) return false;
  
  isConnecting = true;
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models with the database
    // Using alter:true instead of force:true to keep data between restarts
    await sequelize.sync({ alter: false });
    logger.info('Database synchronized successfully');
    
    isConnected = true;
    isConnecting = false;
    connectionError = null;
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    isConnecting = false;
    connectionError = error;
    return false;
  }
};

// Lazy database connection middleware
const ensureDBConnection = async (req, res, next) => {
  if (isConnected) {
    return next();
  }
  
  if (isConnecting) {
    // Wait for ongoing connection attempt
    let attempts = 0;
    while (isConnecting && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (isConnected) {
      return next();
    }
  }
  
  // Try to connect
  const connected = await connectDB();
  if (connected) {
    return next();
  }
  
  // Connection failed
  return res.status(500).json({
    status: 'error',
    message: 'Database connection failed',
    error: connectionError?.message || 'Unknown database error'
  });
};

// Get database connection status
const getDBStatus = () => ({
  connected: isConnected,
  connecting: isConnecting,
  error: connectionError?.message || null
});

module.exports = {
  sequelize,
  connectDB,
  ensureDBConnection,
  getDBStatus
};