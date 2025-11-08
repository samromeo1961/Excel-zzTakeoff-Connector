/**
 * IPC Handlers for Excel file operations
 * Uses SheetJS (xlsx package) to read and write Excel files
 */

const { readExcelFile: read, writeExcelFile: write, createRowHash, extractUnits, applyZzTypeMappings, extractColumns, applyColumnMappings } = require('../excel/processor');
const { getUnitMappings, addDiscoveredUnits, getColumnMappings, addDiscoveredColumns, applySmartMatching } = require('../database/preferences-store');

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

    // Extract units from all sheets
    const allUnits = [];
    result.sheets.forEach(sheet => {
      if (!sheet.hidden && sheet.data && sheet.data.length > 0) {
        const units = extractUnits(sheet.data);
        allUnits.push(...units);
      }
    });

    // Get unique units
    const uniqueUnits = [...new Set(allUnits)];

    // Add discovered units to preferences
    if (uniqueUnits.length > 0) {
      addDiscoveredUnits(uniqueUnits);
    }

    // Get unit mappings and apply them
    const unitMappings = getUnitMappings();
    if (unitMappings.length > 0) {
      result.sheets = result.sheets.map(sheet => {
        if (!sheet.hidden && sheet.data && sheet.data.length > 0) {
          sheet.data = applyZzTypeMappings(sheet.data, unitMappings);
        }
        return sheet;
      });
    }

    // Extract columns from all sheets
    const allColumns = [];
    result.sheets.forEach(sheet => {
      if (!sheet.hidden && sheet.data && sheet.data.length > 0) {
        const columns = extractColumns(sheet.data);
        allColumns.push(...columns);
      }
    });

    // Get unique columns
    const uniqueColumns = [...new Set(allColumns)];

    // Add discovered columns to preferences
    if (uniqueColumns.length > 0) {
      addDiscoveredColumns(uniqueColumns);

      // Apply smart matching to automatically map columns
      applySmartMatching(uniqueColumns);
    }

    console.log('[Excel Handler] Units discovered:', uniqueUnits.length);
    console.log('[Excel Handler] Columns discovered:', uniqueColumns.length);

    return {
      success: true,
      data: result,
      discoveredUnits: uniqueUnits,
      discoveredColumns: uniqueColumns
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

module.exports = {
  readExcelFile,
  writeExcelFile,
  getMetadata,
  saveMetadata
};
