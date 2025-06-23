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

// Add SSL configuration for production
if (process.env.NODE_ENV === 'production') {
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

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models with the database
    // Using alter:true instead of force:true to keep data between restarts
    await sequelize.sync({ alter: false });
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};