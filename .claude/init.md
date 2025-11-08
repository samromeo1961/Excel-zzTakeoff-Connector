# ELx Connector - Session Initialization

## Quick Start Commands

### Start Development with Chrome DevTools MCP
```bash
npm run dev:chrome
```
This command:
1. Launches Chrome with remote debugging on port 9222
2. Waits 2 seconds
3. Starts the Electron app in dev mode
4. Enables Claude Code to connect via Chrome DevTools MCP for live debugging

### Start Development (Standard)
```bash
# Terminal 1 - Start frontend dev server
cd frontend
npm run dev

# Terminal 2 - Start Electron app
npm run dev
```

### Frontend Only
```bash
cd frontend
npm run dev
```

## Current Project Status

### Working Features ✅
- Excel file reading/writing with SheetJS (.xlsx, .xls, .csv)
- AG Grid data display with editable cells
- Hash-based row tracking using SHA-256
- Hidden metadata sheet (_zzTakeoffMetadata) for persistence
- zzType dropdown column with measurement types: area, linear, segment, count
- Actions column with "Send to zzTakeoff" button
- Dark mode with proper tab visibility
- File operations: Open, Save, Save As
- Recent files tracking
- Preferences storage

### Recent Fixes (2025-11-07)
1. ✅ Fixed save file cloning error - removed non-serializable _worksheet references
2. ✅ Fixed ZzTakeoffWebTab import error - changed to default import
3. ✅ Fixed dark mode tab visibility - inactive tabs now visible with #b0b0b0 color
4. ✅ Fixed AG Grid theme warning - removed legacy ag-grid.css import
5. ✅ Updated zzType options to: area, linear, segment, count (all lowercase)
6. ✅ Renamed application to "ELx Connector"

### Port Configuration
- **Frontend Vite Dev Server**: Port 5181 (configured), currently on 5185 due to conflicts
- **Chrome Remote Debugging**: Port 9222
- **Main Process**: Configured to connect to frontend port

### Known Issues / TODO
- Multiple background processes causing port conflicts (need to kill node/electron processes before starting)
- ZzTakeoffWebTab BrowserView integration needs testing
- Send to zzTakeoff API integration not yet implemented
- Preferences modal/tab needs completion

## Project Architecture

### Tech Stack
- **Backend**: Electron (Node.js) with SheetJS (xlsx)
- **Frontend**: Vue 3 (Composition API), Vue Router, Vite
- **UI**: Bootstrap 5, AG Grid Community, Bootstrap Icons
- **Storage**: electron-store for local settings

### Key Files
- `main.js` - Electron main process, IPC handlers registration
- `preload.js` - IPC bridge via contextBridge
- `src/excel/processor.js` - SheetJS integration with hash-based row tracking
- `src/ipc-handlers/excel.js` - Excel file operations
- `frontend/src/components/Excel/ExcelGridTab.vue` - Main grid component
- `frontend/src/App.vue` - Root layout with tabs
- `frontend/src/router/index.js` - 5 routes: excel, recents, history, zztakeoff-web, preferences

### Tabs
1. **Excel Grid** - Main spreadsheet view with AG Grid
2. **Recent Files** - Recently opened files
3. **Send History** - History of items sent to zzTakeoff
4. **zzTakeoff Web** - Embedded web view for zzTakeoff.com
5. **Preferences** - Application settings

### IPC Architecture
Three-layer pattern:
1. `preload.js` - Exposes electronAPI via contextBridge
2. `src/ipc-handlers/*.js` - Business logic handlers
3. `frontend/src/composables/useElectronAPI.js` - Vue composable (default export)

### Excel Processing
- Uses SheetJS to read/write Excel files
- Creates SHA-256 hash fingerprints for each row (first 16 chars)
- Stores zzType metadata in hidden sheet `_zzTakeoffMetadata`
- Supports .xlsx, .xls, .xlsm, .csv formats

## Development Notes

### Starting Fresh Session
1. Kill all node/electron processes:
   ```bash
   cmd /c "taskkill /F /IM electron.exe 2>nul & taskkill /F /IM node.exe 2>nul"
   ```

2. Start frontend dev server:
   ```bash
   cd frontend && npm run dev
   ```

3. Start Electron app:
   ```bash
   npm run dev
   ```

### Chrome DevTools MCP
When using `npm run dev:chrome`, Claude Code can:
- Inspect pages and take snapshots
- Run JavaScript in the context
- Monitor network requests
- View console messages
- Take screenshots

### AG Grid Integration
- Column definitions built dynamically from Excel headers
- Custom zzType cell editor (dropdown)
- Custom Actions cell renderer (Send button)
- Theme: ag-theme-quartz / ag-theme-quartz-dark
- Pagination: 50 items per page (20, 50, 100, 200 options)

### Dark Mode
- Managed in App.vue with CSS custom properties
- Theme state stored in preferences
- Provided to child components via Vue provide/inject
- Toggle button in app header

## Next Steps / Roadmap
1. Complete zzTakeoff Web tab BrowserView integration
2. Implement actual "Send to zzTakeoff" API integration
3. Add SendToZzTakeoffModal component
4. Complete Preferences tab
5. Add column management (show/hide, reorder, rename)
6. Add filtering and search capabilities
7. Add export functionality
8. Build installer for production

## Useful Commands

### Build Application
```bash
npm run build          # Build frontend + create installer
npm run build-frontend # Build frontend only
npm run dist           # Electron builder package
```

### Development Tools
```bash
F12                    # Open DevTools in Electron app
Ctrl+R                 # Reload Electron window
Ctrl+O                 # Open Excel file
Ctrl+S                 # Save file
Ctrl+Shift+S           # Save As
F1                     # Show help
```

## File Locations

### Configuration
- `package.json` - Main project config, productName: "ELx Connector"
- `frontend/package.json` - Frontend dependencies
- `frontend/vite.config.js` - Vite config, port 5181
- `.claude/settings.local.json` - MCP server configs

### Storage
- `C:\Users\User\AppData\Roaming\excel-zztakeoff-connector\` - User data
  - `config.json` - App config (not used yet)
  - `send-history.json` - Send history
  - `recents.json` - Recent files
  - `preferences.json` - User preferences

## Session Summary

This is the **Excel-zzTakeoff-Connector** (branded as **ELx Connector**) project. It's an Electron desktop application that:

1. Opens Excel files using SheetJS (no Excel installation required)
2. Displays data in AG Grid with full editing capabilities
3. Adds a zzType column for categorizing rows (area, linear, segment, count)
4. Adds an Actions column with "Send to zzTakeoff" button
5. Persists zzType metadata in a hidden Excel sheet using row hash fingerprints
6. Integrates with zzTakeoff web interface via BrowserView

The app was recently set up and debugged, with fixes for save file errors, import errors, dark mode visibility, and AG Grid theme warnings. The zzType options were just updated to use measurement types instead of construction categories.

**Current State**: Fully functional for opening/editing Excel files with zzType categorization. Ready for zzTakeoff API integration and additional features.
