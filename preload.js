const { contextBridge, ipcRenderer, shell } = require('electron');

/**
 * Preload script to safely expose IPC functions to the renderer process
 * This provides secure access to file operations, Excel processing, and external APIs
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  file: {
    openDialog: () => ipcRenderer.invoke('file:open-dialog'),
    saveDialog: (defaultPath) => ipcRenderer.invoke('file:save-dialog', defaultPath),
    checkFileExists: (filePath) => ipcRenderer.invoke('file:check-file-exists', filePath)
  },

  // Excel operations
  excel: {
    readFile: (filePath) => ipcRenderer.invoke('excel:read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('excel:write-file', { filePath, data }),
    getMetadata: (filePath) => ipcRenderer.invoke('excel:get-metadata', filePath),
    saveMetadata: (filePath, metadata) => ipcRenderer.invoke('excel:save-metadata', { filePath, metadata }),
    // SQLite-based pagination and sheet operations
    querySheet: (filePath, sheetName, offset, limit) => ipcRenderer.invoke('excel:query-sheet', { filePath, sheetName, offset, limit }),
    updateRow: (filePath, sheetName, rowId, updates) => ipcRenderer.invoke('excel:update-row', { filePath, sheetName, rowId, updates }),
    getSheetList: (filePath) => ipcRenderer.invoke('excel:get-sheet-list', filePath),
    closeFile: (filePath) => ipcRenderer.invoke('excel:close-file', filePath),
    rescanUnits: (filePath) => ipcRenderer.invoke('excel:rescan-units', filePath),
    getFileStats: (filePath) => ipcRenderer.invoke('excel:get-file-stats', filePath)
  },

  // External API calls (for zzTakeoff integration)
  external: {
    sendToZzTakeoff: (data) => ipcRenderer.invoke('external:send-to-zztakeoff', data),
    getZzTakeoffProjects: (data) => ipcRenderer.invoke('external:get-zztakeoff-projects', data),
    getZzTakeoffTakeoffTypes: (data) => ipcRenderer.invoke('external:get-zztakeoff-takeoff-types', data),
    getZzTakeoffCostTypes: (data) => ipcRenderer.invoke('external:get-zztakeoff-cost-types', data),
    httpRequest: (config) => ipcRenderer.invoke('external:http-request', config)
  },

  // Send History (electron-store persistent storage)
  sendHistory: {
    add: (sendData) => ipcRenderer.invoke('send-history:add', sendData),
    getList: (params) => ipcRenderer.invoke('send-history:get-list', params),
    getById: (id) => ipcRenderer.invoke('send-history:get-by-id', { id }),
    clear: () => ipcRenderer.invoke('send-history:clear'),
    delete: (id) => ipcRenderer.invoke('send-history:delete', { id }),
    getStats: () => ipcRenderer.invoke('send-history:get-stats')
  },

  // Preferences Store (electron-store persistent storage)
  preferencesStore: {
    get: () => ipcRenderer.invoke('preferences-store:get'),
    save: (preferences) => ipcRenderer.invoke('preferences-store:save', preferences),
    reset: () => ipcRenderer.invoke('preferences-store:reset'),
    update: (key, value) => ipcRenderer.invoke('preferences-store:update', { key, value }),
    getDefaults: () => ipcRenderer.invoke('preferences-store:get-defaults'),
    // Unit Mappings
    saveUnitMapping: (unit, zzType, active) => ipcRenderer.invoke('preferences-store:save-unit-mapping', { unit, zzType, active }),
    deleteUnitMapping: (unit) => ipcRenderer.invoke('preferences-store:delete-unit-mapping', unit),
    getUnitMappings: () => ipcRenderer.invoke('preferences-store:get-unit-mappings'),
    // Discovered Units
    getDiscoveredUnits: () => ipcRenderer.invoke('preferences-store:get-discovered-units'),
    removeDiscoveredUnit: (unit) => ipcRenderer.invoke('preferences-store:remove-discovered-unit', unit),
    // File-Specific Unit Mappings
    saveFileUnitMappings: (filePath, mappings) => ipcRenderer.invoke('preferences-store:save-file-unit-mappings', { filePath, mappings }),
    getFileUnitMappings: (filePath) => ipcRenderer.invoke('preferences-store:get-file-unit-mappings', filePath),
    getCombinedUnitMappings: (filePath) => ipcRenderer.invoke('preferences-store:get-combined-unit-mappings', filePath),
    addFileUnitMapping: (filePath, unit, zzType, active) => ipcRenderer.invoke('preferences-store:add-file-unit-mapping', { filePath, unit, zzType, active }),
    // Column Mappings
    getColumnMappings: () => ipcRenderer.invoke('preferences-store:get-column-mappings'),
    saveColumnMappings: (columnMappings) => ipcRenderer.invoke('preferences-store:save-column-mappings', columnMappings),
    updatePreferredColumn: (columnId, updates) => ipcRenderer.invoke('preferences-store:update-preferred-column', { columnId, updates }),
    addCustomColumn: (label, excelColumn) => ipcRenderer.invoke('preferences-store:add-custom-column', { label, excelColumn }),
    deleteCustomColumn: (columnId) => ipcRenderer.invoke('preferences-store:delete-custom-column', columnId),
    reorderColumns: (columnIds) => ipcRenderer.invoke('preferences-store:reorder-columns', columnIds),
    resetColumnMappings: () => ipcRenderer.invoke('preferences-store:reset-column-mappings'),
    // Discovered Columns
    getDiscoveredColumns: () => ipcRenderer.invoke('preferences-store:get-discovered-columns'),
    removeDiscoveredColumn: (columnName) => ipcRenderer.invoke('preferences-store:remove-discovered-column', columnName),
    clearDiscoveredColumns: () => ipcRenderer.invoke('preferences-store:clear-discovered-columns'),
    // File-Specific Column Mappings
    getFileColumnMappings: (filePath) => ipcRenderer.invoke('preferences-store:get-file-column-mappings', filePath),
    saveFileColumnMappings: (filePath, columnMappings) => ipcRenderer.invoke('preferences-store:save-file-column-mappings', { filePath, columnMappings }),
    getCombinedColumnMappings: (filePath) => ipcRenderer.invoke('preferences-store:get-combined-column-mappings', filePath)
  },

  // Recents Store (electron-store persistent storage for recent files)
  recentsStore: {
    getAll: (params) => ipcRenderer.invoke('recents-store:get-list', params),
    getList: (params) => ipcRenderer.invoke('recents-store:get-list', params),
    add: (item) => ipcRenderer.invoke('recents-store:add', item),
    update: (updateData) => ipcRenderer.invoke('recents-store:update', updateData),
    remove: (filePath) => ipcRenderer.invoke('recents-store:remove', filePath),
    clear: () => ipcRenderer.invoke('recents-store:clear')
  },

  // Templates Store (electron-store persistent storage for templates)
  templatesStore: {
    getList: (params) => ipcRenderer.invoke('templates-store:get-list', params),
    get: (templateId) => ipcRenderer.invoke('templates-store:get', templateId),
    save: (template) => ipcRenderer.invoke('templates-store:save', template),
    delete: (templateId) => ipcRenderer.invoke('templates-store:delete', templateId),
    clear: () => ipcRenderer.invoke('templates-store:clear')
  },

  // BrowserView for zzTakeoff Webview
  webview: {
    create: (url, bounds) => ipcRenderer.invoke('webview:create', url, bounds),
    navigate: (url) => ipcRenderer.invoke('webview:navigate', url),
    reload: () => ipcRenderer.invoke('webview:reload'),
    destroy: () => ipcRenderer.invoke('webview:destroy'),
    setBounds: (bounds) => ipcRenderer.invoke('webview:set-bounds', bounds),
    goBack: () => ipcRenderer.invoke('webview:go-back'),
    goForward: () => ipcRenderer.invoke('webview:go-forward'),
    findInPage: (text, options) => ipcRenderer.invoke('webview:find-in-page', text, options),
    stopFindInPage: (action) => ipcRenderer.invoke('webview:stop-find-in-page', action),
    executeJavaScript: (code) => ipcRenderer.invoke('webview:execute-javascript', code),
    // Event listeners for webview events
    onLoading: (callback) => ipcRenderer.on('webview:loading', (event, isLoading) => callback(isLoading)),
    onUrlChanged: (callback) => ipcRenderer.on('webview:url-changed', (event, url) => callback(url)),
    onLoadError: (callback) => ipcRenderer.on('webview:load-error', (event, error) => callback(error)),
    onFoundInPage: (callback) => ipcRenderer.on('webview:found-in-page', (event, result) => callback(result))
  },

  // Event listeners
  onShowHelp: (callback) => ipcRenderer.on('show-help', callback),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', (event, path) => callback(path)),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu:open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu:save-file', callback),
  onMenuSaveFileAs: (callback) => ipcRenderer.on('menu:save-file-as', callback),
  onMenuCloseFile: (callback) => ipcRenderer.on('menu:close-file', callback),
  onMenuOpenRecentFile: (callback) => ipcRenderer.on('menu:open-recent-file', (event, filePath) => callback(filePath)),

  // Menu update
  updateMenu: () => ipcRenderer.invoke('menu:update'),

  // Shell operations
  shell: {
    openPath: (path) => shell.openPath(path)
  }
});
