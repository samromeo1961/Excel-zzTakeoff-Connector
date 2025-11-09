/**
 * IPC Handlers for Excel file operations
 * Uses SheetJS (xlsx package) to read and write Excel files
 *
 * SECURITY: All file paths are validated before processing to prevent:
 * - Path traversal attacks
 * - Access to unauthorized directories
 * - Processing of oversized files
 */

const path = require('path');
const { readExcelFile: read, writeExcelFile: write, createRowHash, extractUnits, applyZzTypeMappings, extractColumns, applyColumnMappings } = require('../excel/processor');
const { getUnitMappings, getCombinedUnitMappings, addDiscoveredUnits, clearDiscoveredUnits, getColumnMappings, addDiscoveredColumns, clearDiscoveredColumns, applySmartMatching } = require('../database/preferences-store');
const excelDB = require('../database/excel-db');
const { validateFilePath, validateFileSize } = require('../utils/path-validator');
const logger = require('../utils/logger');
const { wrapHandler, createErrorResponse } = require('../utils/error-handler');
const {
  validateIPCParams,
  validateSheetName,
  validateRowId,
  validateOffset,
  validateLimit,
  validateUpdates,
  validateObject
} = require('../utils/validators');

/**
 * Read an Excel file and return its data
 *
 * CACHING: This function now checks for cached SQLite database.
 * - Cache HIT: Fast load from SQLite (~50-200ms)
 * - Cache MISS: Full Excel parse + SQLite creation (~2-5 seconds)
 *
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
async function readExcelFile(event, filePath) {
  try {
    logger.logInfo('[Excel Handler] Reading file', { filePath });

    // SECURITY: Validate file path before processing
    const validatedPath = validateFilePath(filePath, {
      mustExist: true,
      checkExtension: true
    });

    // SECURITY: Check file size before reading
    validateFileSize(validatedPath, 50); // 50 MB limit

    // CACHING: Check if we have a valid cached database
    const cacheValid = await excelDB.isCacheValid(validatedPath);

    if (cacheValid) {
      // ========================================
      // CACHE HIT - Fast path (50-200ms)
      // ========================================
      logger.logInfo('[Excel Handler] ✅ CACHE HIT - Using cached database', { filePath: validatedPath });

      const dbInfo = await excelDB.loadFromCache(validatedPath);

      // Return metadata from cache
      const sheetsMetadata = dbInfo.sheets.map(s => ({
        name: s.name,
        tableName: s.tableName,
        rowCount: s.rowCount,
        columns: s.columns,
        sanitizedColumns: s.sanitizedColumns
      }));

      // CRITICAL: Apply smart column matching even on cache hits
      // This updates preferences to map this file's columns to the preferred columns
      // Without this, the Excel grid won't display data because column mappings won't match
      const firstSheet = sheetsMetadata.find(s => s.rowCount > 0);
      if (firstSheet && firstSheet.columns && firstSheet.columns.length > 0) {
        logger.logDebug('[Excel Handler] Applying smart column matching on cache hit', {
          columnCount: firstSheet.columns.length
        });
        applySmartMatching(firstSheet.columns);
      }

      logger.logInfo('[Excel Handler] Cache load complete', { sheetCount: sheetsMetadata.length });

      return {
        success: true,
        filePath: validatedPath,
        fileName: path.basename(validatedPath),
        sheets: sheetsMetadata,
        cached: true, // Flag to indicate this was a cache hit
        data: {
          fileName: path.basename(validatedPath),
          filePath: validatedPath,
          sheets: sheetsMetadata
        }
      };
    }

    // ========================================
    // CACHE MISS - Full load required (2-5 seconds)
    // ========================================
    logger.logInfo('[Excel Handler] ❌ CACHE MISS - Full Excel load required', { filePath: validatedPath });

    const result = await read(validatedPath);
    logger.logInfo('[Excel Handler] File read successfully', {
      sheetCount: result.sheets.length,
      rowCount: result.sheets[0]?.data.length || 0
    });

    // Extract units from FIRST SHEET ONLY
    const allUnits = [];
    const firstSheet = result.sheets.find(sheet => !sheet.hidden);

    // Get column mappings to find the correct unit column
    const columnMappingsData = getColumnMappings();

    if (firstSheet && firstSheet.data && firstSheet.data.length > 0) {
      const units = extractUnits(firstSheet.data, columnMappingsData);
      allUnits.push(...units);
    }

    // Get unique units
    const uniqueUnits = [...new Set(allUnits)];

    // Get combined unit mappings (file-specific + global)
    const unitMappings = getCombinedUnitMappings(filePath);

    // Clear previous discovered units and add new ones from current file
    // Only add units that don't have mappings (either global or file-specific)
    clearDiscoveredUnits();
    if (uniqueUnits.length > 0) {
      const mappedUnits = new Set(unitMappings.map(m => m.unit));
      const unmappedUnits = uniqueUnits.filter(unit => !mappedUnits.has(unit));
      if (unmappedUnits.length > 0) {
        addDiscoveredUnits(unmappedUnits);
      }
    }

    // Apply unit mappings to data
    if (unitMappings.length > 0) {
      result.sheets = result.sheets.map(sheet => {
        if (!sheet.hidden && sheet.data && sheet.data.length > 0) {
          sheet.data = applyZzTypeMappings(sheet.data, unitMappings);
        }
        return sheet;
      });
    }

    // Extract columns from FIRST SHEET ONLY (reuse firstSheet from above)
    const allColumns = [];
    if (firstSheet && firstSheet.data && firstSheet.data.length > 0) {
      const columns = extractColumns(firstSheet.data);
      allColumns.push(...columns);
    }

    // Get unique columns
    const uniqueColumns = [...new Set(allColumns)];

    // Clear previous discovered columns and add new ones from current file
    clearDiscoveredColumns();
    if (uniqueColumns.length > 0) {
      addDiscoveredColumns(uniqueColumns);

      // Apply smart matching to automatically map columns
      applySmartMatching(uniqueColumns);
    }

    logger.logInfo('[Excel Handler] Units discovered', { unitCount: uniqueUnits.length });
    logger.logInfo('[Excel Handler] Columns discovered', { columnCount: uniqueColumns.length });

    // Load data into SQLite for performance
    logger.logInfo('[Excel Handler] Loading data into SQLite', { filePath: validatedPath });
    const dbInfo = await excelDB.loadExcelToDatabase(validatedPath, result.sheets);
    logger.logInfo('[Excel Handler] SQLite database ready', { sheetCount: dbInfo.sheets.length });

    // Return metadata only (not all data)
    const sheetsMetadata = dbInfo.sheets.map(s => ({
      name: s.name,
      tableName: s.tableName,
      rowCount: s.rowCount,
      columns: s.columns,
      sanitizedColumns: s.sanitizedColumns
    }));

    return {
      success: true,
      filePath: validatedPath,
      fileName: path.basename(validatedPath),
      sheets: sheetsMetadata,
      cached: false, // Flag to indicate this was a cache miss (full load)
      discoveredUnits: uniqueUnits,
      discoveredColumns: uniqueColumns,
      data: {
        fileName: path.basename(validatedPath),
        filePath: validatedPath,
        sheets: sheetsMetadata
      }
    };
  } catch (error) {
    logger.logError('[Excel Handler] Error reading file', error);
    return createErrorResponse(error, 'readExcelFile');
  }
}

/**
 * Write data to an Excel file
 * @param {Event} event - IPC event
 * @param {Object} params - Write parameters
 * @param {string} params.filePath - Path to save Excel file
 * @param {Object} params.data - Data to write (workbook structure)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function writeExcelFile(event, params) {
  try {
    const validated = validateIPCParams(params, 'writeExcelFile');
    const { filePath, data } = validated;

    logger.logInfo('[Excel Handler] Writing file', { filePath });

    // SECURITY: Validate file path before writing
    const validatedPath = validateFilePath(filePath, {
      mustExist: false, // File may not exist yet (new file)
      checkExtension: true
    });

    await write(validatedPath, data);
    logger.logInfo('[Excel Handler] File written successfully', { filePath: validatedPath });
    return { success: true };
  } catch (error) {
    logger.logError('[Excel Handler] Error writing file', error);
    return createErrorResponse(error, 'writeExcelFile');
  }
}

/**
 * Get metadata from hidden sheet in Excel file
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean, metadata?: any, message?: string}>}
 */
async function getMetadata(event, filePath) {
  try {
    logger.logInfo('[Excel Handler] Getting metadata', { filePath });

    // SECURITY: Validate file path
    const validatedPath = validateFilePath(filePath, {
      mustExist: true,
      checkExtension: true
    });

    const result = await read(validatedPath);

    // Look for hidden metadata sheet
    const metadataSheet = result.sheets.find(sheet => sheet.name === '_zzTakeoffMetadata');

    if (!metadataSheet) {
      logger.logDebug('[Excel Handler] No metadata sheet found', { filePath: validatedPath });
      return { success: true, metadata: {} };
    }

    // Convert metadata sheet data to object
    const metadata = {};
    metadataSheet.data.forEach(row => {
      if (row.rowHash) {
        metadata[row.rowHash] = {
          zzType: row.zzType,
          markupPercent: row.markupPercent,
          lastSent: row.lastSent,
          sentCount: row.sentCount || 0
        };
      }
    });

    logger.logInfo('[Excel Handler] Metadata loaded', { entryCount: Object.keys(metadata).length });
    return { success: true, metadata };
  } catch (error) {
    logger.logError('[Excel Handler] Error getting metadata', error);
    return createErrorResponse(error, 'getMetadata');
  }
}

/**
 * Save metadata to hidden sheet in Excel file
 * @param {Event} event - IPC event
 * @param {Object} params - Save parameters
 * @param {string} params.filePath - Path to Excel file
 * @param {Object} params.metadata - Metadata object to save
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function saveMetadata(event, params) {
  try {
    const validated = validateIPCParams(params, 'saveMetadata');
    const { filePath, metadata } = validated;

    logger.logInfo('[Excel Handler] Saving metadata', { filePath });

    // SECURITY: Validate file path
    const validatedPath = validateFilePath(filePath, {
      mustExist: true,
      checkExtension: true
    });

    // Validate metadata is an object
    validateObject(metadata, 'metadata', { required: true });

    // Read current file
    const result = await read(validatedPath);

    // Remove existing metadata sheet if present
    const sheetIndex = result.sheets.findIndex(sheet => sheet.name === '_zzTakeoffMetadata');
    if (sheetIndex !== -1) {
      result.sheets.splice(sheetIndex, 1);
    }

    // Convert metadata object to sheet data
    const metadataData = Object.entries(metadata).map(([rowHash, data]) => ({
      rowHash,
      zzType: data.zzType,
      markupPercent: data.markupPercent,
      lastSent: data.lastSent,
      sentCount: data.sentCount || 0
    }));

    // Add metadata sheet (hidden)
    result.sheets.push({
      name: '_zzTakeoffMetadata',
      data: metadataData,
      hidden: true
    });

    // Write back to file
    await write(validatedPath, result);
    logger.logInfo('[Excel Handler] Metadata saved', { entryCount: metadataData.length });
    return { success: true };
  } catch (error) {
    logger.logError('[Excel Handler] Error saving metadata', error);
    return createErrorResponse(error, 'saveMetadata');
  }
}

/**
 * Query sheet data with pagination
 * @param {Event} event - IPC event
 * @param {Object} params - Query parameters
 * @param {string} params.filePath - Path to Excel file
 * @param {string} params.sheetName - Name of the sheet
 * @param {number} params.offset - Offset for pagination
 * @param {number} params.limit - Limit for pagination
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
async function querySheetData(event, params) {
  try {
    const validated = validateIPCParams(params, 'querySheetData');
    const { filePath, sheetName, offset = 0, limit = 100 } = validated;

    // Validate each parameter
    const validatedPath = validateFilePath(filePath, {
      mustExist: false, // Database file might be in temp directory
      checkExtension: true
    });
    const validatedSheetName = validateSheetName(sheetName);
    const validatedOffset = validateOffset(offset);
    const validatedLimit = validateLimit(limit);

    logger.logInfo('[Excel Handler] Querying sheet', {
      sheetName: validatedSheetName,
      offset: validatedOffset,
      limit: validatedLimit
    });

    const result = await excelDB.querySheet(validatedPath, validatedSheetName, {
      offset: validatedOffset,
      limit: validatedLimit
    });

    logger.logDebug('[Excel Handler] Query complete', { rowsReturned: result.data.length });

    return {
      success: true,
      ...result
    };
  } catch (error) {
    logger.logError('[Excel Handler] Error querying sheet', error);
    return createErrorResponse(error, 'querySheetData');
  }
}

/**
 * Update a row in the sheet
 * @param {Event} event - IPC event
 * @param {Object} params - Update parameters
 * @param {string} params.filePath - Path to Excel file
 * @param {string} params.sheetName - Name of the sheet
 * @param {number} params.rowId - Row ID
 * @param {Object} params.updates - Column-value pairs to update
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function updateSheetRow(event, params) {
  try {
    const validated = validateIPCParams(params, 'updateSheetRow');
    const { filePath, sheetName, rowId, updates } = validated;

    // Validate each parameter
    const validatedPath = validateFilePath(filePath, {
      mustExist: false,
      checkExtension: true
    });
    const validatedSheetName = validateSheetName(sheetName);
    const validatedRowId = validateRowId(rowId);
    const validatedUpdates = validateUpdates(updates);

    logger.logInfo('[Excel Handler] Updating row', {
      sheetName: validatedSheetName,
      rowId: validatedRowId,
      updateFields: Object.keys(validatedUpdates)
    });

    const success = await excelDB.updateRow(
      validatedPath,
      validatedSheetName,
      validatedRowId,
      validatedUpdates
    );

    logger.logDebug('[Excel Handler] Update result', { success });

    return {
      success,
      message: success ? 'Row updated successfully' : 'Row not found'
    };
  } catch (error) {
    logger.logError('[Excel Handler] Error updating row', error);
    return createErrorResponse(error, 'updateSheetRow');
  }
}

/**
 * Get list of all sheets
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean, sheets?: any, message?: string}>}
 */
async function getSheetList(event, filePath) {
  try {
    logger.logDebug('[Excel Handler] Getting sheet list', { filePath });

    // SECURITY: Validate file path
    const validatedPath = validateFilePath(filePath, {
      mustExist: false,
      checkExtension: true
    });

    const sheets = await excelDB.getSheetList(validatedPath);

    logger.logDebug('[Excel Handler] Sheet list retrieved', { sheetCount: sheets.length });

    return {
      success: true,
      sheets
    };
  } catch (error) {
    logger.logError('[Excel Handler] Error getting sheet list', error);
    return createErrorResponse(error, 'getSheetList');
  }
}

/**
 * Close database for a file
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean}>}
 */
async function closeFile(event, filePath) {
  try {
    logger.logInfo('[Excel Handler] Closing database', { filePath });

    // SECURITY: Validate file path
    const validatedPath = validateFilePath(filePath, {
      mustExist: false,
      checkExtension: true
    });

    excelDB.closeDatabase(validatedPath);

    logger.logDebug('[Excel Handler] Database closed', { filePath: validatedPath });

    return { success: true };
  } catch (error) {
    logger.logError('[Excel Handler] Error closing file', error);
    return createErrorResponse(error, 'closeFile');
  }
}

/**
 * Re-scan file for discovered units (clears old and adds new from current file)
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean, discoveredUnits?: any, message?: string}>}
 */
async function rescanFileForUnits(event, filePath) {
  try {
    logger.logInfo('[Excel Handler] Re-scanning file for units', { filePath });

    // SECURITY: Validate file path
    const validatedPath = validateFilePath(filePath, {
      mustExist: true,
      checkExtension: true
    });

    // Read the file again
    const result = await read(validatedPath);

    // Extract units from FIRST SHEET ONLY
    const allUnits = [];
    const firstSheet = result.sheets.find(sheet => !sheet.hidden);

    // Get column mappings to find the correct unit column
    const columnMappingsData = getColumnMappings();

    if (firstSheet && firstSheet.data && firstSheet.data.length > 0) {
      const units = extractUnits(firstSheet.data, columnMappingsData);
      allUnits.push(...units);
    }

    // Get unique units
    const uniqueUnits = [...new Set(allUnits)];

    // Get combined unit mappings (file-specific + global)
    const unitMappings = getCombinedUnitMappings(filePath);

    // Clear previous discovered units and add new ones from current file
    clearDiscoveredUnits();
    if (uniqueUnits.length > 0) {
      const mappedUnits = new Set(unitMappings.map(m => m.unit));
      const unmappedUnits = uniqueUnits.filter(unit => !mappedUnits.has(unit));
      if (unmappedUnits.length > 0) {
        addDiscoveredUnits(unmappedUnits);
      }
    }

    logger.logInfo('[Excel Handler] Re-scan complete', {
      totalUnits: uniqueUnits.length,
      unmappedUnits: uniqueUnits.filter(unit => !unitMappings.some(m => m.unit === unit)).length
    });

    return {
      success: true,
      discoveredUnits: uniqueUnits
    };
  } catch (error) {
    logger.logError('[Excel Handler] Error re-scanning file for units', error);
    return createErrorResponse(error, 'rescanFileForUnits');
  }
}

module.exports = {
  readExcelFile,
  writeExcelFile,
  getMetadata,
  saveMetadata,
  querySheetData,
  updateSheetRow,
  getSheetList,
  closeFile,
  rescanFileForUnits
};
