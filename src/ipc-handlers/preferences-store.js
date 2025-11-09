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
const logger = require('../utils/logger');
const { createErrorResponse } = require('../utils/error-handler');
const { validateIPCParams, validateString, validateObject, validateArray } = require('../utils/validators');

/**
 * Get all preferences
 * IPC Handler: 'preferences-store:get'
 */
async function handleGetPreferences(event, params) {
  try {
    logger.logDebug('[Preferences] Getting preferences');
    const preferences = getPreferences();
    return {
      success: true,
      data: preferences
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting preferences', err);
    return {
      ...createErrorResponse(err, 'handleGetPreferences'),
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
    const validated = validateObject(preferences, 'preferences', { required: true });
    logger.logInfo('[Preferences] Saving preferences');
    return savePreferences(validated);
  } catch (err) {
    logger.logError('[Preferences] Error saving preferences', err);
    return createErrorResponse(err, 'handleSavePreferences');
  }
}

/**
 * Reset preferences to default
 * IPC Handler: 'preferences-store:reset'
 */
async function handleResetPreferences(event, params) {
  try {
    logger.logInfo('[Preferences] Resetting preferences to defaults');
    return resetPreferences();
  } catch (err) {
    logger.logError('[Preferences] Error resetting preferences', err);
    return createErrorResponse(err, 'handleResetPreferences');
  }
}

/**
 * Update a specific preference key
 * IPC Handler: 'preferences-store:update'
 */
async function handleUpdatePreference(event, { key, value }) {
  try {
    const validatedKey = validateString(key, 'key', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Updating preference', { key: validatedKey });
    return updatePreference(validatedKey, value);
  } catch (err) {
    logger.logError('[Preferences] Error updating preference', err);
    return createErrorResponse(err, 'handleUpdatePreference');
  }
}

/**
 * Get default preferences
 * IPC Handler: 'preferences-store:get-defaults'
 */
async function handleGetDefaultPreferences(event, params) {
  try {
    logger.logDebug('[Preferences] Getting default preferences');
    return {
      success: true,
      data: getDefaultPreferences()
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting default preferences', err);
    return createErrorResponse(err, 'handleGetDefaultPreferences');
  }
}

/**
 * Save or update a unit mapping
 * IPC Handler: 'preferences-store:save-unit-mapping'
 */
async function handleSaveUnitMapping(event, { unit, zzType, active }) {
  try {
    const validatedUnit = validateString(unit, 'unit', { required: true, minLength: 1 });
    const validatedZzType = validateString(zzType, 'zzType', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Saving unit mapping', { unit: validatedUnit, zzType: validatedZzType });
    saveUnitMapping(validatedUnit, validatedZzType, active);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error saving unit mapping', err);
    return createErrorResponse(err, 'handleSaveUnitMapping');
  }
}

/**
 * Delete a unit mapping
 * IPC Handler: 'preferences-store:delete-unit-mapping'
 */
async function handleDeleteUnitMapping(event, unit) {
  try {
    const validatedUnit = validateString(unit, 'unit', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Deleting unit mapping', { unit: validatedUnit });
    deleteUnitMapping(validatedUnit);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error deleting unit mapping', err);
    return createErrorResponse(err, 'handleDeleteUnitMapping');
  }
}

/**
 * Get all unit mappings
 * IPC Handler: 'preferences-store:get-unit-mappings'
 */
async function handleGetUnitMappings(event, params) {
  try {
    logger.logDebug('[Preferences] Getting unit mappings');
    const mappings = getUnitMappings();
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting unit mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetUnitMappings'),
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
    logger.logDebug('[Preferences] Getting discovered units');
    const discovered = getDiscoveredUnits();
    return {
      success: true,
      data: discovered
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting discovered units', err);
    return {
      ...createErrorResponse(err, 'handleGetDiscoveredUnits'),
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
    const validatedUnit = validateString(unit, 'unit', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Removing discovered unit', { unit: validatedUnit });
    removeDiscoveredUnit(validatedUnit);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error removing discovered unit', err);
    return createErrorResponse(err, 'handleRemoveDiscoveredUnit');
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
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    const validatedMappings = validateArray(mappings, 'mappings', { required: true });
    logger.logInfo('[Preferences] Saving file-specific unit mappings', { filePath: validatedPath, count: validatedMappings.length });
    saveFileUnitMappings(validatedPath, validatedMappings);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error saving file-specific unit mappings', err);
    return createErrorResponse(err, 'handleSaveFileUnitMappings');
  }
}

/**
 * Get file-specific unit mappings
 * IPC Handler: 'preferences-store:get-file-unit-mappings'
 */
async function handleGetFileUnitMappings(event, filePath) {
  try {
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    logger.logDebug('[Preferences] Getting file-specific unit mappings', { filePath: validatedPath });
    const mappings = getFileUnitMappings(validatedPath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting file-specific unit mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetFileUnitMappings'),
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
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    logger.logDebug('[Preferences] Getting combined unit mappings', { filePath: validatedPath });
    const mappings = getCombinedUnitMappings(validatedPath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting combined unit mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetCombinedUnitMappings'),
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
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    const validatedUnit = validateString(unit, 'unit', { required: true, minLength: 1 });
    const validatedZzType = validateString(zzType, 'zzType', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Adding file-specific unit mapping', { filePath: validatedPath, unit: validatedUnit });
    addFileUnitMapping(validatedPath, validatedUnit, validatedZzType, active);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error adding file-specific unit mapping', err);
    return createErrorResponse(err, 'handleAddFileUnitMapping');
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
    logger.logDebug('[Preferences] Getting column mappings');
    const mappings = getColumnMappings();
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting column mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetColumnMappings'),
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
    const validated = validateObject(columnMappings, 'columnMappings', { required: true });
    logger.logInfo('[Preferences] Saving column mappings');
    saveColumnMappings(validated);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error saving column mappings', err);
    return createErrorResponse(err, 'handleSaveColumnMappings');
  }
}

/**
 * Update a preferred column
 * IPC Handler: 'preferences-store:update-preferred-column'
 */
async function handleUpdatePreferredColumn(event, { columnId, updates }) {
  try {
    const validatedId = validateString(columnId, 'columnId', { required: true, minLength: 1 });
    const validatedUpdates = validateObject(updates, 'updates', { required: true });
    logger.logInfo('[Preferences] Updating preferred column', { columnId: validatedId });
    updatePreferredColumn(validatedId, validatedUpdates);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error updating preferred column', err);
    return createErrorResponse(err, 'handleUpdatePreferredColumn');
  }
}

/**
 * Add a custom column
 * IPC Handler: 'preferences-store:add-custom-column'
 */
async function handleAddCustomColumn(event, { label, excelColumn }) {
  try {
    const validatedLabel = validateString(label, 'label', { required: true, minLength: 1 });
    const validatedColumn = validateString(excelColumn, 'excelColumn', { required: false });
    logger.logInfo('[Preferences] Adding custom column', { label: validatedLabel });
    const id = addCustomColumn(validatedLabel, validatedColumn);
    return {
      success: true,
      data: { id }
    };
  } catch (err) {
    logger.logError('[Preferences] Error adding custom column', err);
    return createErrorResponse(err, 'handleAddCustomColumn');
  }
}

/**
 * Delete a custom column
 * IPC Handler: 'preferences-store:delete-custom-column'
 */
async function handleDeleteCustomColumn(event, columnId) {
  try {
    const validatedId = validateString(columnId, 'columnId', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Deleting custom column', { columnId: validatedId });
    deleteCustomColumn(validatedId);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error deleting custom column', err);
    return createErrorResponse(err, 'handleDeleteCustomColumn');
  }
}

/**
 * Reorder columns
 * IPC Handler: 'preferences-store:reorder-columns'
 */
async function handleReorderColumns(event, columnIds) {
  try {
    const validated = validateArray(columnIds, 'columnIds', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Reordering columns', { count: validated.length });
    reorderColumns(validated);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error reordering columns', err);
    return createErrorResponse(err, 'handleReorderColumns');
  }
}

/**
 * Get discovered columns
 * IPC Handler: 'preferences-store:get-discovered-columns'
 */
async function handleGetDiscoveredColumns(event, params) {
  try {
    logger.logDebug('[Preferences] Getting discovered columns');
    const discovered = getDiscoveredColumns();
    return {
      success: true,
      data: discovered
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting discovered columns', err);
    return {
      ...createErrorResponse(err, 'handleGetDiscoveredColumns'),
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
    const validated = validateString(columnName, 'columnName', { required: true, minLength: 1 });
    logger.logInfo('[Preferences] Removing discovered column', { columnName: validated });
    removeDiscoveredColumn(validated);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error removing discovered column', err);
    return createErrorResponse(err, 'handleRemoveDiscoveredColumn');
  }
}

/**
 * Reset column mappings to defaults
 * IPC Handler: 'preferences-store:reset-column-mappings'
 */
async function handleResetColumnMappings(event, params) {
  try {
    logger.logInfo('[Preferences] Resetting column mappings to defaults');
    resetColumnMappings();
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error resetting column mappings', err);
    return createErrorResponse(err, 'handleResetColumnMappings');
  }
}

/**
 * Clear all discovered columns
 * IPC Handler: 'preferences-store:clear-discovered-columns'
 */
async function handleClearDiscoveredColumns(event, params) {
  try {
    logger.logInfo('[Preferences] Clearing all discovered columns');
    clearDiscoveredColumns();
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error clearing discovered columns', err);
    return createErrorResponse(err, 'handleClearDiscoveredColumns');
  }
}

// ============================================================================
// File-Specific Column Mapping Handlers
// ============================================================================

/**
 * Get file-specific column mappings
 * IPC Handler: 'preferences-store:get-file-column-mappings'
 */
async function handleGetFileColumnMappings(event, filePath) {
  try {
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    logger.logDebug('[Preferences] Getting file-specific column mappings', { filePath: validatedPath });
    const mappings = getFileColumnMappings(validatedPath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting file-specific column mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetFileColumnMappings'),
      data: { preferredColumns: [] }
    };
  }
}

/**
 * Save file-specific column mappings
 * IPC Handler: 'preferences-store:save-file-column-mappings'
 */
async function handleSaveFileColumnMappings(event, { filePath, columnMappings }) {
  try {
    const validatedPath = validateString(filePath, 'filePath', { required: true, minLength: 1 });
    const validated = validateObject(columnMappings, 'columnMappings', { required: true });
    logger.logInfo('[Preferences] Saving file-specific column mappings', { filePath: validatedPath });
    saveFileColumnMappings(validatedPath, validated);
    return { success: true };
  } catch (err) {
    logger.logError('[Preferences] Error saving file-specific column mappings', err);
    return createErrorResponse(err, 'handleSaveFileColumnMappings');
  }
}

/**
 * Get combined column mappings (file-specific if exists, otherwise global)
 * IPC Handler: 'preferences-store:get-combined-column-mappings'
 */
async function handleGetCombinedColumnMappings(event, filePath) {
  try {
    const validatedPath = filePath ? validateString(filePath, 'filePath', { required: true, minLength: 1 }) : null;
    logger.logDebug('[Preferences] Getting combined column mappings', { filePath: validatedPath });
    const mappings = getCombinedColumnMappings(validatedPath);
    return {
      success: true,
      data: mappings
    };
  } catch (err) {
    logger.logError('[Preferences] Error getting combined column mappings', err);
    return {
      ...createErrorResponse(err, 'handleGetCombinedColumnMappings'),
      data: { preferredColumns: [] }
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
  handleResetColumnMappings,
  // File-specific column mapping handlers
  handleGetFileColumnMappings,
  handleSaveFileColumnMappings,
  handleGetCombinedColumnMappings
};
