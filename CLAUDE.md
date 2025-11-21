# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XLx Connector is an Electron desktop application that opens Excel spreadsheets and adds construction takeoff capabilities. It provides a modern Vue.js + AG Grid interface for viewing and editing Excel files, with integration to zzTakeoff external API for construction estimating.

**Tech Stack:**
- **Backend:** Electron (Node.js) with SheetJS (xlsx) for Excel file handling
- **Frontend:** Vue 3 (Composition API), Vue Router, Vite dev server
- **UI:** Bootstrap 5, AG Grid Community, Bootstrap Icons
- **IPC:** Electron contextBridge/ipcRenderer for secure renderer-main communication
- **Persistence:** electron-store for local settings

## Development Commands

```bash
npm run dev              # ONE-COMMAND: Starts both Vite dev server AND Electron app
npm run dev:frontend     # Start frontend Vite dev server only (port 5185)
npm run dev:electron     # Start Electron only (waits for Vite to be ready)
npm run dev:chrome       # Start with Chrome remote debugging on port 9222 for MCP
npm run build            # Build frontend + create Windows installer
npm run build-frontend   # Build frontend only (to frontend/dist)
npm run dist             # Electron builder package for Windows
```

**Development vs Production:**
- **Dev:** Loads from Vite dev server at `http://localhost:5185` (configured in main.js:242)
- **Production:** Loads from `frontend/dist/index.html` after build

**How it works:**
- `npm run dev` uses `concurrently` to run both processes simultaneously
- `wait-on` ensures Electron waits for Vite dev server to be ready before starting
- Color-coded output: Cyan for VITE, Magenta for ELECTRON

## Architecture

### Electron Main Process (Backend)

**Entry Point:** `main.js`

The main process manages Excel file operations, IPC handlers, application menu/shortcuts, and BrowserView for zzTakeoff web integration. On startup, it registers all IPC handlers from `src/ipc-handlers/` and loads the Vue app from either Vite dev server or production build.

### IPC Architecture (Backend ↔ Frontend Communication)

**Three-layer pattern:**

1. **preload.js** - Secure bridge via contextBridge
   - Exposes `window.electronAPI` to renderer
   - Each domain (file, excel, external, etc.) is a nested object
   - Maps frontend calls to IPC channels

2. **src/ipc-handlers/** - Business logic layer
   - Each file handles one domain (excel.js, external-api.js, etc.)
   - Excel operations via `src/excel/processor.js`
   - Returns structured responses: `{ success: true/false, data/message }`

3. **frontend/src/composables/useElectronAPI.js** - Vue composable
   - **IMPORTANT:** Exported as DEFAULT export (not named export)
   - Wraps `window.electronAPI` for Vue components
   - Provides type safety and fallback for browser mode
   - Used throughout Vue components as `const api = useElectronAPI()`

**Adding New IPC Endpoints:**
1. Create/update handler in `src/ipc-handlers/[domain].js`
2. Register in `main.js`: `ipcMain.handle('domain:action', handler.function)`
3. Expose in `preload.js`: Add to appropriate domain object
4. Add to `useElectronAPI.js` composable for Vue access

### Frontend Architecture (Vue 3)

**Entry Point:** `frontend/src/main.js`

Vue Router with 5 tab-based routes: Excel Grid (AG Grid spreadsheet), Recent Files, Send History, zzTakeoff Web (BrowserView), and Preferences. The root `App.vue` provides tab navigation and theme management.

**CRITICAL:** `useElectronAPI.js` uses DEFAULT export:
```javascript
import useElectronAPI from '../../composables/useElectronAPI';  // CORRECT
import { useElectronAPI } from '../../composables/useElectronAPI';  // WRONG
```

### Excel Processing Layer

**src/excel/processor.js** - SheetJS integration with SHA-256 row fingerprinting

Each row receives a `_rowHash` (first 16 chars of SHA-256) for tracking across edits. Metadata (zzType, lastSent, sentCount) is stored in a hidden `_zzTakeoffMetadata` sheet and merged with row data on file open.

**CRITICAL IPC Serialization:** SheetJS worksheet objects contain non-serializable properties (`_worksheet`). Always clean before IPC:
```javascript
const cleanedSheets = sheets.map(sheet => ({
  name: sheet.name,
  headers: sheet.headers,
  data: sheet.data,
  hidden: sheet.hidden
}));
```

### Storage Layer (electron-store)

Three feature stores (`send-history.json`, `preferences.json`, `recents.json`) at `C:\Users\User\AppData\Roaming\excel-zztakeoff-connector\`. Each has a database layer (`src/database/`) and IPC handlers (`src/ipc-handlers/`), accessed via `useElectronAPI()`.

### AG Grid Integration

**ExcelGridTab.vue** - Main spreadsheet with dynamic columns from Excel headers. Custom zzType dropdown editor (area/linear/segment/count) and Actions column with Send button.

**IMPORTANT:** Only import `ag-theme-quartz.css`, NOT `ag-grid.css` (causes theme warning). Switch between `ag-theme-quartz` and `ag-theme-quartz-dark` classes.

### Theme System

Theme managed in `App.vue`, stored in preferences, provided to children via Vue `provide/inject`. Uses `data-theme="light|dark"` attribute on root element.

## Key Technical Patterns

### Excel File Operations
**Read:** File dialog → `api.excel.readFile()` → SheetJS adds row hashes → `api.excel.getMetadata()` → merge metadata → display in AG Grid

**Save:** Collect metadata → `api.excel.saveMetadata()` → `api.excel.writeFile()` with cleaned data (remove `_worksheet` properties)

### External API Integration
All HTTPS calls proxied through main process to avoid CORS. Frontend calls `api.external.sendToZzTakeoff()` or generic `api.external.httpRequest(config)` with axios-compatible config.

### BrowserView Management
ZzTakeoffWebTab creates persistent BrowserView with `partition: 'persist:zztakeoff'` to maintain login sessions. View is hidden (not destroyed) when navigating away to preserve state.

## Important Notes

### Security & Architecture
- Main window: `contextIsolation: true`, `nodeIntegration: false`
- All file operations via IPC only
- IPC uses structured clone (no functions, DOM elements, circular refs)
- SheetJS objects have non-serializable properties - always clean before IPC

### Excel File Handling
- No Excel installation required (SheetJS)
- Supports .xlsx, .xls, .xlsm, .csv
- Hidden metadata sheet: `_zzTakeoffMetadata`
- Row hashes are deterministic (same content = same hash)

### Port Configuration & Conflicts
- **Vite dev server:** port 5185 (configured in vite.config.js)
- **Update main.js:242** if port changes
- **Fix conflicts:** `taskkill /F /IM electron.exe & taskkill /F /IM node.exe`, then restart

### Keyboard Shortcuts
- Ctrl+1-5: Navigate tabs (Excel, Recents, History, zzTakeoff Web, Preferences)
- Ctrl+O: Open file, Ctrl+S: Save, Ctrl+Shift+S: Save As
- F12: DevTools, F1: Help

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "An object could not be cloned" on save | Clean data before IPC (remove `_worksheet` refs) |
| Import error: "does not provide an export named 'useElectronAPI'" | Use default import: `import useElectronAPI from '...'` |
| AG Grid theme warning | Remove `ag-grid.css`, use only `ag-theme-quartz.css` |
| Port conflicts | `taskkill /F /IM electron.exe & taskkill /F /IM node.exe`, update main.js:242 |

**Useful Debug Commands:**
```bash
netstat -ano | findstr :5185                                    # View port usage
dir "C:\Users\User\AppData\Roaming\excel-zztakeoff-connector"  # Check store files
```

## Cross-Platform Build Targets

The application is configured for Windows, macOS, and Linux via electron-builder:
- **Windows:** NSIS installer (x64)
- **macOS:** DMG and ZIP (universal)
- **Linux:** AppImage and DEB

## Application Behavior

- **Tab Persistence:** Excel files remain in memory when navigating between tabs (not saved to disk until explicit save)
- **Unsaved Changes:** User is prompted to save before closing the application
- **Recent Files:** Files appear in recents upon opening, available on next app launch