/**
 * SQLite Database Layer for Excel Data
 * Provides high-performance querying and pagination for large Excel files
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Store active database instances and SQL module
const activeDatabases = new Map();
let SQL = null;

// Initialize sql.js
async function initSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Get database file path for an Excel file
 * @param {string} excelFilePath - Path to the Excel file
 * @returns {string} Database file path
 */
function getDbPath(excelFilePath) {
  const fileHash = crypto.createHash('md5').update(excelFilePath).digest('hex');
  return path.join(os.tmpdir(), `xlx-${fileHash}.db`);
}

/**
 * Get or create a database instance for an Excel file
 * @param {string} excelFilePath - Path to the Excel file
 * @returns {Promise<Database>} SQLite database instance
 */
async function getDatabase(excelFilePath) {
  if (activeDatabases.has(excelFilePath)) {
    return activeDatabases.get(excelFilePath);
  }

  await initSQL();

  const dbPath = getDbPath(excelFilePath);
  let db;

  // Try to load existing database from file
  if (fs.existsSync(dbPath)) {
    try {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } catch (err) {
      console.warn('[ExcelDB] Could not load existing database, creating new one:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  activeDatabases.set(excelFilePath, { db, dbPath });
  return { db, dbPath };
}

/**
 * Save database to disk
 * @param {string} excelFilePath - Path to the Excel file
 */
function saveDatabase(excelFilePath) {
  if (!activeDatabases.has(excelFilePath)) return;

  const { db, dbPath } = activeDatabases.get(excelFilePath);
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Close and cleanup database for an Excel file
 * @param {string} excelFilePath - Path to the Excel file
 */
function closeDatabase(excelFilePath) {
  if (activeDatabases.has(excelFilePath)) {
    const { db, dbPath } = activeDatabases.get(excelFilePath);

    db.close();
    activeDatabases.delete(excelFilePath);

    // Delete temporary database file
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (err) {
      console.error('[ExcelDB] Error deleting database files:', err);
    }
  }
}

/**
 * Sanitize sheet name for use as SQLite table name
 * @param {string} sheetName - Original sheet name
 * @returns {string} Sanitized table name
 */
function sanitizeTableName(sheetName) {
  // Replace invalid characters with underscore
  return 'sheet_' + sheetName.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Sanitize column name for SQLite
 * @param {string} columnName - Original column name
 * @returns {string} Sanitized column name
 */
function sanitizeColumnName(columnName) {
  if (!columnName || columnName.trim() === '') {
    return 'column_empty';
  }
  // Replace invalid characters and ensure it doesn't start with a number
  let sanitized = columnName.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^\d/.test(sanitized)) {
    sanitized = 'col_' + sanitized;
  }
  return sanitized;
}

/**
 * Convert Excel sheets to SQLite tables
 * @param {string} excelFilePath - Path to the Excel file
 * @param {Array} sheets - Array of sheet objects from Excel processor
 * @returns {Promise<Object>} Database info with sheet metadata
 */
async function loadExcelToDatabase(excelFilePath, sheets) {
  const { db } = await getDatabase(excelFilePath);

  // Drop existing tables (skip system tables)
  const existingTablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (existingTablesResult.length > 0 && existingTablesResult[0].values) {
    existingTablesResult[0].values.forEach(row => {
      const tableName = row[0];
      db.run(`DROP TABLE IF EXISTS ${tableName}`);
    });
  }

  const sheetMetadata = [];

  sheets.forEach(sheet => {
    if (sheet.hidden || !sheet.data || sheet.data.length === 0) {
      return; // Skip hidden or empty sheets
    }

    const tableName = sanitizeTableName(sheet.name);
    const firstRow = sheet.data[0];

    // Get column names from the first data row
    const columns = Object.keys(firstRow).filter(col => col !== '_worksheet');

    // Build CREATE TABLE statement with dynamic columns
    const columnDefs = columns.map(col => {
      const sanitized = sanitizeColumnName(col);
      return `${sanitized} TEXT`; // Store everything as TEXT for flexibility
    }).join(', ');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        _id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${columnDefs}
      )
    `;

    db.run(createTableSQL);

    // Create index on _rowHash for fast lookups
    if (columns.includes('_rowHash')) {
      db.run(`CREATE INDEX IF NOT EXISTS idx_${tableName}_rowHash ON ${tableName}(${sanitizeColumnName('_rowHash')})`);
    }

    // Insert data
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.map(sanitizeColumnName).join(', ');
    const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;

    // Begin transaction for bulk insert
    db.run('BEGIN TRANSACTION');

    try {
      for (const row of sheet.data) {
        const values = columns.map(col => {
          const val = row[col];
          return val === null || val === undefined ? null : String(val);
        });
        db.run(insertSQL, values);
      }

      db.run('COMMIT');
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }

    // Store metadata
    sheetMetadata.push({
      name: sheet.name,
      tableName: tableName,
      rowCount: sheet.data.length,
      columns: columns,
      sanitizedColumns: columns.map(sanitizeColumnName)
    });
  });

  // Save database to disk
  saveDatabase(excelFilePath);

  return {
    filePath: excelFilePath,
    sheets: sheetMetadata
  };
}

/**
 * Query data from a sheet with pagination
 * @param {string} excelFilePath - Path to the Excel file
 * @param {string} sheetName - Name of the sheet
 * @param {Object} options - Query options
 * @param {number} options.offset - Offset for pagination
 * @param {number} options.limit - Limit for pagination
 * @param {string} options.orderBy - Column to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @param {Object} options.filters - Filter conditions
 * @returns {Promise<Object>} Query results with data and metadata
 */
async function querySheet(excelFilePath, sheetName, options = {}) {
  const { db } = await getDatabase(excelFilePath);
  const tableName = sanitizeTableName(sheetName);

  const {
    offset = 0,
    limit = 100,
    orderBy = '_id',
    orderDir = 'ASC',
    filters = {}
  } = options;

  // Build WHERE clause from filters
  let whereClause = '';
  const filterValues = [];

  if (Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters).map(([col, value]) => {
      const sanitized = sanitizeColumnName(col);
      filterValues.push(`%${value}%`);
      return `${sanitized} LIKE ?`;
    });
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  // Get total count
  const countSQL = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
  const countResult = db.exec(countSQL, filterValues);
  const totalRows = countResult.length > 0 && countResult[0].values.length > 0
    ? countResult[0].values[0][0]
    : 0;

  // Query data
  const orderByCol = sanitizeColumnName(orderBy);
  const direction = orderDir === 'DESC' ? 'DESC' : 'ASC';

  // Build query with optional LIMIT clause
  let dataSQL;
  let queryParams;

  if (limit === -1) {
    // Load all rows - no LIMIT clause
    dataSQL = `
      SELECT * FROM ${tableName}
      ${whereClause}
      ORDER BY ${orderByCol} ${direction}
    `;
    queryParams = [...filterValues];
  } else {
    // Paginated query
    dataSQL = `
      SELECT * FROM ${tableName}
      ${whereClause}
      ORDER BY ${orderByCol} ${direction}
      LIMIT ? OFFSET ?
    `;
    queryParams = [...filterValues, limit, offset];
  }

  const result = db.exec(dataSQL, queryParams);

  // Convert result to array of objects
  const data = [];
  if (result.length > 0 && result[0].columns && result[0].values) {
    const columns = result[0].columns;
    for (const row of result[0].values) {
      const obj = {};
      for (let i = 0; i < columns.length; i++) {
        obj[columns[i]] = row[i];
      }
      data.push(obj);
    }
  }

  return {
    data,
    totalRows,
    offset,
    limit,
    hasMore: offset + limit < totalRows
  };
}

/**
 * Update a row in the database
 * @param {string} excelFilePath - Path to the Excel file
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowId - Row ID (_id column)
 * @param {Object} updates - Column-value pairs to update
 * @returns {Promise<boolean>} Success status
 */
async function updateRow(excelFilePath, sheetName, rowId, updates) {
  const { db } = await getDatabase(excelFilePath);
  const tableName = sanitizeTableName(sheetName);

  const setClauses = Object.keys(updates).map(col => {
    return `${sanitizeColumnName(col)} = ?`;
  }).join(', ');

  const values = Object.values(updates).map(v => v === null || v === undefined ? null : String(v));
  values.push(rowId);

  const updateSQL = `UPDATE ${tableName} SET ${setClauses} WHERE _id = ?`;

  try {
    db.run(updateSQL, values);
    // Save database after update
    saveDatabase(excelFilePath);
    return true;
  } catch (err) {
    console.error('[ExcelDB] Update error:', err);
    return false;
  }
}

/**
 * Export database back to Excel format
 * @param {string} excelFilePath - Path to the Excel file
 * @returns {Promise<Array>} Array of sheet objects compatible with Excel processor
 */
async function exportToExcelFormat(excelFilePath) {
  const { db } = await getDatabase(excelFilePath);

  // Get all tables
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sheet_%'");

  const sheets = [];
  if (tablesResult.length > 0 && tablesResult[0].values) {
    for (const row of tablesResult[0].values) {
      const tableName = row[0];

      // Get original sheet name (remove 'sheet_' prefix)
      const sheetName = tableName.replace(/^sheet_/, '').replace(/_/g, ' ');

      // Get all data
      const dataResult = db.exec(`SELECT * FROM ${tableName}`);

      const data = [];
      if (dataResult.length > 0 && dataResult[0].columns && dataResult[0].values) {
        const columns = dataResult[0].columns;
        for (const dataRow of dataResult[0].values) {
          const obj = {};
          for (let i = 0; i < columns.length; i++) {
            // Skip _id column
            if (columns[i] !== '_id') {
              obj[columns[i]] = dataRow[i];
            }
          }
          data.push(obj);
        }
      }

      sheets.push({
        name: sheetName,
        data: data,
        hidden: false
      });
    }
  }

  return sheets;
}

/**
 * Get list of all sheets in the database
 * @param {string} excelFilePath - Path to the Excel file
 * @returns {Promise<Array>} Array of sheet names with row counts
 */
async function getSheetList(excelFilePath) {
  const { db } = await getDatabase(excelFilePath);

  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sheet_%'");

  const sheets = [];
  if (tablesResult.length > 0 && tablesResult[0].values) {
    for (const row of tablesResult[0].values) {
      const tableName = row[0];
      const sheetName = tableName.replace(/^sheet_/, '').replace(/_/g, ' ');

      const countResult = db.exec(`SELECT COUNT(*) as total FROM ${tableName}`);
      const rowCount = countResult.length > 0 && countResult[0].values.length > 0
        ? countResult[0].values[0][0]
        : 0;

      // Get column names using PRAGMA table_info
      const columnsResult = db.exec(`PRAGMA table_info(${tableName})`);
      const columns = [];
      const sanitizedColumns = [];
      if (columnsResult.length > 0 && columnsResult[0].values) {
        for (const colRow of columnsResult[0].values) {
          const columnName = colRow[1];  // name is at index 1 in PRAGMA result
          if (columnName !== '_id') {  // Skip internal ID column
            columns.push(columnName);
            sanitizedColumns.push(columnName);
          }
        }
      }

      sheets.push({
        name: sheetName,
        tableName: tableName,
        rowCount: rowCount,
        columns: columns,
        sanitizedColumns: sanitizedColumns
      });
    }
  }

  return sheets;
}

module.exports = {
  getDatabase,
  closeDatabase,
  loadExcelToDatabase,
  querySheet,
  updateRow,
  exportToExcelFormat,
  getSheetList
};
