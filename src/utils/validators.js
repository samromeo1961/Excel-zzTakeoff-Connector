/**
 * Input Validation Utilities
 *
 * SECURITY: All input validation functions to prevent injection attacks,
 * type confusion, and invalid data processing.
 *
 * FEATURES:
 * - Type validation
 * - Range validation
 * - String validation
 * - Object validation
 * - Array validation
 * - SQL injection prevention
 */

const logger = require('./logger');

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validate string parameter
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Pattern to match
 * @param {boolean} options.required - Whether field is required
 * @returns {string} Validated string
 * @throws {ValidationError} If validation fails
 */
function validateString(value, fieldName, options = {}) {
  const {
    minLength = 0,
    maxLength = Infinity,
    pattern = null,
    required = true
  } = options;

  // Check if required
  if (required && (value === null || value === undefined || value === '')) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return empty string
  if (!required && (value === null || value === undefined || value === '')) {
    return '';
  }

  // Type check
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  // Length validation
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters`,
      fieldName
    );
  }

  if (value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${maxLength} characters`,
      fieldName
    );
  }

  // Pattern validation
  if (pattern && !pattern.test(value)) {
    throw new ValidationError(
      `${fieldName} format is invalid`,
      fieldName
    );
  }

  return value;
}

/**
 * Validate number parameter
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.integer - Must be integer
 * @param {boolean} options.required - Whether field is required
 * @returns {number} Validated number
 * @throws {ValidationError} If validation fails
 */
function validateNumber(value, fieldName, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    required = true
  } = options;

  // Check if required
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return default
  if (!required && (value === null || value === undefined)) {
    return options.default || 0;
  }

  // Type check and conversion
  const num = Number(value);
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }

  // Integer check
  if (integer && !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }

  // Range validation
  if (num < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName
    );
  }

  if (num > max) {
    throw new ValidationError(
      `${fieldName} must be at most ${max}`,
      fieldName
    );
  }

  return num;
}

/**
 * Validate boolean parameter
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether field is required
 * @returns {boolean} Validated boolean
 * @throws {ValidationError} If validation fails
 */
function validateBoolean(value, fieldName, options = {}) {
  const { required = true } = options;

  // Check if required
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return default
  if (!required && (value === null || value === undefined)) {
    return options.default || false;
  }

  // Type check and conversion
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }

  throw new ValidationError(`${fieldName} must be a boolean`, fieldName);
}

/**
 * Validate object parameter
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether field is required
 * @param {Array<string>} options.requiredKeys - Required keys in object
 * @returns {Object} Validated object
 * @throws {ValidationError} If validation fails
 */
function validateObject(value, fieldName, options = {}) {
  const { required = true, requiredKeys = [] } = options;

  // Check if required
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return default
  if (!required && (value === null || value === undefined)) {
    return options.default || {};
  }

  // Type check
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an object`, fieldName);
  }

  // Check required keys
  for (const key of requiredKeys) {
    if (!(key in value)) {
      throw new ValidationError(
        `${fieldName}.${key} is required`,
        `${fieldName}.${key}`
      );
    }
  }

  return value;
}

/**
 * Validate array parameter
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum array length
 * @param {number} options.maxLength - Maximum array length
 * @param {boolean} options.required - Whether field is required
 * @returns {Array} Validated array
 * @throws {ValidationError} If validation fails
 */
function validateArray(value, fieldName, options = {}) {
  const {
    minLength = 0,
    maxLength = Infinity,
    required = true
  } = options;

  // Check if required
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return default
  if (!required && (value === null || value === undefined)) {
    return options.default || [];
  }

  // Type check
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  // Length validation
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${minLength} items`,
      fieldName
    );
  }

  if (value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must have at most ${maxLength} items`,
      fieldName
    );
  }

  return value;
}

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Array} allowedValues - Array of allowed values
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Whether field is required
 * @returns {*} Validated value
 * @throws {ValidationError} If validation fails
 */
function validateEnum(value, fieldName, allowedValues, options = {}) {
  const { required = true } = options;

  // Check if required
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // If not required and empty, return default
  if (!required && (value === null || value === undefined)) {
    return options.default || allowedValues[0];
  }

  // Check if value is in allowed values
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }

  return value;
}

/**
 * Validate sheet name for SQL safety
 * @param {string} sheetName - Sheet name to validate
 * @returns {string} Validated sheet name
 * @throws {ValidationError} If validation fails
 */
function validateSheetName(sheetName) {
  return validateString(sheetName, 'sheetName', {
    minLength: 1,
    maxLength: 100,
    required: true
  });
}

/**
 * Validate row ID for database operations
 * @param {*} rowId - Row ID to validate
 * @returns {number} Validated row ID
 * @throws {ValidationError} If validation fails
 */
function validateRowId(rowId) {
  return validateNumber(rowId, 'rowId', {
    min: 1,
    integer: true,
    required: true
  });
}

/**
 * Validate pagination offset
 * @param {*} offset - Offset to validate
 * @returns {number} Validated offset
 * @throws {ValidationError} If validation fails
 */
function validateOffset(offset) {
  return validateNumber(offset, 'offset', {
    min: 0,
    integer: true,
    required: false,
    default: 0
  });
}

/**
 * Validate pagination limit
 * @param {*} limit - Limit to validate
 * @returns {number} Validated limit
 * @throws {ValidationError} If validation fails
 */
function validateLimit(limit) {
  // -1 means unlimited, so special case
  if (limit === -1) {
    return -1;
  }

  return validateNumber(limit, 'limit', {
    min: 1,
    max: 10000, // Maximum 10,000 rows per query
    integer: true,
    required: false,
    default: 100
  });
}

/**
 * Validate updates object for database operations
 * @param {*} updates - Updates object to validate
 * @returns {Object} Validated updates object
 * @throws {ValidationError} If validation fails
 */
function validateUpdates(updates) {
  const validated = validateObject(updates, 'updates', {
    required: true
  });

  // Ensure not empty
  if (Object.keys(validated).length === 0) {
    throw new ValidationError('updates object cannot be empty', 'updates');
  }

  // Validate each value is a string or number (for SQLite TEXT storage)
  Object.entries(validated).forEach(([key, value]) => {
    if (value !== null && value !== undefined &&
        typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new ValidationError(
        `updates.${key} must be a string, number, boolean, or null`,
        `updates.${key}`
      );
    }
  });

  return validated;
}

/**
 * Validate IPC handler parameters object
 * @param {*} params - Parameters object from IPC call
 * @param {string} handlerName - Name of the handler (for logging)
 * @returns {Object} Validated parameters object
 * @throws {ValidationError} If validation fails
 */
function validateIPCParams(params, handlerName) {
  try {
    const validated = validateObject(params, 'params', {
      required: false,
      default: {}
    });

    logger.logDebug(`[Validation] ${handlerName} params validated`, {
      keys: Object.keys(validated)
    });

    return validated;
  } catch (error) {
    logger.logError(`[Validation] ${handlerName} params validation failed`, error);
    throw error;
  }
}

module.exports = {
  // Validation error class
  ValidationError,

  // Basic validators
  validateString,
  validateNumber,
  validateBoolean,
  validateObject,
  validateArray,
  validateEnum,

  // Domain-specific validators
  validateSheetName,
  validateRowId,
  validateOffset,
  validateLimit,
  validateUpdates,
  validateIPCParams
};
