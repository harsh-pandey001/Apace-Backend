const winston = require('winston');
const path = require('path');

const setupLogger = () => {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // Determine log file paths
  const logDir = 'logs';
  const errorLogPath = path.join(logDir, 'error.log');
  const combinedLogPath = path.join(logDir, 'combined.log');

  // Create logger instance
  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'apace-transportation-api' },
    transports: [
      // Console transport for all environments
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            info => `${info.timestamp} ${info.level}: ${info.message}`
          )
        )
      })
    ]
  });

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({
        filename: errorLogPath,
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
    
    logger.add(
      new winston.transports.File({
        filename: combinedLogPath,
        maxsize: 10485760, // 10MB
        maxFiles: 5
      })
    );
  }

  return logger;
};

// Create and export logger instance
const logger = setupLogger();

module.exports = {
  logger,
  setupLogger
};