/**
 * Winston Logging Utility
 *
 * FEATURES:
 * - Multiple log levels (error, warn, info, debug)
 * - File-based logging with rotation
 * - Console logging in development
 * - Production-safe logging (no sensitive data)
 * - Log file size management
 * - Timestamp formatting
 */

const winston = require('winston');
const path = require('path');
const { app } = require('electron');

// Determine if running in production or development
const isProduction = app ? app.isPackaged : process.env.NODE_ENV === 'production';

// Log directory
const LOG_DIR = app ? path.join(app.getPath('userData'), 'logs') : path.join(process.cwd(), 'logs');

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Log colors for console
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(LOG_COLORS);

/**
 * Custom log format with timestamp and colorization
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Console format (colorized for development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

/**
 * Create transports (where logs are written)
 */
const transports = [];

// Console transport (always enabled in development, disabled in production)
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug' // Show all logs in development
    })
  );
}

// File transport for errors (always enabled)
transports.push(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
);

// File transport for combined logs (info and above)
transports.push(
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    level: isProduction ? 'info' : 'debug',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  })
);

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  transports,
  exitOnError: false
});

/**
 * Log an error with stack trace
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or metadata
 */
logger.logError = (message, error) => {
  if (error instanceof Error) {
    logger.error(message, { stack: error.stack, message: error.message });
  } else {
    logger.error(message, error);
  }
};

/**
 * Log a warning
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
logger.logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
logger.logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

/**
 * Log a debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
logger.logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

/**
 * Sanitize sensitive data before logging
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
logger.sanitize = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password',
    'apiKey',
    'token',
    'secret',
    'authorization',
    'cookie',
    'sessionId'
  ];

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = logger.sanitize(sanitized[key]);
    }
  });

  return sanitized;
};

/**
 * Log function entry (for debugging)
 * @param {string} functionName - Name of the function
 * @param {Object} params - Function parameters
 */
logger.logEntry = (functionName, params = {}) => {
  if (!isProduction) {
    logger.debug(`→ ${functionName}`, logger.sanitize(params));
  }
};

/**
 * Log function exit (for debugging)
 * @param {string} functionName - Name of the function
 * @param {*} result - Function result
 */
logger.logExit = (functionName, result) => {
  if (!isProduction) {
    logger.debug(`← ${functionName}`, { result: typeof result });
  }
};

/**
 * Log IPC handler call
 * @param {string} channel - IPC channel name
 * @param {Object} params - Parameters passed to handler
 */
logger.logIPC = (channel, params = {}) => {
  logger.info(`[IPC] ${channel}`, logger.sanitize(params));
};

/**
 * Log security event
 * @param {string} event - Security event description
 * @param {Object} details - Event details
 */
logger.logSecurity = (event, details = {}) => {
  logger.warn(`[SECURITY] ${event}`, logger.sanitize(details));
};

/**
 * Log performance metric
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {Object} meta - Additional metadata
 */
logger.logPerformance = (operation, duration, meta = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level](`[PERF] ${operation} took ${duration}ms`, meta);
};

// Log initialization
logger.info('Logger initialized', {
  environment: isProduction ? 'production' : 'development',
  logDirectory: LOG_DIR,
  logLevel: isProduction ? 'info' : 'debug'
});

module.exports = logger;
