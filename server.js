require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { errorHandler } = require('./middleware/errorHandler');
const { setupLogger } = require('./utils/logger');
const { connectDB, ensureDBConnection, getDBStatus } = require('./config/database');
const redisConfig = require('./config/redis');

// Initialize logger
const logger = setupLogger();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_EXPIRES_IN', 'REFRESH_TOKEN_EXPIRES_IN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

logger.info(`JWT Configuration - Access Token: ${process.env.JWT_EXPIRES_IN}, Refresh Token: ${process.env.REFRESH_TOKEN_EXPIRES_IN}`);
logger.info(`FCM Configuration - Enabled: ${process.env.FCM_ENABLED || 'false'}`);

// routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const addressRoutes = require('./routes/address.routes');
const preferencesRoutes = require('./routes/preferences.routes');
const driverDocumentRoutes = require('./routes/driverDocument.routes');
const driverStatusRoutes = require('./routes/driverStatus.routes');
const driverSignupRoutes = require('./routes/driverSignup.routes');
const driverAuthRoutes = require('./routes/driverAuth.routes');
const vehicleTypeRoutes = require('./routes/vehicleType.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Cloud Run
app.set('trust proxy', true);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ['\'self\'', 'http://localhost:3000', 'https://localhost:3000']
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
})); // Set security HTTP headers
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10kb' })); // Body parser for JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cors({
  origin: true, // Allow all origins for admin panel access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(compression());

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for file uploads
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15 min in prod, 5 min in dev
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 in prod, 1000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

// Apply rate limiting to all requests
app.use('/api', limiter);

// Health check route (server health only - for Cloud Run startup probe)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'running',
    jwt: {
      accessTokenExpiry: process.env.JWT_EXPIRES_IN,
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN,
      hasSecret: !!process.env.JWT_SECRET,
      hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET
    }
  });
});

// Database health check route
app.get('/health/db', async (req, res) => {
  const dbStatus = getDBStatus();
  
  if (dbStatus.connected) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        connecting: false
      }
    });
  } else if (dbStatus.connecting) {
    res.status(503).json({
      status: 'connecting',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        connecting: true
      }
    });
  } else {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        connecting: false,
        error: dbStatus.error
      }
    });
  }
});

// Cache health check route
app.get('/health/cache', async (req, res) => {
  try {
    const cacheManager = require('./utils/cache');
    const cacheStats = await cacheManager.getCacheStats();
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      cache: {
        available: cacheStats.available,
        connected: cacheStats.connected
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      cache: {
        available: false,
        error: error.message
      }
    });
  }
});

// FCM health check route
app.get('/health/fcm', async (req, res) => {
  try {
    const notificationService = require('./services/notificationService');
    const status = notificationService.getStatus();
    
    res.status(200).json({ 
      status: status.fcm.available ? 'ok' : 'disabled', 
      timestamp: new Date().toISOString(),
      fcm: status.fcm
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      fcm: {
        available: false,
        error: error.message
      }
    });
  }
});

// JWT Debug endpoint for production testing
app.get('/debug/jwt', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({
      error: 'Please provide token as query parameter: /debug/jwt?token=your_token'
    });
  }
  
  try {
    // Try to decode without verification to see the payload
    const decodedWithoutVerify = jwt.decode(token, { complete: true });
    
    // Try to verify the token
    let verificationResult;
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      verificationResult = { success: true, payload: verified };
    } catch (verifyError) {
      verificationResult = { 
        success: false, 
        error: verifyError.name,
        message: verifyError.message,
        expiredAt: verifyError.expiredAt
      };
    }
    
    res.json({
      status: 'jwt-debug',
      environment: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        nodeEnv: process.env.NODE_ENV
      },
      token: {
        preview: token.substring(0, 50) + '...',
        length: token.length,
        parts: token.split('.').length
      },
      decoded: decodedWithoutVerify,
      verification: verificationResult,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to debug token',
      message: error.message
    });
  }
});

// Cache test route
app.get('/health/cache-test', async (req, res) => {
  
  try {
    const CacheTest = require('./utils/cacheTest');
    const testResults = await CacheTest.runAllTests();
    
    res.status(200).json({
      status: 'cache-test-completed',
      timestamp: new Date().toISOString(),
      results: testResults
    });
  } catch (error) {
    logger.error('Cache test endpoint error:', error);
    res.status(500).json({
      status: 'cache-test-failed',
      error: error.message
    });
  }
});

// Driver cache test route
app.get('/health/driver-cache-test', async (req, res) => {
  
  try {
    const DriverCacheTest = require('./utils/driverCacheTest');
    const testResults = await DriverCacheTest.runAllDriverCacheTests();
    
    res.status(200).json({
      status: 'driver-cache-test-completed',
      timestamp: new Date().toISOString(),
      results: testResults
    });
  } catch (error) {
    logger.error('Driver cache test endpoint error:', error);
    res.status(500).json({
      status: 'driver-cache-test-failed',
      error: error.message
    });
  }
});

// Apply lazy database connection middleware to all API routes
app.use('/api', ensureDBConnection);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api', driverDocumentRoutes);
app.use('/api/driver', driverStatusRoutes);
app.use('/api/drivers', driverSignupRoutes);
app.use('/api/driver-auth', driverAuthRoutes);
app.use('/api/vehicles', vehicleTypeRoutes);
app.use('/api/admin/vehicles', vehicleRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server without blocking on database connection
const startServer = async () => {
  try {
    // Initialize Redis connection (non-blocking)
    if (process.env.CACHE_ENABLED !== 'false') {
      try {
        await redisConfig.connect();
        logger.info('Cache system initialized');
      } catch (error) {
        logger.warn('Cache system failed to initialize, continuing without cache:', error.message);
      }
    } else {
      logger.info('Cache system disabled by configuration');
    }

    // Initialize notification service (non-blocking)
    try {
      const notificationService = require('./services/notificationService');
      await notificationService.initialize();
      logger.info('Notification service initialized');
    } catch (error) {
      logger.warn('Notification service failed to initialize, continuing without FCM:', error.message);
    }
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info('Database connection will be established on first API request');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  console.error('UNHANDLED REJECTION:', err);
  
  // Gracefully shutdown
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close Redis connection
  try {
    await redisConfig.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close Redis connection
  try {
    await redisConfig.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

module.exports = app; // For testing