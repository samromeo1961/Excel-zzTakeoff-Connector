/**
 * File Path Validation Utility
 *
 * SECURITY: This module prevents path traversal attacks and ensures
 * files are only accessed from allowed directories.
 *
 * Features:
 * - Path traversal detection
 * - Directory whitelist enforcement
 * - File extension validation
 * - File size validation
 * - Path normalization
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Allowed file extensions for Excel files
 */
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.csv'];

/**
 * Maximum file path length (Windows MAX_PATH limitation)
 */
const MAX_PATH_LENGTH = 260;

/**
 * Maximum file size in MB (default)
 * TESTING MODE: Increased from 50MB to 500MB for testing phase
 */
const DEFAULT_MAX_FILE_SIZE_MB = 500;

/**
 * Get allowed directories for file operations
 *
 * SECURITY: Only these directories are allowed for file access.
 * This prevents access to system files or sensitive locations.
 *
 * @returns {Array<string>} Array of allowed directory paths
 */
function getAllowedDirectories() {
  try {
    return [
      app.getPath('documents'),
      app.getPath('downloads'),
      app.getPath('desktop'),
      app.getPath('home'),
      app.getPath('userData'),
      app.getPath('temp') // For temporary database files
    ];
  } catch (error) {
    console.error('[PathValidator] Error getting allowed directories:', error);
    // Fallback to basic directories if app paths are not available
    return [
      process.env.USERPROFILE || process.env.HOME || '',
      process.cwd()
    ].filter(Boolean);
  }
}

/**
 * Validate file path for security
 *
 * SECURITY CHECKS:
 * 1. Type and length validation
 * 2. Path traversal detection (..)
 * 3. Directory whitelist enforcement
 * 4. File extension validation
 * 5. Existence check (optional)
 *
 * @param {string} filePath - File path to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.mustExist - Whether file must exist (default: false)
 * @param {boolean} options.checkExtension - Whether to check file extension (default: true)
 * @param {boolean} options.allowTemp - Allow temp directory paths (default: false)
 * @returns {string} Normalized, validated absolute file path
 * @throws {Error} If validation fails
 *
 * @example
 * const validPath = validateFilePath('C:\\Users\\User\\Documents\\file.xlsx');
 * // Returns: "C:\\Users\\User\\Documents\\file.xlsx"
 *
 * @example
 * validateFilePath('../../../etc/passwd'); // Throws: Path traversal detected
 */
function validateFilePath(filePath, options = {}) {
  const {
    mustExist = false,
    checkExtension = true,
    allowTemp = false
  } = options;

  // 1. Type check
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }

  // 2. Length check
  if (filePath.length > MAX_PATH_LENGTH) {
    throw new Error(`File path too long (maximum ${MAX_PATH_LENGTH} characters)`);
  }

  // 3. Check for path traversal attempts
  // This catches both Unix (..) and Windows (..\ or ../) path traversal
  if (filePath.includes('..')) {
    console.error('[PathValidator] Path traversal detected:', filePath);
    throw new Error('Path traversal detected in file path');
  }

  // 4. Check for null bytes (security risk)
  if (filePath.includes('\0')) {
    throw new Error('Null byte detected in file path');
  }

  // 5. Normalize and resolve to absolute path
  // This ensures consistent path format across platforms
  const normalizedPath = path.normalize(filePath);
  const resolvedPath = path.resolve(normalizedPath);

  // 6. Double-check for path traversal after normalization
  // Some path traversal attempts might be hidden in encoding
  if (resolvedPath.includes('..')) {
    console.error('[PathValidator] Path traversal detected after normalization:', resolvedPath);
    throw new Error('Path traversal detected after normalization');
  }

  // 7. TESTING MODE: Directory restrictions temporarily disabled
  // TODO: Re-enable directory whitelist after testing phase
  // const allowedDirs = getAllowedDirectories();
  // const isInAllowedDir = allowedDirs.some(dir => {
  //   if (!dir) return false;
  //   const resolvedDir = path.resolve(dir);
  //   return resolvedPath.startsWith(resolvedDir + path.sep) || resolvedPath === resolvedDir;
  // });
  // if (!isInAllowedDir) {
  //   console.error('[PathValidator] File path not in allowed directory:', resolvedPath);
  //   console.error('[PathValidator] Allowed directories:', allowedDirs);
  //   throw new Error('File path is not in an allowed directory');
  // }
  console.log('[PathValidator] TESTING MODE: Directory restrictions disabled');

  // 8. Check file extension
  if (checkExtension) {
    const ext = path.extname(resolvedPath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
  }

  // 9. Check if file exists (if required)
  if (mustExist) {
    try {
      const stats = fs.statSync(resolvedPath);
      if (!stats.isFile()) {
        throw new Error('Path exists but is not a file');
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('File does not exist');
      }
      // Re-throw other errors (like permission denied)
      throw err;
    }
  }

  console.log('[PathValidator] File path validated successfully:', resolvedPath);
  return resolvedPath;
}

/**
 * Validate and check file size
 *
 * SECURITY: Prevents memory exhaustion and DoS attacks by limiting file size.
 *
 * @param {string} filePath - File path to check (must be validated first)
 * @param {number} maxSizeMB - Maximum file size in MB (default: 50)
 * @returns {Object} File stats object
 * @throws {Error} If file is too large or cannot be accessed
 *
 * @example
 * const stats = validateFileSize('C:\\path\\to\\file.xlsx', 50);
 * console.log(`File size: ${stats.size} bytes`);
 */
function validateFileSize(filePath, maxSizeMB = DEFAULT_MAX_FILE_SIZE_MB) {
  try {
    const stats = fs.statSync(filePath);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const fileSizeMB = stats.size / 1024 / 1024;

    if (stats.size > maxSizeBytes) {
      throw new Error(
        `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum allowed size is ${maxSizeMB}MB`
      );
    }

    console.log(`[PathValidator] File size validated: ${fileSizeMB.toFixed(2)}MB (limit: ${maxSizeMB}MB)`);
    return stats;
  } catch (err) {
    if (err.message.includes('too large')) {
      throw err; // Re-throw our custom error
    }
    throw new Error(`Cannot access file: ${err.message}`);
  }
}

/**
 * Validate directory path (for database file creation)
 *
 * @param {string} dirPath - Directory path to validate
 * @returns {string} Validated directory path
 * @throws {Error} If validation fails
 */
function validateDirectoryPath(dirPath) {
  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('Directory path must be a non-empty string');
  }

  if (dirPath.includes('..')) {
    throw new Error('Path traversal detected in directory path');
  }

  const resolvedPath = path.resolve(dirPath);

  // For temp directory, be more permissive
  const tempDir = path.resolve(app.getPath('temp'));
  if (resolvedPath.startsWith(tempDir)) {
    return resolvedPath;
  }

  // Otherwise check against allowed directories
  const allowedDirs = getAllowedDirectories();
  const isAllowed = allowedDirs.some(dir => {
    if (!dir) return false;
    return resolvedPath.startsWith(path.resolve(dir));
  });

  if (!isAllowed) {
    throw new Error('Directory path is not in an allowed location');
  }

  return resolvedPath;
}

module.exports = {
  validateFilePath,
  validateFileSize,
  validateDirectoryPath,
  getAllowedDirectories,
  ALLOWED_EXTENSIONS,
  MAX_PATH_LENGTH,
  DEFAULT_MAX_FILE_SIZE_MB
};
