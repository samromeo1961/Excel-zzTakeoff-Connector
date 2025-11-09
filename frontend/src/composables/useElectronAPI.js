/**
 * Vue composable for accessing Electron IPC API
 * This wraps window.electronAPI exposed by preload.js
 */

export default function useElectronAPI() {
  // Check if running in Electron environment
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  if (!isElectron) {
    console.warn('Electron API not available - running in browser mode');
  }

  return {
    // File operations
    file: {
      openDialog: () => window.electronAPI?.file.openDialog(),
      saveDialog: (defaultPath) => window.electronAPI?.file.saveDialog(defaultPath),
      checkFileExists: (filePath) => window.electronAPI?.file.checkFileExists(filePath)
    },

    // Excel operations
    excel: {
      readFile: (filePath) => window.electronAPI?.excel.readFile(filePath),
      writeFile: (filePath, data) => window.electronAPI?.excel.writeFile(filePath, data),
      getMetadata: (filePath) => window.electronAPI?.excel.getMetadata(filePath),
      saveMetadata: (filePath, metadata) => window.electronAPI?.excel.saveMetadata(filePath, metadata),
      // SQLite-based pagination and sheet operations
      querySheet: (filePath, sheetName, offset, limit) => window.electronAPI?.excel.querySheet(filePath, sheetName, offset, limit),
      updateRow: (filePath, sheetName, rowId, updates) => window.electronAPI?.excel.updateRow(filePath, sheetName, rowId, updates),
      getSheetList: (filePath) => window.electronAPI?.excel.getSheetList(filePath),
      closeFile: (filePath) => window.electronAPI?.excel.closeFile(filePath),
      rescanUnits: (filePath) => window.electronAPI?.excel.rescanUnits(filePath)
    },
    // Database operations
    db: {
      testConnection: (dbConfig) => window.electronAPI?.db.testConnection(dbConfig),
      saveConnection: (dbConfig) => window.electronAPI?.db.saveConnection(dbConfig),
      getSavedConnection: () => window.electronAPI?.db.getSavedConnection(),
      clearSavedConnection: () => window.electronAPI?.db.clearSavedConnection()
    },

    // Catalogue
    catalogue: {
      getItems: (params) => window.electronAPI?.catalogue.getItems(params),
      getItem: (priceCode) => window.electronAPI?.catalogue.getItem(priceCode),
      archiveItem: (params) => window.electronAPI?.catalogue.archiveItem(params),
      updateField: (params) => window.electronAPI?.catalogue.updateField(params),
      updatePrice: (params) => window.electronAPI?.catalogue.updatePrice(params)
    },

    // Recipes
    recipes: {
      getList: (params) => window.electronAPI?.recipes.getList(params),
      getSubItems: (priceCode) => window.electronAPI?.recipes.getSubItems(priceCode),
      getRecipe: (priceCode) => window.electronAPI?.recipes.getRecipe(priceCode),
      getCostCentres: (params) => window.electronAPI?.recipes.getCostCentres(params),
      updateRecipe: (params) => window.electronAPI?.recipes.updateRecipe(params)
    },

    // Suppliers
    suppliers: {
      getGroups: (params) => window.electronAPI?.suppliers.getGroups(params),
      getList: (params) => window.electronAPI?.suppliers.getList(params),
      archive: (params) => window.electronAPI?.suppliers.archive(params),
      updateGroup: (params) => window.electronAPI?.suppliers.updateGroup(params)
    },

    // Preferences
    preferences: {
      getDatabases: (params) => window.electronAPI?.preferences.getDatabases(params),
      getUnits: (params) => window.electronAPI?.preferences.getUnits(params),
      getCostCentreBanks: (params) => window.electronAPI?.preferences.getCostCentreBanks(params),
      getPriceLevels: (params) => window.electronAPI?.preferences.getPriceLevels(params),
      getSupplierGroups: (params) => window.electronAPI?.preferences.getSupplierGroups(params),
      testConnection: (params) => window.electronAPI?.preferences.testConnection(params),
      switchDatabase: (params) => window.electronAPI?.preferences.switchDatabase(params)
    },

    // Cost Centres
    costCentres: {
      getList: (params) => window.electronAPI?.costCentres.getList(params),
      getItem: (code) => window.electronAPI?.costCentres.getItem(code)
    },

    // Contacts
    contacts: {
      getGroups: (params) => window.electronAPI?.contacts.getGroups(params),
      getList: (params) => window.electronAPI?.contacts.getList(params),
      create: (contactData) => window.electronAPI?.contacts.create(contactData),
      update: (data) => window.electronAPI?.contacts.update(data)
    },

    // External API (zzTakeoff integration)
    external: {
      sendToZzTakeoff: (data) => window.electronAPI?.external.sendToZzTakeoff(data),
      getZzTakeoffProjects: (data) => window.electronAPI?.external.getZzTakeoffProjects(data),
      getZzTakeoffTakeoffTypes: (data) => window.electronAPI?.external.getZzTakeoffTakeoffTypes(data),
      getZzTakeoffCostTypes: (data) => window.electronAPI?.external.getZzTakeoffCostTypes(data),
      httpRequest: (config) => window.electronAPI?.external.httpRequest(config)
    },

    // Send History (electron-store persistence)
    sendHistory: {
      add: (sendData) => window.electronAPI?.sendHistory.add(sendData),
      getList: (params) => window.electronAPI?.sendHistory.getList(params),
      getById: (id) => window.electronAPI?.sendHistory.getById(id),
      clear: () => window.electronAPI?.sendHistory.clear(),
      delete: (id) => window.electronAPI?.sendHistory.delete(id),
      getStats: () => window.electronAPI?.sendHistory.getStats()
    },

    // Preferences Store (electron-store persistence)
    preferencesStore: {
      get: () => window.electronAPI?.preferencesStore.get(),
      save: (preferences) => window.electronAPI?.preferencesStore.save(preferences),
      reset: () => window.electronAPI?.preferencesStore.reset(),
      update: (key, value) => window.electronAPI?.preferencesStore.update(key, value),
      getDefaults: () => window.electronAPI?.preferencesStore.getDefaults(),
      // Unit Mappings
      saveUnitMapping: (unit, zzType, active) => window.electronAPI?.preferencesStore.saveUnitMapping(unit, zzType, active),
      deleteUnitMapping: (unit) => window.electronAPI?.preferencesStore.deleteUnitMapping(unit),
      getUnitMappings: () => window.electronAPI?.preferencesStore.getUnitMappings(),
      // Discovered Units
      getDiscoveredUnits: () => window.electronAPI?.preferencesStore.getDiscoveredUnits(),
      removeDiscoveredUnit: (unit) => window.electronAPI?.preferencesStore.removeDiscoveredUnit(unit),
      // File-Specific Unit Mappings
      saveFileUnitMappings: (filePath, mappings) => window.electronAPI?.preferencesStore.saveFileUnitMappings(filePath, mappings),
      getFileUnitMappings: (filePath) => window.electronAPI?.preferencesStore.getFileUnitMappings(filePath),
      getCombinedUnitMappings: (filePath) => window.electronAPI?.preferencesStore.getCombinedUnitMappings(filePath),
      addFileUnitMapping: (filePath, unit, zzType, active) => window.electronAPI?.preferencesStore.addFileUnitMapping(filePath, unit, zzType, active),
      // Column Mappings
      getColumnMappings: () => window.electronAPI?.preferencesStore.getColumnMappings(),
      saveColumnMappings: (columnMappings) => window.electronAPI?.preferencesStore.saveColumnMappings(columnMappings),
      updatePreferredColumn: (columnId, updates) => window.electronAPI?.preferencesStore.updatePreferredColumn(columnId, updates),
      addCustomColumn: (label, excelColumn) => window.electronAPI?.preferencesStore.addCustomColumn(label, excelColumn),
      deleteCustomColumn: (columnId) => window.electronAPI?.preferencesStore.deleteCustomColumn(columnId),
      reorderColumns: (columnIds) => window.electronAPI?.preferencesStore.reorderColumns(columnIds),
      resetColumnMappings: () => window.electronAPI?.preferencesStore.resetColumnMappings(),
      // Discovered Columns
      getDiscoveredColumns: () => window.electronAPI?.preferencesStore.getDiscoveredColumns(),
      removeDiscoveredColumn: (columnName) => window.electronAPI?.preferencesStore.removeDiscoveredColumn(columnName),
      clearDiscoveredColumns: () => window.electronAPI?.preferencesStore.clearDiscoveredColumns(),
      // File-Specific Column Mappings
      getFileColumnMappings: (filePath) => window.electronAPI?.preferencesStore.getFileColumnMappings(filePath),
      saveFileColumnMappings: (filePath, columnMappings) => window.electronAPI?.preferencesStore.saveFileColumnMappings(filePath, columnMappings),
      getCombinedColumnMappings: (filePath) => window.electronAPI?.preferencesStore.getCombinedColumnMappings(filePath)
    },

    // Templates (database operations)
    templates: {
      updatePrices: (templateId, data) => window.electronAPI?.templates.updatePrices(templateId, data)
    },

    // Templates Store (electron-store persistence)
    templatesStore: {
      getList: (params) => window.electronAPI?.templatesStore.getList(params),
      get: (templateId) => window.electronAPI?.templatesStore.get(templateId),
      save: (template) => window.electronAPI?.templatesStore.save(template),
      delete: (templateId) => window.electronAPI?.templatesStore.delete(templateId),
      clear: () => window.electronAPI?.templatesStore.clear()
    },

    // Favourites Store (electron-store persistence)
    favouritesStore: {
      getList: (params) => window.electronAPI?.favouritesStore.getList(params),
      add: (item) => window.electronAPI?.favouritesStore.add(item),
      remove: (priceCode) => window.electronAPI?.favouritesStore.remove(priceCode),
      check: (priceCode) => window.electronAPI?.favouritesStore.check(priceCode),
      update: (updateData) => window.electronAPI?.favouritesStore.update(updateData),
      clear: () => window.electronAPI?.favouritesStore.clear()
    },

    // Recents Store (electron-store persistence)
    recentsStore: {
      getAll: (params) => window.electronAPI?.recentsStore.getAll(params),
      getList: (params) => window.electronAPI?.recentsStore.getList(params),
      add: (item) => window.electronAPI?.recentsStore.add(item),
      update: (updateData) => window.electronAPI?.recentsStore.update(updateData),
      remove: (filePath) => window.electronAPI?.recentsStore.remove(filePath),
      clear: () => window.electronAPI?.recentsStore.clear()
    },

    // Column States (electron-store persistence)
    columnStates: {
      get: (tabName) => window.electronAPI?.columnStates.get(tabName),
      save: (data) => window.electronAPI?.columnStates.save(data),
      delete: (tabName) => window.electronAPI?.columnStates.delete(tabName),
      getAll: () => window.electronAPI?.columnStates.getAll(),
      clearAll: () => window.electronAPI?.columnStates.clearAll()
    },

    // Filter States (electron-store persistence)
    filterState: {
      get: (tabName) => window.electronAPI?.filterState?.get(tabName),
      save: (data) => window.electronAPI?.filterState?.save(data),
      delete: (tabName) => window.electronAPI?.filterState?.delete(tabName),
      getAll: () => window.electronAPI?.filterState?.getAll(),
      clearAll: () => window.electronAPI?.filterState?.clearAll()
    },

    // zzType Store (electron-store persistence for item-specific zzType overrides)
    zzTypeStore: {
      get: (priceCode) => window.electronAPI?.zzTypeStore.get(priceCode),
      set: (priceCode, zzType) => window.electronAPI?.zzTypeStore.set(priceCode, zzType),
      getAll: () => window.electronAPI?.zzTypeStore.getAll(),
      delete: (priceCode) => window.electronAPI?.zzTypeStore.delete(priceCode)
    },

    // BrowserView for zzTakeoff Webview
    webview: {
      create: (url, bounds) => window.electronAPI?.webview.create(url, bounds),
      navigate: (url) => window.electronAPI?.webview.navigate(url),
      reload: () => window.electronAPI?.webview.reload(),
      destroy: () => window.electronAPI?.webview.destroy(),
      setBounds: (bounds) => window.electronAPI?.webview.setBounds(bounds),
      goBack: () => window.electronAPI?.webview.goBack(),
      goForward: () => window.electronAPI?.webview.goForward(),
      findInPage: (text, options) => window.electronAPI?.webview.findInPage(text, options),
      stopFindInPage: (action) => window.electronAPI?.webview.stopFindInPage(action),
      executeJavaScript: (code) => window.electronAPI?.webview.executeJavaScript(code),
      onLoading: (callback) => window.electronAPI?.webview.onLoading(callback),
      onUrlChanged: (callback) => window.electronAPI?.webview.onUrlChanged(callback),
      onLoadError: (callback) => window.electronAPI?.webview.onLoadError(callback),
      onFoundInPage: (callback) => window.electronAPI?.webview.onFoundInPage(callback)
    },

    // Event listeners
    onShowHelp: (callback) => window.electronAPI?.onShowHelp(callback),
    onNavigateTo: (callback) => window.electronAPI?.onNavigateTo(callback),
    onMenuOpenFile: (callback) => window.electronAPI?.onMenuOpenFile(callback),
    onMenuSaveFile: (callback) => window.electronAPI?.onMenuSaveFile(callback),
    onMenuSaveFileAs: (callback) => window.electronAPI?.onMenuSaveFileAs(callback),
    onMenuCloseFile: (callback) => window.electronAPI?.onMenuCloseFile(callback),
    onMenuOpenRecentFile: (callback) => window.electronAPI?.onMenuOpenRecentFile(callback),

    // Menu
    updateMenu: () => window.electronAPI?.updateMenu(),

    // Utility
    isElectron
  };
}
