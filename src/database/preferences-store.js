const Store = require('electron-store');

// Electron-store for preferences
const store = new Store({ name: 'preferences', defaults: { settings: {} } });

/**
 * Get default preferences
 * @returns {Object} Default preferences
 */
function getDefaultPreferences() {
  return {
    theme: 'light',
    zzTakeoffApiUrl: '',
    zzTakeoffApiKey: '',
    defaultTakeoffTypes: {
      Material: 'Material',
      Labour: 'Labour',
      Plant: 'Plant',
      Subcontractor: 'Subcontractor',
      Other: 'Other'
    },
    // Default markup % to auto-fill blank cells
    defaultMarkupPercent: null,
    // Last opened file path for auto-reload on app startup
    lastOpenedFile: null,
    // Unit-to-zzType mappings: [{ unit: string, zzType: string, active: boolean }]
    unitMappings: [],
    // Discovered units pending user configuration: [{ unit: string, count: number, lastSeen: timestamp }]
    discoveredUnits: [],
    // Column mappings for Excel Grid display
    columnMappings: {
      preferredColumns: [
        { id: 'sku', label: 'SKU', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 0, isStandard: true, isMetadata: false },
        { id: 'name', label: 'Name', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 1, isStandard: true, isMetadata: false },
        { id: 'description', label: 'Description', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 2, isStandard: true, isMetadata: false },
        { id: 'units', label: 'Units', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 3, isStandard: true, isMetadata: false },
        { id: 'costCode', label: 'Cost Code', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 4, isStandard: true, isMetadata: false },
        { id: 'category', label: 'Category', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 5, isStandard: true, isMetadata: false },
        { id: 'costEach', label: 'Cost Each', excelColumn: null, visible: true, sendToZzTakeoff: true, order: 6, isStandard: true, isMetadata: false },
        // Custom editable columns
        { id: 'custom1', label: 'Custom 1', excelColumn: null, visible: false, sendToZzTakeoff: false, order: 7, isStandard: false, isMetadata: false },
        { id: 'custom2', label: 'Custom 2', excelColumn: null, visible: false, sendToZzTakeoff: false, order: 8, isStandard: false, isMetadata: false },
        { id: 'custom3', label: 'Custom 3', excelColumn: null, visible: false, sendToZzTakeoff: false, order: 9, isStandard: false, isMetadata: false },
        { id: 'custom4', label: 'Custom 4', excelColumn: null, visible: false, sendToZzTakeoff: false, order: 10, isStandard: false, isMetadata: false },
        { id: 'custom5', label: 'Custom 5', excelColumn: null, visible: false, sendToZzTakeoff: false, order: 11, isStandard: false, isMetadata: false },
        // Metadata columns (user-editable values, not mapped from Excel)
        { id: 'markupPercent', label: 'Markup %', excelColumn: null, visible: false, sendToZzTakeoff: true, order: 100, isStandard: true, isMetadata: true },
        { id: 'zzType', label: 'zzType', excelColumn: null, visible: false, sendToZzTakeoff: true, order: 101, isStandard: true, isMetadata: true }
      ]
    },
    // Discovered Excel columns pending mapping: [{ columnName: string, count: number, lastSeen: timestamp }]
    discoveredColumns: []
  };
}

/**
 * Get all preferences
 * @returns {Object} Preferences object
 */
function getPreferences() {
  const prefs = store.get('settings', {});
  const defaults = getDefaultPreferences();

  // Merge with defaults
  const merged = { ...defaults, ...prefs };

  // Auto-migrate: Add missing custom columns if they don't exist
  if (merged.columnMappings && merged.columnMappings.preferredColumns) {
    const existingIds = new Set(merged.columnMappings.preferredColumns.map(col => col.id));
    const defaultColumns = defaults.columnMappings.preferredColumns;

    // Add any missing columns from defaults (like the 5 custom columns)
    defaultColumns.forEach(defaultCol => {
      if (!existingIds.has(defaultCol.id)) {
        merged.columnMappings.preferredColumns.push(defaultCol);
      }
    });

    // Sort by order to maintain proper ordering
    merged.columnMappings.preferredColumns.sort((a, b) => a.order - b.order);

    // Auto-migrate: Add sendToZzTakeoff property if missing
    merged.columnMappings.preferredColumns.forEach(col => {
      if (col.sendToZzTakeoff === undefined) {
        // Default to true for standard columns, false for custom
        col.sendToZzTakeoff = col.isStandard !== false;
      }
    });

    // Auto-migrate: Add isMetadata property if missing
    merged.columnMappings.preferredColumns.forEach(col => {
      if (col.isMetadata === undefined) {
        // Metadata columns are identified by high order numbers (100+)
        // or by specific IDs
        col.isMetadata = col.id === 'markupPercent' || col.id === 'zzType' || col.order >= 100;
      }
    });
  }

  return merged;
}

/**
 * Save all preferences
 * @param {Object} preferences - Preferences object
 */
function savePreferences(preferences) {
  store.set('settings', preferences);
}

/**
 * Update a single preference
 * @param {string} key - Preference key
 * @param {any} value - Preference value
 */
function updatePreference(key, value) {
  const prefs = getPreferences();
  prefs[key] = value;
  savePreferences(prefs);
}

/**
 * Reset preferences to defaults
 */
function resetPreferences() {
  store.set('settings', getDefaultPreferences());
}

/**
 * Add or update a unit mapping
 * @param {string} unit - Unit name
 * @param {string} zzType - zzType to map to
 * @param {boolean} active - Whether mapping is active
 */
function saveUnitMapping(unit, zzType, active = true) {
  const prefs = getPreferences();
  const mappings = prefs.unitMappings || [];

  const existingIndex = mappings.findIndex(m => m.unit === unit);

  if (existingIndex >= 0) {
    mappings[existingIndex] = { unit, zzType, active };
  } else {
    mappings.push({ unit, zzType, active });
  }

  updatePreference('unitMappings', mappings);
}

/**
 * Delete a unit mapping
 * @param {string} unit - Unit name to remove
 */
function deleteUnitMapping(unit) {
  const prefs = getPreferences();
  const mappings = prefs.unitMappings || [];
  const filtered = mappings.filter(m => m.unit !== unit);
  updatePreference('unitMappings', filtered);
}

/**
 * Get all unit mappings
 * @returns {Array} Array of unit mappings
 */
function getUnitMappings() {
  const prefs = getPreferences();
  return prefs.unitMappings || [];
}

/**
 * Add discovered units (from Excel file)
 * @param {Array<string>} units - Array of unit names discovered
 */
function addDiscoveredUnits(units) {
  const prefs = getPreferences();
  const discovered = prefs.discoveredUnits || [];
  const existing = prefs.unitMappings || [];
  const now = Date.now();

  // Only add units that don't already have mappings
  const existingUnits = new Set(existing.map(m => m.unit));
  const discoveredMap = new Map(discovered.map(d => [d.unit, d]));

  units.forEach(unit => {
    if (!existingUnits.has(unit)) {
      if (discoveredMap.has(unit)) {
        // Update count and timestamp
        const item = discoveredMap.get(unit);
        item.count++;
        item.lastSeen = now;
      } else {
        // Add new discovered unit
        discovered.push({ unit, count: 1, lastSeen: now });
      }
    }
  });

  updatePreference('discoveredUnits', discovered);
}

/**
 * Remove a discovered unit (when user rejects or accepts it)
 * @param {string} unit - Unit name to remove
 */
function removeDiscoveredUnit(unit) {
  const prefs = getPreferences();
  const discovered = prefs.discoveredUnits || [];
  const filtered = discovered.filter(d => d.unit !== unit);
  updatePreference('discoveredUnits', filtered);
}

/**
 * Get all discovered units
 * @returns {Array} Array of discovered units
 */
function getDiscoveredUnits() {
  const prefs = getPreferences();
  return prefs.discoveredUnits || [];
}

// ============================================================================
// Column Mapping Functions
// ============================================================================

/**
 * Get column mappings
 * @returns {Object} Column mappings object with preferredColumns array
 */
function getColumnMappings() {
  const prefs = getPreferences();
  return prefs.columnMappings || getDefaultPreferences().columnMappings;
}

/**
 * Save column mappings
 * @param {Object} columnMappings - Column mappings object
 */
function saveColumnMappings(columnMappings) {
  updatePreference('columnMappings', columnMappings);
}

/**
 * Update a single preferred column
 * @param {string} columnId - Preferred column ID
 * @param {Object} updates - Updates to apply { excelColumn?, visible?, order? }
 */
function updatePreferredColumn(columnId, updates) {
  const mappings = getColumnMappings();
  const column = mappings.preferredColumns.find(c => c.id === columnId);

  if (column) {
    Object.assign(column, updates);
    saveColumnMappings(mappings);
  }
}

/**
 * Add a custom preferred column
 * @param {string} label - Column label
 * @param {string} excelColumn - Excel column to map to (optional)
 * @returns {string} New column ID
 */
function addCustomColumn(label, excelColumn = null) {
  const mappings = getColumnMappings();
  const maxOrder = Math.max(...mappings.preferredColumns.map(c => c.order), -1);
  const id = `custom_${Date.now()}`;

  mappings.preferredColumns.push({
    id,
    label,
    excelColumn,
    visible: true,
    order: maxOrder + 1,
    isStandard: false
  });

  saveColumnMappings(mappings);
  return id;
}

/**
 * Delete a custom preferred column
 * @param {string} columnId - Column ID to delete
 */
function deleteCustomColumn(columnId) {
  const mappings = getColumnMappings();
  const column = mappings.preferredColumns.find(c => c.id === columnId);

  // Only allow deletion of custom columns
  if (column && !column.isStandard) {
    mappings.preferredColumns = mappings.preferredColumns.filter(c => c.id !== columnId);
    saveColumnMappings(mappings);
  }
}

/**
 * Reorder preferred columns
 * @param {Array<string>} columnIds - Array of column IDs in desired order
 */
function reorderColumns(columnIds) {
  const mappings = getColumnMappings();

  columnIds.forEach((id, index) => {
    const column = mappings.preferredColumns.find(c => c.id === id);
    if (column) {
      column.order = index;
    }
  });

  saveColumnMappings(mappings);
}

/**
 * Add discovered Excel columns
 * @param {Array<string>} columns - Array of column names discovered
 */
function addDiscoveredColumns(columns) {
  const prefs = getPreferences();
  const discovered = prefs.discoveredColumns || [];
  const mappings = getColumnMappings();
  const now = Date.now();

  // Get all currently mapped Excel columns
  const mappedColumns = new Set(
    mappings.preferredColumns
      .filter(c => c.excelColumn)
      .map(c => c.excelColumn)
  );

  const discoveredMap = new Map(discovered.map(d => [d.columnName, d]));

  columns.forEach(column => {
    if (!mappedColumns.has(column)) {
      if (discoveredMap.has(column)) {
        // Update count and timestamp
        const item = discoveredMap.get(column);
        item.count++;
        item.lastSeen = now;
      } else {
        // Add new discovered column
        discovered.push({ columnName: column, count: 1, lastSeen: now });
      }
    }
  });

  updatePreference('discoveredColumns', discovered);
}

/**
 * Remove a discovered column
 * @param {string} columnName - Column name to remove
 */
function removeDiscoveredColumn(columnName) {
  const prefs = getPreferences();
  const discovered = prefs.discoveredColumns || [];
  const filtered = discovered.filter(d => d.columnName !== columnName);
  updatePreference('discoveredColumns', filtered);
}

/**
 * Get all discovered columns
 * @returns {Array} Array of discovered columns
 */
function getDiscoveredColumns() {
  const prefs = getPreferences();
  return prefs.discoveredColumns || [];
}

/**
 * Reset column mappings to defaults
 */
function resetColumnMappings() {
  updatePreference('columnMappings', getDefaultPreferences().columnMappings);
}

/**
 * Smart match Excel columns to preferred columns
 * @param {Array<string>} excelColumns - Array of Excel column names
 * @returns {Object} - Mappings object { preferredColumnId: excelColumnName }
 */
function smartMatchColumns(excelColumns) {
  const mappings = getColumnMappings();
  const matches = {};

  // Normalize string for comparison (lowercase, remove spaces/special chars)
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Define matching rules for each preferred column
  const matchingRules = {
    sku: ['sku', 'code', 'itemcode', 'item', 'partno', 'partnumber'],
    name: ['name', 'itemname', 'title', 'productname'],
    description: ['description', 'desc', 'details', 'itemdescription'],
    units: ['units', 'unit', 'uom', 'measure', 'measurement'],
    costCode: ['costcode', 'costcentre', 'costcenter', 'cc', 'scno', 'sc#', 'sc'],
    category: ['category', 'cat', 'type', 'group', 'classification', 'subcategory', 'subcat', 'subcategory'],
    costEach: ['costeach', 'cost', 'unitcost', 'price', 'unitprice', 'rate']
  };

  // First pass: Exact matches (case-insensitive)
  mappings.preferredColumns.forEach(prefCol => {
    const normalizedPrefLabel = normalize(prefCol.label);

    for (const excelCol of excelColumns) {
      const normalizedExcelCol = normalize(excelCol);

      // Exact match
      if (normalizedExcelCol === normalizedPrefLabel) {
        matches[prefCol.id] = excelCol;
        return;
      }
    }
  });

  // Second pass: Rule-based matching for unmapped columns
  mappings.preferredColumns.forEach(prefCol => {
    if (matches[prefCol.id]) return; // Already matched

    const rules = matchingRules[prefCol.id];
    if (!rules) return;

    for (const excelCol of excelColumns) {
      const normalizedExcelCol = normalize(excelCol);

      // Check if Excel column matches any rule
      for (const rule of rules) {
        if (normalizedExcelCol === rule || normalizedExcelCol.includes(rule) || rule.includes(normalizedExcelCol)) {
          // Make sure this Excel column isn't already matched to another preferred column
          const alreadyUsed = Object.values(matches).includes(excelCol);
          if (!alreadyUsed) {
            matches[prefCol.id] = excelCol;
            return;
          }
        }
      }
    }
  });

  return matches;
}

/**
 * Apply smart matching to column mappings
 * Automatically maps Excel columns to preferred columns based on similarity
 * @param {Array<string>} excelColumns - Array of Excel column names
 */
function applySmartMatching(excelColumns) {
  const matches = smartMatchColumns(excelColumns);

  // Apply the matches to the column mappings
  Object.entries(matches).forEach(([preferredId, excelColumn]) => {
    updatePreferredColumn(preferredId, { excelColumn });
  });

  console.log(`[Smart Matching] Matched ${Object.keys(matches).length} columns:`, matches);
}

module.exports = {
  getPreferences,
  savePreferences,
  updatePreference,
  resetPreferences,
  getDefaultPreferences,
  saveUnitMapping,
  deleteUnitMapping,
  getUnitMappings,
  addDiscoveredUnits,
  removeDiscoveredUnit,
  getDiscoveredUnits,
  // Column mapping functions
  getColumnMappings,
  saveColumnMappings,
  updatePreferredColumn,
  addCustomColumn,
  deleteCustomColumn,
  reorderColumns,
  addDiscoveredColumns,
  removeDiscoveredColumn,
  getDiscoveredColumns,
  resetColumnMappings,
  smartMatchColumns,
  applySmartMatching
};
