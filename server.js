require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const { setupLogger } = require('./utils/logger');
const { connectDB } = require('./config/database');

// Initialize logger
const logger = setupLogger();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const addressRoutes = require('./routes/address.routes');
const preferencesRoutes = require('./routes/preferences.routes');
const driverDocumentRoutes = require('./routes/driverDocument.routes');
const driverStatusRoutes = require('./routes/driverStatus.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "http://localhost:3000", "https://localhost:3000"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Set security HTTP headers
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10kb' })); // Body parser for JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(compression());

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all requests
app.use('/api', limiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api', driverDocumentRoutes);
app.use('/api/driver', driverStatusRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Only start the server if not in Vercel environment
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize database connection
if (!process.env.VERCEL) {
  startServer();
} else {
  // For Vercel, just connect to database without starting server
  connectDB().catch(error => {
    logger.error('Failed to connect to database:', error);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  console.error('UNHANDLED REJECTION:', err);
  
  // Gracefully shutdown
  process.exit(1);
});

module.exports = app; // For testing