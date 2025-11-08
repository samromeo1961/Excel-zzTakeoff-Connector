/**
 * IPC Handlers for Excel file operations
 * Uses SheetJS (xlsx package) to read and write Excel files
 */

const path = require('path');
const { readExcelFile: read, writeExcelFile: write, createRowHash, extractUnits, applyZzTypeMappings, extractColumns, applyColumnMappings } = require('../excel/processor');
const { getUnitMappings, getCombinedUnitMappings, addDiscoveredUnits, clearDiscoveredUnits, getColumnMappings, addDiscoveredColumns, clearDiscoveredColumns, applySmartMatching } = require('../database/preferences-store');
const excelDB = require('../database/excel-db');

/**
 * Read an Excel file and return its data
 * @param {Event} event - IPC event
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
async function readExcelFile(event, filePath) {
  try {
    console.log('[Excel Handler] Reading file:', filePath);
    const result = await read(filePath);
    console.log('[Excel Handler] File read successfully:', {
      sheets: result.sheets.length,
      rows: result.sheets[0]?.data.length || 0
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

    console.log('[Excel Handler] Units discovered:', uniqueUnits.length);
    console.log('[Excel Handler] Columns discovered:', uniqueColumns.length);

    // Load data into SQLite for performance
    console.log('[Excel Handler] Loading data into SQLite...');
    const dbInfo = await excelDB.loadExcelToDatabase(filePath, result.sheets);
    console.log('[Excel Handler] SQLite database ready:', dbInfo.sheets.length, 'sheets');

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
      filePath: filePath,
      fileName: path.basename(filePath),
      sheets: sheetsMetadata,
      discoveredUnits: uniqueUnits,
      discoveredColumns: uniqueColumns,
      data: {
        fileName: path.basename(filePath),
        filePath: filePath,
        sheets: sheetsMetadata
      }
    };
  } catch (error) {
    console.error('[Excel Handler] Error reading file:', error);
    return { success: false, message: error.message };
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
    const { filePath, data } = params;
    console.log('[Excel Handler] Writing file:', filePath);
    await write(filePath, data);
    console.log('[Excel Handler] File written successfully');
    return { success: true };
  } catch (error) {
    console.error('[Excel Handler] Error writing file:', error);
    return { success: false, message: error.message };
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
    console.log('[Excel Handler] Getting metadata from:', filePath);
    const result = await read(filePath);

    // Look for hidden metadata sheet
    const metadataSheet = result.sheets.find(sheet => sheet.name === '_zzTakeoffMetadata');

    if (!metadataSheet) {
      console.log('[Excel Handler] No metadata sheet found');
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

    console.log('[Excel Handler] Metadata loaded:', Object.keys(metadata).length, 'entries');
    return { success: true, metadata };
  } catch (error) {
    console.error('[Excel Handler] Error getting metadata:', error);
    return { success: false, message: error.message };
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
    const { filePath, metadata } = params;
    console.log('[Excel Handler] Saving metadata to:', filePath);

    // Read current file
    const result = await read(filePath);

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
    await write(filePath, result);
    console.log('[Excel Handler] Metadata saved:', metadataData.length, 'entries');
    return { success: true };
  } catch (error) {
    console.error('[Excel Handler] Error saving metadata:', error);
    return { success: false, message: error.message };
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
    const { filePath, sheetName, offset = 0, limit = 100 } = params;
    console.log('[Excel Handler] Querying sheet:', sheetName, 'offset:', offset, 'limit:', limit);

    const result = await excelDB.querySheet(filePath, sheetName, { offset, limit });

    console.log('[Excel Handler] Query complete:', result.data.length, 'rows returned');

    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error('[Excel Handler] Error querying sheet:', error);
    return { success: false, message: error.message };
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
    const { filePath, sheetName, rowId, updates } = params;
    console.log('[Excel Handler] Updating row:', rowId, 'in sheet:', sheetName);

    const success = await excelDB.updateRow(filePath, sheetName, rowId, updates);

    return {
      success,
      message: success ? 'Row updated successfully' : 'Row not found'
    };
  } catch (error) {
    console.error('[Excel Handler] Error updating row:', error);
    return { success: false, message: error.message };
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
    const sheets = await excelDB.getSheetList(filePath);
    return {
      success: true,
      sheets
    };
  } catch (error) {
    console.error('[Excel Handler] Error getting sheet list:', error);
    return { success: false, message: error.message };
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
    console.log('[Excel Handler] Closing database for file:', filePath);
    excelDB.closeDatabase(filePath);
    return { success: true };
  } catch (error) {
    console.error('[Excel Handler] Error closing file:', error);
    return { success: false, message: error.message };
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
    console.log('[Excel Handler] Re-scanning file for units:', filePath);

    // Read the file again
    const result = await read(filePath);

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

    console.log('[Excel Handler] Re-scan complete. Units discovered:', uniqueUnits.length);

    return {
      success: true,
      discoveredUnits: uniqueUnits
    };
  } catch (error) {
    console.error('[Excel Handler] Error re-scanning file for units:', error);
    return { success: false, message: error.message };
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
