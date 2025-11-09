/**
 * Application-wide Constants
 *
 * This file contains all hardcoded values used throughout the application.
 * Centralizing constants improves maintainability and makes configuration changes easier.
 *
 * ORGANIZATION:
 * - File & Path Constants
 * - Database & Performance Constants
 * - Network & API Constants
 * - Validation Constants
 * - UI & Display Constants
 */

// ============================================================================
// FILE & PATH CONSTANTS
// ============================================================================

/**
 * Allowed file extensions for Excel files
 * Used in: path-validator.js, file dialogs
 */
const ALLOWED_FILE_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.csv'];

/**
 * Maximum file path length (Windows MAX_PATH limitation)
 * Used in: path-validator.js
 */
const MAX_FILE_PATH_LENGTH = 260;

/**
 * Maximum file size in MB for Excel file uploads
 * Used in: path-validator.js, excel.js IPC handlers
 * TESTING MODE: Increased from 50MB to 500MB for testing phase
 */
const MAX_FILE_SIZE_MB = 500;

/**
 * Maximum file size in bytes
 * Calculated from MAX_FILE_SIZE_MB
 */
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================================
// DATABASE & PERFORMANCE CONSTANTS
// ============================================================================

/**
 * Maximum number of rows to warn about performance issues
 * Files with more rows may experience slower processing
 * Used in: processor.js
 * TESTING MODE: Increased from 10,000 to 100,000
 */
const MAX_ROWS_WARNING = 100000;

/**
 * Maximum total rows across all sheets (hard limit)
 * Prevents memory exhaustion from extremely large files
 * Used in: processor.js
 * TESTING MODE: Increased from 100,000 to 1,000,000
 */
const MAX_TOTAL_ROWS = 1000000;

/**
 * Default pagination limit for database queries
 * Number of rows to fetch per page
 * Used in: excel-db.js, validators.js
 */
const DEFAULT_PAGINATION_LIMIT = 100;

/**
 * Maximum pagination limit for database queries
 * Prevents fetching too many rows at once
 * Used in: validators.js
 */
const MAX_PAGINATION_LIMIT = 10000;

/**
 * Maximum number of recent files to store
 * Used in: recents-store.js
 */
const MAX_RECENT_FILES = 100;

/**
 * Maximum length for sheet/table names in database
 * Used in: excel-db.js sanitizeTableName()
 */
const MAX_SHEET_NAME_LENGTH = 100;

/**
 * Maximum length for column names in database
 * Used in: excel-db.js sanitizeColumnName()
 */
const MAX_COLUMN_NAME_LENGTH = 50;

// ============================================================================
// NETWORK & API CONSTANTS
// ============================================================================

/**
 * Default HTTP request timeout in milliseconds
 * Used in: external-api.js makeHttpRequest()
 */
const DEFAULT_HTTP_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Maximum HTTP request timeout in milliseconds
 * Prevents indefinite hanging on slow connections
 * Used in: external-api.js
 */
const MAX_HTTP_TIMEOUT_MS = 60000; // 60 seconds

/**
 * zzTakeoff API request timeout in milliseconds
 * Used in: external-api.js for zzTakeoff-specific calls
 */
const ZZTAKEOFF_API_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Maximum number of HTTP redirects to follow
 * Prevents redirect loops
 * Used in: external-api.js axios config
 */
const MAX_HTTP_REDIRECTS = 5;

/**
 * Demo mode API delay in milliseconds
 * Simulates network latency for demo responses
 * Used in: external-api.js demo mode functions
 */
const DEMO_API_DELAY_MS = 500;

// ============================================================================
// LOGGING CONSTANTS
// ============================================================================

/**
 * Maximum log file size in bytes (5MB)
 * Used in: logger.js for error.log
 */
const MAX_ERROR_LOG_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Maximum log file size in bytes (10MB)
 * Used in: logger.js for combined.log
 */
const MAX_COMBINED_LOG_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Number of rotated log files to keep
 * Used in: logger.js
 */
const MAX_LOG_FILES = 5;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Maximum number of items to send to zzTakeoff in one request
 * Prevents oversized API requests
 */
const MAX_ITEMS_PER_SEND = 1000;

/**
 * Metadata column order threshold
 * Columns with order >= this value are considered metadata
 * Used in: preferences-store.js
 */
const METADATA_COLUMN_ORDER_THRESHOLD = 100;

/**
 * Hash substring length for row identification
 * Number of characters to use from SHA-256 hash
 * Used in: processor.js createRowHash()
 */
const ROW_HASH_LENGTH = 16;

// ============================================================================
// DEVELOPMENT CONSTANTS
// ============================================================================

/**
 * Vite development server port
 * Used in: main.js, vite.config.js
 * IMPORTANT: Update main.js if this changes
 */
const VITE_DEV_SERVER_PORT = 5185;

/**
 * Chrome remote debugging port
 * Used in: package.json dev:chrome script
 */
const CHROME_DEBUG_PORT = 9222;

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

/**
 * Allowed domains for HTTP requests (whitelist)
 * Prevents SSRF attacks by restricting external requests
 * Used in: external-api.js validateUrl()
 */
const ALLOWED_HTTP_DOMAINS = [
  'api.zztakeoff.com',
  'app.zztakeoff.com',
  'zztakeoff.com',
  'www.zztakeoff.com'
];

/**
 * Forbidden HTTP headers that clients cannot set
 * Prevents header injection attacks
 * Used in: external-api.js validateHeaders()
 */
const FORBIDDEN_HTTP_HEADERS = [
  'host',
  'connection',
  'content-length',
  'transfer-encoding'
];

/**
 * Private IP patterns to block (SSRF prevention)
 * Used in: external-api.js validateUrl()
 */
const PRIVATE_IP_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0 - 172.31.255.255
  /^169\.254\./,                  // Link-local
  '::1',                           // IPv6 localhost
  /^fd[0-9a-f]{2}:/i,             // IPv6 private
  /^fe80:/i                        // IPv6 link-local
];

// ============================================================================
// CACHE CONSTANTS
// ============================================================================

/**
 * Cache directory name in userData
 * Used in: excel-db.js
 */
const CACHE_DIR_NAME = 'excel-cache';

/**
 * Database file prefix for cached files
 * Used in: excel-db.js getDbPath()
 */
const DB_FILE_PREFIX = 'xlx-';

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // File & Path
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_PATH_LENGTH,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,

  // Database & Performance
  MAX_ROWS_WARNING,
  MAX_TOTAL_ROWS,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
  MAX_RECENT_FILES,
  MAX_SHEET_NAME_LENGTH,
  MAX_COLUMN_NAME_LENGTH,

  // Network & API
  DEFAULT_HTTP_TIMEOUT_MS,
  MAX_HTTP_TIMEOUT_MS,
  ZZTAKEOFF_API_TIMEOUT_MS,
  MAX_HTTP_REDIRECTS,
  DEMO_API_DELAY_MS,

  // Logging
  MAX_ERROR_LOG_SIZE_BYTES,
  MAX_COMBINED_LOG_SIZE_BYTES,
  MAX_LOG_FILES,

  // Validation
  MAX_ITEMS_PER_SEND,
  METADATA_COLUMN_ORDER_THRESHOLD,
  ROW_HASH_LENGTH,

  // Development
  VITE_DEV_SERVER_PORT,
  CHROME_DEBUG_PORT,

  // Security
  ALLOWED_HTTP_DOMAINS,
  FORBIDDEN_HTTP_HEADERS,
  PRIVATE_IP_PATTERNS,

  // Cache
  CACHE_DIR_NAME,
  DB_FILE_PREFIX
};
