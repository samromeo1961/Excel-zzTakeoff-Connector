const { app, BrowserWindow, BrowserView, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const packageJson = require('./package.json');

// ============================================================
// Electron Configuration & Diagnostics
// ============================================================

// Disable hardware acceleration to fix GPU/rendering issues
app.disableHardwareAcceleration();

// Disable disk cache to fix Windows permissions errors
app.commandLine.appendSwitch('disk-cache-size', '0');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Enable verbose logging for diagnostics (production & development)
app.commandLine.appendSwitch('enable-logging');
app.commandLine.appendSwitch('v', '1'); // Verbose level 1

console.log('============================================================');
console.log('ELECTRON DIAGNOSTICS - STARTUP');
console.log('============================================================');
console.log('Electron Version:', process.versions.electron);
console.log('Chrome Version:', process.versions.chrome);
console.log('Node Version:', process.versions.node);
console.log('App Version:', packageJson.version);
console.log('Is Packaged:', app.isPackaged);
console.log('App Path:', app.getAppPath());
console.log('User Data Path:', app.getPath('userData'));
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('============================================================');

// Import IPC handlers
const excelHandlers = require('./src/ipc-handlers/excel');
const externalApiHandlers = require('./src/ipc-handlers/external-api');
const sendHistoryHandlers = require('./src/ipc-handlers/send-history');
const preferencesStoreHandlers = require('./src/ipc-handlers/preferences-store');
const recentsStoreHandlers = require('./src/ipc-handlers/recents-store');
const templatesStoreHandlers = require('./src/ipc-handlers/templates-store');

// Import recents store for building menu
const { getRecents } = require('./src/database/recents-store');

// Initialize electron-store for persistent settings
const store = new Store();

let mainWindow = null;
let webView = null; // BrowserView for zzTakeoff webview

/**
 * Build recent files submenu
 * @returns {Array} Array of menu items for recent files
 */
function buildRecentFilesMenu() {
  try {
    const recents = getRecents({ limit: 10 });
    const excelFiles = recents.filter(item => item.type === 'excel' && item.filePath);

    if (excelFiles.length === 0) {
      return [
        {
          label: 'No Recent Files',
          enabled: false
        }
      ];
    }

    return excelFiles.map((file, index) => ({
      label: `${file.fileName || path.basename(file.filePath)}`,
      accelerator: index < 9 ? `Ctrl+${index + 1}` : undefined,
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('menu:open-recent-file', file.filePath);
        }
      }
    }));
  } catch (error) {
    console.error('Error building recent files menu:', error);
    return [
      {
        label: 'Error loading recent files',
        enabled: false
      }
    ];
  }
}

/**
 * Update application menu (to refresh recent files)
 */
function updateApplicationMenu() {
  const menuTemplate = buildMenuTemplate();
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

/**
 * Build menu template
 * @returns {Array} Menu template array
 */
function buildMenuTemplate() {
  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Excel File...',
          accelerator: 'Ctrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:open-file');
            }
          }
        },
        {
          label: 'Recent Files',
          submenu: buildRecentFilesMenu()
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'Ctrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:save-file');
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'Ctrl+Shift+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:save-file-as');
            }
          }
        },
        {
          label: 'Close File',
          accelerator: 'Ctrl+W',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:close-file');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Developer Tools (Main Window)',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        },
        {
          label: 'Toggle Developer Tools (BrowserView)',
          accelerator: 'Ctrl+Shift+I',
          click: () => {
            if (webView && webView.webContents) {
              if (webView.webContents.isDevToolsOpened()) {
                webView.webContents.closeDevTools();
              } else {
                webView.webContents.openDevTools({ mode: 'detach' });
              }
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'BrowserView Not Available',
                message: 'BrowserView has not been created yet. Please navigate to the zzTakeoff Web tab first.'
              });
            }
          }
        }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Excel Grid',
          accelerator: 'Ctrl+1',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/');
            }
          }
        },
        {
          label: 'Recent Files',
          accelerator: 'Ctrl+2',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/recent-files');
            }
          }
        },
        {
          label: 'Send History',
          accelerator: 'Ctrl+3',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/send-history');
            }
          }
        },
        {
          label: 'zzTakeoff Web',
          accelerator: 'Ctrl+4',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/zztakeoff-web');
            }
          }
        },
        {
          label: 'Preferences',
          accelerator: 'Ctrl+5',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/preferences');
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Help',
          accelerator: 'F1',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('show-help');
            }
          }
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About XLx Connector for zzTakeoff',
              message: `XLx Connector for zzTakeoff\nVersion ${packageJson.version}\n\nElectron desktop application for construction takeoff integration.`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];
}

/**
 * Create the main application window
 */
function createMainWindow() {
  console.log('🚀 createMainWindow() function called');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'XLx Connector for zzTakeoff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true // Enable <webview> tag for zzTakeoff integration
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Create application menu using the buildMenuTemplate function
  updateApplicationMenu();

  // Load Vue app
  let startUrl;

  console.log('app.isPackaged:', app.isPackaged);
  console.log('__dirname:', __dirname);

  if (!app.isPackaged) {
    // Development mode - Try to find Vite dev server on ports 5185-5200
    const http = require('http');

    const tryPort = async (port) => {
      return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          req.abort();
          resolve(true);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.abort();
          resolve(false);
        });
      });
    };

    const findVitePort = async () => {
      // Try ports in reverse order to skip zombie processes on lower ports
      for (let port = 5200; port >= 5185; port--) {
        const isAvailable = await tryPort(port);
        if (isAvailable) {
          console.log(`Found Vite dev server on port ${port}`);
          return port;
        }
      }
      console.warn('Could not find Vite dev server on ports 5185-5200, defaulting to 5185');
      return 5185;
    };

    findVitePort().then((port) => {
      startUrl = `http://localhost:${port}`;
      console.log('Loading from Vite dev server:', startUrl);
      console.log('Attempting to load URL:', startUrl);
      mainWindow.loadURL(startUrl);
    });
  } else{
    // Production mode - load built files from dist
    startUrl = `file://${path.join(__dirname, 'frontend/dist/index.html')}`;
    console.log('Loading from production build:', startUrl);
    console.log('Attempting to load URL:', startUrl);
    mainWindow.loadURL(startUrl);
  }

  // Maximize the window on startup
  mainWindow.maximize();

  // Log load success/failure
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✓ Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('✗ Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// IPC Handlers for File Operations
// ============================================================

ipcMain.handle('file:open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls', 'xlsm'] },
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePaths[0] };
});

ipcMain.handle('file:save-dialog', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return { success: false, canceled: true };
  }

  return { success: true, filePath: result.filePath };
});

ipcMain.handle('file:check-file-exists', async (event, filePath) => {
  try {
    const fs = require('fs').promises;
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// ============================================================
// IPC Handlers for Excel Operations
// ============================================================

ipcMain.handle('excel:read-file', excelHandlers.readExcelFile);
ipcMain.handle('excel:write-file', excelHandlers.writeExcelFile);
ipcMain.handle('excel:get-metadata', excelHandlers.getMetadata);
ipcMain.handle('excel:save-metadata', excelHandlers.saveMetadata);

// SQLite-based pagination and sheet operations
ipcMain.handle('excel:query-sheet', excelHandlers.querySheetData);
ipcMain.handle('excel:update-row', excelHandlers.updateSheetRow);
ipcMain.handle('excel:get-sheet-list', excelHandlers.getSheetList);
ipcMain.handle('excel:close-file', excelHandlers.closeFile);
ipcMain.handle('excel:rescan-units', excelHandlers.rescanFileForUnits);
ipcMain.handle('excel:get-file-stats', excelHandlers.getFileStats);

// ============================================================
// IPC Handlers for External APIs (zzTakeoff)
// ============================================================

ipcMain.handle('external:send-to-zztakeoff', externalApiHandlers.sendToZzTakeoff);
ipcMain.handle('external:get-zztakeoff-projects', externalApiHandlers.getZzTakeoffProjects);
ipcMain.handle('external:get-zztakeoff-takeoff-types', externalApiHandlers.getZzTakeoffTakeoffTypes);
ipcMain.handle('external:get-zztakeoff-cost-types', externalApiHandlers.getZzTakeoffCostTypes);
ipcMain.handle('external:http-request', externalApiHandlers.makeHttpRequest);

// ============================================================
// IPC Handlers for Send History
// ============================================================

ipcMain.handle('send-history:add', sendHistoryHandlers.handleAddSendHistory);
ipcMain.handle('send-history:get-list', sendHistoryHandlers.handleGetSendHistory);
ipcMain.handle('send-history:get-by-id', sendHistoryHandlers.handleGetSendHistoryById);
ipcMain.handle('send-history:clear', sendHistoryHandlers.handleClearSendHistory);
ipcMain.handle('send-history:delete', sendHistoryHandlers.handleDeleteSendHistory);
ipcMain.handle('send-history:get-stats', sendHistoryHandlers.handleGetSendHistoryStats);

// ============================================================
// IPC Handlers for Preferences Store
// ============================================================

ipcMain.handle('preferences-store:get', preferencesStoreHandlers.handleGetPreferences);
ipcMain.handle('preferences-store:save', preferencesStoreHandlers.handleSavePreferences);
ipcMain.handle('preferences-store:reset', preferencesStoreHandlers.handleResetPreferences);
ipcMain.handle('preferences-store:update', preferencesStoreHandlers.handleUpdatePreference);
ipcMain.handle('preferences-store:get-defaults', preferencesStoreHandlers.handleGetDefaultPreferences);

// Unit Mappings
ipcMain.handle('preferences-store:save-unit-mapping', preferencesStoreHandlers.handleSaveUnitMapping);
ipcMain.handle('preferences-store:delete-unit-mapping', preferencesStoreHandlers.handleDeleteUnitMapping);
ipcMain.handle('preferences-store:get-unit-mappings', preferencesStoreHandlers.handleGetUnitMappings);

// Discovered Units
ipcMain.handle('preferences-store:get-discovered-units', preferencesStoreHandlers.handleGetDiscoveredUnits);
ipcMain.handle('preferences-store:remove-discovered-unit', preferencesStoreHandlers.handleRemoveDiscoveredUnit);

// File-Specific Unit Mappings
ipcMain.handle('preferences-store:save-file-unit-mappings', preferencesStoreHandlers.handleSaveFileUnitMappings);
ipcMain.handle('preferences-store:get-file-unit-mappings', preferencesStoreHandlers.handleGetFileUnitMappings);
ipcMain.handle('preferences-store:get-combined-unit-mappings', preferencesStoreHandlers.handleGetCombinedUnitMappings);
ipcMain.handle('preferences-store:add-file-unit-mapping', preferencesStoreHandlers.handleAddFileUnitMapping);

// Column Mappings
ipcMain.handle('preferences-store:get-column-mappings', preferencesStoreHandlers.handleGetColumnMappings);
ipcMain.handle('preferences-store:save-column-mappings', preferencesStoreHandlers.handleSaveColumnMappings);
ipcMain.handle('preferences-store:update-preferred-column', preferencesStoreHandlers.handleUpdatePreferredColumn);
ipcMain.handle('preferences-store:add-custom-column', preferencesStoreHandlers.handleAddCustomColumn);
ipcMain.handle('preferences-store:delete-custom-column', preferencesStoreHandlers.handleDeleteCustomColumn);
ipcMain.handle('preferences-store:reorder-columns', preferencesStoreHandlers.handleReorderColumns);
ipcMain.handle('preferences-store:reset-column-mappings', preferencesStoreHandlers.handleResetColumnMappings);

// Discovered Columns
ipcMain.handle('preferences-store:get-discovered-columns', preferencesStoreHandlers.handleGetDiscoveredColumns);
ipcMain.handle('preferences-store:remove-discovered-column', preferencesStoreHandlers.handleRemoveDiscoveredColumn);
ipcMain.handle('preferences-store:clear-discovered-columns', preferencesStoreHandlers.handleClearDiscoveredColumns);

// File-Specific Column Mappings
ipcMain.handle('preferences-store:get-file-column-mappings', preferencesStoreHandlers.handleGetFileColumnMappings);
ipcMain.handle('preferences-store:save-file-column-mappings', preferencesStoreHandlers.handleSaveFileColumnMappings);
ipcMain.handle('preferences-store:get-combined-column-mappings', preferencesStoreHandlers.handleGetCombinedColumnMappings);

// ============================================================
// IPC Handlers for Menu
// ============================================================

ipcMain.handle('menu:update', async () => {
  updateApplicationMenu();
  return { success: true };
});

// ============================================================
// IPC Handlers for Recents Store
// ============================================================

ipcMain.handle('recents-store:get-list', recentsStoreHandlers.handleGetRecents);
ipcMain.handle('recents-store:add', recentsStoreHandlers.handleAddToRecents);
ipcMain.handle('recents-store:update', recentsStoreHandlers.handleUpdateRecent);
ipcMain.handle('recents-store:remove', recentsStoreHandlers.handleRemoveRecent);
ipcMain.handle('recents-store:clear', recentsStoreHandlers.handleClearRecents);

// ============================================================
// IPC Handlers for Templates Store
// ============================================================

ipcMain.handle('templates-store:get-list', templatesStoreHandlers.handleGetTemplates);
ipcMain.handle('templates-store:get', templatesStoreHandlers.handleGetTemplate);
ipcMain.handle('templates-store:save', templatesStoreHandlers.handleSaveTemplate);
ipcMain.handle('templates-store:delete', templatesStoreHandlers.handleDeleteTemplate);
ipcMain.handle('templates-store:clear', templatesStoreHandlers.handleClearTemplates);

// ============================================================
// IPC Handlers for BrowserView (zzTakeoff Webview)
// ============================================================

ipcMain.handle('webview:create', async (event, url, bounds) => {
  try {
    if (!mainWindow) {
      return { success: false, message: 'Main window not found' };
    }

    // If BrowserView already exists, just restore it instead of recreating
    if (webView) {
      console.log('BrowserView already exists, restoring...');
      if (mainWindow.getBrowserViews().includes(webView)) {
        mainWindow.removeBrowserView(webView);
      }

      mainWindow.addBrowserView(webView);
      webView.setBounds(bounds);
      webView.setAutoResize({ width: true, height: true });

      const currentURL = webView.webContents.getURL();
      console.log('BrowserView restored, preserving current URL:', currentURL);

      if (!currentURL || currentURL === '' || currentURL === 'about:blank') {
        console.log('BrowserView has no URL, loading:', url);
        await webView.webContents.loadURL(url);
      } else {
        console.log('BrowserView has existing session, keeping current page to preserve login');
        const currentZoom = webView.webContents.getZoomFactor();
        webView.webContents.setZoomFactor(currentZoom);
        webView.webContents.invalidate();
      }

      webView.webContents.focus();
      mainWindow.setTopBrowserView(webView);

      console.log('BrowserView restored with bounds:', bounds);
      return { success: true, url: webView.webContents.getURL(), restored: true };
    }

    // Create new BrowserView with persistent session
    console.log('Creating new BrowserView with persistent session...');

    const browserViewConfig = {
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        partition: 'persist:zztakeoff',
        webSecurity: true,
        enableRemoteModule: false,
        backgroundThrottling: false
      }
    };

    webView = new BrowserView(browserViewConfig);
    webView.setBackgroundColor('#ffffff');

    mainWindow.addBrowserView(webView);
    webView.setBounds(bounds);
    webView.setAutoResize({ width: true, height: true });

    console.log('Loading URL in BrowserView:', url);
    await webView.webContents.loadURL(url);

    webView.webContents.focus();
    mainWindow.setTopBrowserView(webView);

    // Forward lifecycle events
    webView.webContents.on('did-start-loading', () => {
      mainWindow.webContents.send('webview:loading', true);
    });

    webView.webContents.on('did-stop-loading', () => {
      mainWindow.webContents.send('webview:loading', false);
    });

    webView.webContents.on('did-navigate', (event, url) => {
      mainWindow.webContents.send('webview:url-changed', url);
    });

    webView.webContents.on('did-navigate-in-page', (event, url) => {
      mainWindow.webContents.send('webview:url-changed', url);
    });

    webView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      mainWindow.webContents.send('webview:load-error', {
        errorCode,
        errorDescription,
        url: validatedURL
      });
    });

    webView.webContents.on('found-in-page', (event, result) => {
      mainWindow.webContents.send('webview:found-in-page', result);
    });

    console.log('BrowserView created successfully');
    return { success: true, url };
  } catch (error) {
    console.error('Error creating BrowserView:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:navigate', async (event, url) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    await webView.webContents.loadURL(url);
    return { success: true, url };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:reload', async (event) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    webView.webContents.reload();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:destroy', async (event) => {
  try {
    if (webView && mainWindow) {
      console.log('Hiding BrowserView (preserving session)...');
      webView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
      mainWindow.removeBrowserView(webView);
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:set-bounds', async (event, bounds) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    webView.setBounds(bounds);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:go-back', async (event) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    if (webView.webContents.canGoBack()) {
      webView.webContents.goBack();
      return { success: true, canGoBack: true };
    }
    return { success: true, canGoBack: false };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:go-forward', async (event) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    if (webView.webContents.canGoForward()) {
      webView.webContents.goForward();
      return { success: true, canGoForward: true };
    }
    return { success: true, canGoForward: false };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:find-in-page', async (event, text, options) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    const requestId = webView.webContents.findInPage(text, options);
    return { success: true, requestId };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:stop-find-in-page', async (event, action) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    webView.webContents.stopFindInPage(action);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('webview:execute-javascript', async (event, code) => {
  try {
    if (!webView) {
      return { success: false, message: 'Webview not initialized' };
    }
    const result = await webView.webContents.executeJavaScript(code);
    return { success: true, result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ============================================================
// App Lifecycle
// ============================================================

app.whenReady().then(() => {
  console.log('🚀 App ready, starting initialization...');
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('Shutting down gracefully...');
});
