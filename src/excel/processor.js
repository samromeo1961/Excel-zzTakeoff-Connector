/**
 * Excel file processor using SheetJS (xlsx package)
 * Handles reading, writing, and hash-based row identification
 */

const XLSX = require('xlsx');
const crypto = require('crypto');

/**
 * Create a hash fingerprint from row content
 * This allows us to track rows even if they're sorted or moved
 * @param {Object} row - Row object
 * @returns {string} - Hash string
 */
function createRowHash(row) {
  // Concatenate all cell values
  const content = Object.values(row)
    .map(val => String(val ?? ''))
    .join('|');

  // Create SHA-256 hash
  return crypto.createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity
}

/**
 * Read an Excel file and return structured data
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Object>} - { sheets: [{ name, data, hidden }], metadata }
 */
async function readExcelFile(filePath) {
  try {
    console.log('[Excel Processor] Reading file:', filePath);

    // Read workbook
    const workbook = XLSX.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    console.log('[Excel Processor] Workbook loaded, sheet count:', workbook.SheetNames.length);

    // Process each sheet
    const sheets = workbook.SheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Return array of arrays
        defval: null, // Use null for empty cells
        blankrows: false // Skip blank rows
      });

      console.log('[Excel Processor] Sheet:', sheetName, 'Rows:', data.length);

      // Extract header row (first row)
      const headers = data[0] || [];

      // Convert data rows to objects with hash
      const rows = data.slice(1).map((row, index) => {
        const rowObject = {};
        headers.forEach((header, colIndex) => {
          rowObject[header || `Column${colIndex + 1}`] = row[colIndex] ?? null;
        });

        // Add row metadata
        return {
          _rowIndex: index,
          _rowHash: createRowHash(rowObject),
          ...rowObject
        };
      });

      // Check if sheet is hidden
      const isHidden = workbook.Workbook?.Sheets?.[workbook.SheetNames.indexOf(sheetName)]?.Hidden === 1;

      return {
        name: sheetName,
        headers,
        data: rows,
        hidden: isHidden,
        _worksheet: worksheet // Keep reference for writing
      };
    });

    console.log('[Excel Processor] File processed successfully');

    return {
      sheets,
      filePath,
      fileName: filePath.split(/[\\/]/).pop()
    };
  } catch (error) {
    console.error('[Excel Processor] Error reading file:', error);
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
}

/**
 * Write structured data to an Excel file
 * @param {string} filePath - Path to save Excel file
 * @param {Object} data - Data structure from readExcelFile
 * @returns {Promise<void>}
 */
async function writeExcelFile(filePath, data) {
  try {
    console.log('[Excel Processor] Writing file:', filePath);

    // Create new workbook
    const workbook = XLSX.utils.book_new();

    // Add each sheet
    data.sheets.forEach(sheet => {
      console.log('[Excel Processor] Writing sheet:', sheet.name);

      // Convert data back to array of arrays
      const headers = sheet.headers || Object.keys(sheet.data[0] || {}).filter(k => !k.startsWith('_'));
      const rows = sheet.data.map(row => {
        return headers.map(header => row[header] ?? null);
      });

      // Add headers as first row
      const sheetData = [headers, ...rows];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Add sheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);

      // Set sheet visibility
      if (sheet.hidden) {
        if (!workbook.Workbook) workbook.Workbook = {};
        if (!workbook.Workbook.Sheets) workbook.Workbook.Sheets = [];

        const sheetIndex = workbook.SheetNames.indexOf(sheet.name);
        workbook.Workbook.Sheets[sheetIndex] = { Hidden: 1 };
      }
    });

    // Write file
    XLSX.writeFile(workbook, filePath, {
      bookType: 'xlsx',
      type: 'buffer'
    });

    console.log('[Excel Processor] File written successfully');
  } catch (error) {
    console.error('[Excel Processor] Error writing file:', error);
    throw new Error(`Failed to write Excel file: ${error.message}`);
  }
}

/**
 * Extract unique units from Excel data
 * @param {Array<Object>} data - Array of row objects
 * @param {Object} columnMappings - Optional column mappings object
 * @returns {Array<string>} - Array of unique unit names
 */
function extractUnits(data, columnMappings = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const units = new Set();

  // Try to get the mapped Excel column for 'units' from column mappings
  let mappedUnitColumn = null;
  if (columnMappings && columnMappings.preferredColumns) {
    const unitsMapping = columnMappings.preferredColumns.find(col => col.id === 'units');
    if (unitsMapping && unitsMapping.excelColumn) {
      mappedUnitColumn = unitsMapping.excelColumn;
    }
  }

  data.forEach(row => {
    let unit = null;

    // First, try the mapped column if available
    if (mappedUnitColumn && row[mappedUnitColumn]) {
      unit = row[mappedUnitColumn];
    } else {
      // Fall back to trying various common column names for units
      unit = row.unit || row.Unit || row.UNIT || row.Units || row.units ||
             row.UOM || row.uom || row.UM || row.um ||
             row.PerCode || row.percode || row.Percode || row.PERCODE ||
             row.PerCodes || row.percodes || row.Percodes || row.PERCODES;
    }

    if (unit && typeof unit === 'string' && unit.trim()) {
      units.add(unit.trim());
    }
  });

  return Array.from(units).sort();
}

/**
 * Apply zzType mappings to data (fill missing only)
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<Object>} mappings - Array of {unit, zzType, active} mappings
 * @returns {Array<Object>} - Data with zzType applied
 */
function applyZzTypeMappings(data, mappings) {
  if (!Array.isArray(data) || !Array.isArray(mappings)) {
    return data;
  }

  // Filter for active mappings only
  const activeMappings = mappings.filter(m => m.active === true);

  if (activeMappings.length === 0) {
    return data;
  }

  // Create a map for quick lookup
  const mappingMap = new Map(activeMappings.map(m => [m.unit, m.zzType]));

  // Apply mappings to rows
  return data.map(row => {
    // Skip if row already has a zzType set
    if (row._zzType || row.zzType || row.zztype || row.ZZTYPE) {
      return row;
    }

    // Get unit from row (try various column names)
    const unit = row.unit || row.Unit || row.UNIT || row.Units || row.units || row.UOM || row.uom;

    if (unit && typeof unit === 'string' && mappingMap.has(unit.trim())) {
      // Apply the mapped zzType
      return {
        ...row,
        _zzType: mappingMap.get(unit.trim())
      };
    }

    return row;
  });
}

/**
 * Extract unique column names from Excel data
 * @param {Array<Object>} data - Array of row objects
 * @returns {Array<string>} - Array of unique column names (excluding metadata columns starting with _)
 */
function extractColumns(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Get all column names from all rows, excluding metadata columns
  const columnSet = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_')) {
        columnSet.add(key);
      }
    });
  });

  return Array.from(columnSet).sort();
}

/**
 * Apply column mappings to filter and reorder data
 * Returns only the mapped columns in the specified order
 * @param {Array<Object>} data - Array of row objects
 * @param {Object} columnMappings - Column mappings from preferences { preferredColumns: [...] }
 * @returns {Object} - { filteredData: Array<Object>, columnDefs: Array<Object> }
 */
function applyColumnMappings(data, columnMappings) {
  if (!Array.isArray(data) || !columnMappings || !columnMappings.preferredColumns) {
    return { filteredData: data, columnDefs: [] };
  }

  // Get visible preferred columns sorted by order
  const visibleColumns = columnMappings.preferredColumns
    .filter(col => col.visible && col.excelColumn)
    .sort((a, b) => a.order - b.order);

  if (visibleColumns.length === 0) {
    // No mappings configured, return all data
    return { filteredData: data, columnDefs: [] };
  }

  // Create column definitions for AG Grid
  const columnDefs = visibleColumns.map(col => ({
    field: col.excelColumn,
    headerName: col.label,
    id: col.id
  }));

  // Filter data to only include mapped columns
  const filteredData = data.map(row => {
    const filteredRow = {};

    // Always include metadata columns
    Object.keys(row).forEach(key => {
      if (key.startsWith('_')) {
        filteredRow[key] = row[key];
      }
    });

    // Include only mapped columns
    visibleColumns.forEach(col => {
      if (col.excelColumn && row.hasOwnProperty(col.excelColumn)) {
        filteredRow[col.excelColumn] = row[col.excelColumn];
      }
    });

    return filteredRow;
  });

  return { filteredData, columnDefs };
}

module.exports = {
  readExcelFile,
  writeExcelFile,
  createRowHash,
  extractUnits,
  applyZzTypeMappings,
  extractColumns,
  applyColumnMappings
};
