/**
 * Error Handling and Sanitization Utility
 *
 * SECURITY: Sanitizes error messages for production to prevent
 * information leakage while maintaining debuggability.
 *
 * FEATURES:
 * - Error ID generation for support lookup
 * - Production-safe error messages
 * - Detailed logging for debugging
 * - Error code constants
 * - Stack trace sanitization
 */

const crypto = require('crypto');
const logger = require('./logger');
const { ValidationError } = require('./validators');

// Determine if running in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Error codes
 */
const ERROR_CODES = {
  // Validation errors (4xx)
  VALIDATION_ERROR: 'ERR_VALIDATION',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  MISSING_PARAMETER: 'ERR_MISSING_PARAM',

  // File operation errors (5xx)
  FILE_NOT_FOUND: 'ERR_FILE_NOT_FOUND',
  FILE_READ_ERROR: 'ERR_FILE_READ',
  FILE_WRITE_ERROR: 'ERR_FILE_WRITE',
  FILE_TOO_LARGE: 'ERR_FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'ERR_INVALID_FORMAT',

  // Database errors (6xx)
  DATABASE_ERROR: 'ERR_DATABASE',
  QUERY_ERROR: 'ERR_QUERY',
  CONNECTION_ERROR: 'ERR_CONNECTION',
  CACHE_ERROR: 'ERR_CACHE',

  // Security errors (7xx)
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  PATH_TRAVERSAL: 'ERR_PATH_TRAVERSAL',
  SQL_INJECTION: 'ERR_SQL_INJECTION',

  // Network errors (8xx)
  NETWORK_ERROR: 'ERR_NETWORK',
  TIMEOUT: 'ERR_TIMEOUT',
  SSRF_BLOCKED: 'ERR_SSRF_BLOCKED',

  // Generic errors (9xx)
  UNKNOWN_ERROR: 'ERR_UNKNOWN',
  INTERNAL_ERROR: 'ERR_INTERNAL'
};

/**
 * Generate a unique error ID
 * @returns {string} 8-character error ID
 */
function generateErrorId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Get error code from error type
 * @param {Error} error - Error object
 * @returns {string} Error code
 */
function getErrorCode(error) {
  if (error instanceof ValidationError) {
    return ERROR_CODES.VALIDATION_ERROR;
  }

  if (error.code === 'ENOENT') {
    return ERROR_CODES.FILE_NOT_FOUND;
  }

  if (error.code === 'EACCES') {
    return ERROR_CODES.FORBIDDEN;
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    return ERROR_CODES.NETWORK_ERROR;
  }

  if (error.message?.includes('too large')) {
    return ERROR_CODES.FILE_TOO_LARGE;
  }

  if (error.message?.includes('path traversal')) {
    return ERROR_CODES.PATH_TRAVERSAL;
  }

  if (error.message?.includes('SQL') || error.message?.includes('database')) {
    return ERROR_CODES.DATABASE_ERROR;
  }

  return ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Sanitize error message for production
 *
 * In production, return generic messages to prevent information leakage.
 * In development, return full error details for debugging.
 *
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred (e.g., function name)
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(error, context = '') {
  if (!isProduction) {
    // Development: Return full error message for debugging
    return error.message || 'Unknown error occurred';
  }

  // Production: Return generic messages based on error type
  const errorCode = getErrorCode(error);

  const genericMessages = {
    [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input provided',
    [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
    [ERROR_CODES.MISSING_PARAMETER]: 'Required parameter missing',

    [ERROR_CODES.FILE_NOT_FOUND]: 'File not found',
    [ERROR_CODES.FILE_READ_ERROR]: 'Unable to read file',
    [ERROR_CODES.FILE_WRITE_ERROR]: 'Unable to write file',
    [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds maximum limit',
    [ERROR_CODES.INVALID_FILE_FORMAT]: 'Invalid file format',

    [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
    [ERROR_CODES.QUERY_ERROR]: 'Query execution failed',
    [ERROR_CODES.CONNECTION_ERROR]: 'Database connection failed',
    [ERROR_CODES.CACHE_ERROR]: 'Cache operation failed',

    [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
    [ERROR_CODES.FORBIDDEN]: 'Access denied',
    [ERROR_CODES.PATH_TRAVERSAL]: 'Invalid file path',
    [ERROR_CODES.SQL_INJECTION]: 'Invalid input detected',

    [ERROR_CODES.NETWORK_ERROR]: 'Network request failed',
    [ERROR_CODES.TIMEOUT]: 'Operation timed out',
    [ERROR_CODES.SSRF_BLOCKED]: 'Request blocked for security',

    [ERROR_CODES.UNKNOWN_ERROR]: 'An error occurred',
    [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error'
  };

  return genericMessages[errorCode] || 'An error occurred';
}

/**
 * Create a sanitized error response for IPC
 *
 * This function creates a consistent error response structure
 * for IPC handlers with appropriate sanitization.
 *
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Sanitized error response
 */
function createErrorResponse(error, context = '') {
  const errorId = generateErrorId();
  const errorCode = getErrorCode(error);
  const sanitizedMessage = sanitizeErrorMessage(error, context);

  // Log the full error details for debugging (with error ID for correlation)
  logger.logError(`[${errorId}] Error in ${context}`, {
    errorId,
    errorCode,
    message: error.message,
    stack: error.stack,
    context
  });

  // Return sanitized response
  const response = {
    success: false,
    error: errorCode,
    message: sanitizedMessage,
    errorId: errorId
  };

  // In development, include additional details
  if (!isProduction) {
    response._debug = {
      originalMessage: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      context
    };
  }

  return response;
}

/**
 * Wrap an async IPC handler with error handling
 *
 * This is a convenience wrapper that automatically catches errors
 * and returns sanitized error responses.
 *
 * @param {Function} handler - Async IPC handler function
 * @param {string} handlerName - Name of the handler (for logging)
 * @returns {Function} Wrapped handler function
 *
 * @example
 * const myHandler = wrapHandler(async (event, params) => {
 *   // Handler logic here
 *   return { success: true, data: result };
 * }, 'myHandler');
 */
function wrapHandler(handler, handlerName) {
  return async (event, ...args) => {
    const startTime = Date.now();

    try {
      logger.logIPC(handlerName, args[0]); // Log IPC call

      const result = await handler(event, ...args);

      const duration = Date.now() - startTime;
      logger.logPerformance(handlerName, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error with performance data
      logger.logError(`${handlerName} failed after ${duration}ms`, error);

      // Return sanitized error response
      return createErrorResponse(error, handlerName);
    }
  };
}

/**
 * Try-catch wrapper with error sanitization
 *
 * Use this for non-IPC error handling within functions.
 *
 * @param {Function} fn - Function to execute
 * @param {string} context - Context description
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 *
 * @example
 * const result = await tryCatch(
 *   async () => await someOperation(),
 *   'someOperation'
 * );
 * if (!result.success) {
 *   console.error(result.error);
 * }
 */
async function tryCatch(fn, context = '') {
  try {
    const data = await fn();
    return {
      success: true,
      data
    };
  } catch (error) {
    logger.logError(`Error in ${context}`, error);

    return {
      success: false,
      error: sanitizeErrorMessage(error, context),
      errorId: generateErrorId()
    };
  }
}

/**
 * Validation error wrapper
 *
 * Creates a standardized response for validation errors.
 *
 * @param {string} message - Error message
 * @param {string} field - Field name that failed validation
 * @returns {Object} Error response
 */
function validationError(message, field = null) {
  const error = new ValidationError(message, field);
  return createErrorResponse(error, 'validation');
}

module.exports = {
  // Error codes
  ERROR_CODES,

  // Error handling functions
  generateErrorId,
  getErrorCode,
  sanitizeErrorMessage,
  createErrorResponse,
  wrapHandler,
  tryCatch,
  validationError,

  // Utilities
  isProduction
};
