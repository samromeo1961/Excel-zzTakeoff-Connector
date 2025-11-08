const {
  getPreferences,
  savePreferences,
  resetPreferences,
  updatePreference,
  getDefaultPreferences,
  saveUnitMapping,
  deleteUnitMapping,
  getUnitMappings,
  addDiscoveredUnits,
  removeDiscoveredUnit,
  getDiscoveredUnits,
  getColumnMappings,
  saveColumnMappings,
  updatePreferredColumn,
  addCustomColumn,
  deleteCustomColumn,
  reorderColumns,
  addDiscoveredColumns,
  removeDiscoveredColumn,
  getDiscoveredColumns,
  clearDiscoveredColumns,
  resetColumnMappings,
  saveFileUnitMappings,
  getFileUnitMappings,
  getCombinedUnitMappings,
  addFileUnitMapping
} = require('../database/preferences-store');

/**
 * Get all preferences
 * IPC Handler: 'preferences-store:get'
 */
async function handleGetPreferences(event, params) {
  try {
    const preferences = getPreferences();
    return {
      success: true,
      data: preferences
    };
  } catch (err) {
    console.error('Error getting preferences:', err);
    return {
      success: false,
      error: 'Failed to get preferences',
      message: err.message,
      data: getDefaultPreferences()
    };
  }
}

/**
 * Save preferences
 * IPC Handler: 'preferences-store:save'
 */
async function handleSavePreferences(event, preferences) {
  try {
    return savePreferences(preferences);
  } catch (err) {
    console.error('Error saving preferences:', err);
    return {
      success: false,
      error: 'Failed to save preferences',
      message: err.message
    };
  }
}

/**
 * Reset preferences to default
 * IPC Handler: 'preferences-store:reset'
 */
async function handleResetPreferences(event, params) {
  try {
    return resetPreferences();
  } catch (err) {
    console.error('Error resetting preferences:', err);
    return {
      success: false,
      error: 'Failed to reset preferences',
      message: err.message
    };
  }
}

/**
 * Update a specific preference key
 * IPC Handler: 'preferences-store:update'
 */
async function handleUpdatePreference(event, { key, value }) {
  try {
    return updatePreference(key, value);
  } catch (err) {
    console.error('Error updating preference:', err);
    return {
      success: false,
      error: 'Failed to update preference',
      message: err.message
    };
  }
}

/**
 * Get default preferences
 * IPC Handler: 'preferences-store:get-defaults'
 */
async function handleGetDefaultPreferences(event, params) {
  try {
    return {
      success: true,
      data: getDefaultPreferences()
    };
  } catch (err) {
    console.error('Error getting default preferences:', err);
    return {
      success: false,
      error: 'Failed to get default preferences',
      message: err.message
    };
  }
}

/**
 * Save or update a unit mapping
 * IPC Handler: 'preferences-store:save-unit-mapping'
 */
async function handleSaveUnitMapping(event, { unit, zzType, active }) {
  try {
    saveUnitMapping(unit, zzType, active);
    return { success: true };
  } catch (err) {
    console.error('Error saving unit mapping:', err);
    return {
      success: false,
      error: 'Failed to save unit mapping',
      message: err.message
    };
  }
}

/**
 * Delete a unit mapping
 * IPC Handler: 'preferences-store:delete-unit-mapping'
 */
async function handleDeleteUnitMapping(event, unit) {
  try {
    deleteUnitMapping(unit);
    return { success: true };
  } catch (err) {
    console.error('Error deleting unit mapping:', err);
    return {
      success: false,
      error: 'Failed to delete unit mapping',
      message: err.message
    };
  }
}

/**
 * Get all unit mappings
 * IPC Handler: 'preferences-store:get-unit-mappings'
 */
async function handleGetUnitMappings(event, params) {
  try {
    const mappings = getUnitMappings();
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    console.error('Error getting unit mappings:', err);
    return {
      success: false,
      error: 'Failed to get unit mappings',
      message: err.message,
      data: []
    };
  }
}

/**
 * Get all discovered units
 * IPC Handler: 'preferences-store:get-discovered-units'
 */
async function handleGetDiscoveredUnits(event, params) {
  try {
    const discovered = getDiscoveredUnits();
    return {
      success: true,
      data: discovered
    };
  } catch (err) {
    console.error('Error getting discovered units:', err);
    return {
      success: false,
      error: 'Failed to get discovered units',
      message: err.message,
      data: []
    };
  }
}

/**
 * Remove a discovered unit
 * IPC Handler: 'preferences-store:remove-discovered-unit'
 */
async function handleRemoveDiscoveredUnit(event, unit) {
  try {
    removeDiscoveredUnit(unit);
    return { success: true };
  } catch (err) {
    console.error('Error removing discovered unit:', err);
    return {
      success: false,
      error: 'Failed to remove discovered unit',
      message: err.message
    };
  }
}

// ============================================================================
// File-Specific Unit Mapping Handlers
// ============================================================================

/**
 * Save file-specific unit mappings
 * IPC Handler: 'preferences-store:save-file-unit-mappings'
 */
async function handleSaveFileUnitMappings(event, { filePath, mappings }) {
  try {
    saveFileUnitMappings(filePath, mappings);
    return { success: true };
  } catch (err) {
    console.error('Error saving file-specific unit mappings:', err);
    return {
      success: false,
      error: 'Failed to save file-specific unit mappings',
      message: err.message
    };
  }
}

/**
 * Get file-specific unit mappings
 * IPC Handler: 'preferences-store:get-file-unit-mappings'
 */
async function handleGetFileUnitMappings(event, filePath) {
  try {
    const mappings = getFileUnitMappings(filePath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    console.error('Error getting file-specific unit mappings:', err);
    return {
      success: false,
      error: 'Failed to get file-specific unit mappings',
      message: err.message,
      data: []
    };
  }
}

/**
 * Get combined unit mappings (file-specific + global)
 * IPC Handler: 'preferences-store:get-combined-unit-mappings'
 */
async function handleGetCombinedUnitMappings(event, filePath) {
  try {
    const mappings = getCombinedUnitMappings(filePath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    console.error('Error getting combined unit mappings:', err);
    return {
      success: false,
      error: 'Failed to get combined unit mappings',
      message: err.message,
      data: []
    };
  }
}

/**
 * Add a single file-specific unit mapping
 * IPC Handler: 'preferences-store:add-file-unit-mapping'
 */
async function handleAddFileUnitMapping(event, { filePath, unit, zzType, active }) {
  try {
    addFileUnitMapping(filePath, unit, zzType, active);
    return { success: true };
  } catch (err) {
    console.error('Error adding file-specific unit mapping:', err);
    return {
      success: false,
      error: 'Failed to add file-specific unit mapping',
      message: err.message
    };
  }
}

// ============================================================================
// Column Mapping Handlers
// ============================================================================

/**
 * Get column mappings
 * IPC Handler: 'preferences-store:get-column-mappings'
 */
async function handleGetColumnMappings(event, params) {
  try {
    const mappings = getColumnMappings();
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    console.error('Error getting column mappings:', err);
    return {
      success: false,
      error: 'Failed to get column mappings',
      message: err.message,
      data: { preferredColumns: [] }
    };
  }
}

/**
 * Save column mappings
 * IPC Handler: 'preferences-store:save-column-mappings'
 */
async function handleSaveColumnMappings(event, columnMappings) {
  try {
    saveColumnMappings(columnMappings);
    return { success: true };
  } catch (err) {
    console.error('Error saving column mappings:', err);
    return {
      success: false,
      error: 'Failed to save column mappings',
      message: err.message
    };
  }
}

/**
 * Update a preferred column
 * IPC Handler: 'preferences-store:update-preferred-column'
 */
async function handleUpdatePreferredColumn(event, { columnId, updates }) {
  try {
    updatePreferredColumn(columnId, updates);
    return { success: true };
  } catch (err) {
    console.error('Error updating preferred column:', err);
    return {
      success: false,
      error: 'Failed to update preferred column',
      message: err.message
    };
  }
}

/**
 * Add a custom column
 * IPC Handler: 'preferences-store:add-custom-column'
 */
async function handleAddCustomColumn(event, { label, excelColumn }) {
  try {
    const id = addCustomColumn(label, excelColumn);
    return {
      success: true,
      data: { id }
    };
  } catch (err) {
    console.error('Error adding custom column:', err);
    return {
      success: false,
      error: 'Failed to add custom column',
      message: err.message
    };
  }
}

/**
 * Delete a custom column
 * IPC Handler: 'preferences-store:delete-custom-column'
 */
async function handleDeleteCustomColumn(event, columnId) {
  try {
    deleteCustomColumn(columnId);
    return { success: true };
  } catch (err) {
    console.error('Error deleting custom column:', err);
    return {
      success: false,
      error: 'Failed to delete custom column',
      message: err.message
    };
  }
}

/**
 * Reorder columns
 * IPC Handler: 'preferences-store:reorder-columns'
 */
async function handleReorderColumns(event, columnIds) {
  try {
    reorderColumns(columnIds);
    return { success: true };
  } catch (err) {
    console.error('Error reordering columns:', err);
    return {
      success: false,
      error: 'Failed to reorder columns',
      message: err.message
    };
  }
}

/**
 * Get discovered columns
 * IPC Handler: 'preferences-store:get-discovered-columns'
 */
async function handleGetDiscoveredColumns(event, params) {
  try {
    const discovered = getDiscoveredColumns();
    return {
      success: true,
      data: discovered
    };
  } catch (err) {
    console.error('Error getting discovered columns:', err);
    return {
      success: false,
      error: 'Failed to get discovered columns',
      message: err.message,
      data: []
    };
  }
}

/**
 * Remove a discovered column
 * IPC Handler: 'preferences-store:remove-discovered-column'
 */
async function handleRemoveDiscoveredColumn(event, columnName) {
  try {
    removeDiscoveredColumn(columnName);
    return { success: true };
  } catch (err) {
    console.error('Error removing discovered column:', err);
    return {
      success: false,
      error: 'Failed to remove discovered column',
      message: err.message
    };
  }
}

/**
 * Reset column mappings to defaults
 * IPC Handler: 'preferences-store:reset-column-mappings'
 */
async function handleResetColumnMappings(event, params) {
  try {
    resetColumnMappings();
    return { success: true };
  } catch (err) {
    console.error('Error resetting column mappings:', err);
    return {
      success: false,
      error: 'Failed to reset column mappings',
      message: err.message
    };
  }
}

/**
 * Clear all discovered columns
 * IPC Handler: 'preferences-store:clear-discovered-columns'
 */
async function handleClearDiscoveredColumns(event, params) {
  try {
    clearDiscoveredColumns();
    return { success: true };
  } catch (err) {
    console.error('Error clearing discovered columns:', err);
    return {
      success: false,
      error: 'Failed to clear discovered columns',
      message: err.message
    };
  }
}

module.exports = {
  handleGetPreferences,
  handleSavePreferences,
  handleResetPreferences,
  handleUpdatePreference,
  handleGetDefaultPreferences,
  handleSaveUnitMapping,
  handleDeleteUnitMapping,
  handleGetUnitMappings,
  handleGetDiscoveredUnits,
  handleRemoveDiscoveredUnit,
  // File-specific unit mapping handlers
  handleSaveFileUnitMappings,
  handleGetFileUnitMappings,
  handleGetCombinedUnitMappings,
  handleAddFileUnitMapping,
  // Column mapping handlers
  handleGetColumnMappings,
  handleSaveColumnMappings,
  handleUpdatePreferredColumn,
  handleAddCustomColumn,
  handleDeleteCustomColumn,
  handleReorderColumns,
  handleGetDiscoveredColumns,
  handleRemoveDiscoveredColumn,
  handleClearDiscoveredColumns,
  handleResetColumnMappings
};
