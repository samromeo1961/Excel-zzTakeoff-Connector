# XLx Connector - Release v1.1.0

**Multi-Screen Support Update**

## 📥 Download

Download the installer for Windows:
- [XLx Connector Setup 1.1.0.exe](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/releases/download/v1.1.0/XLx.Connector.Setup.1.1.0.exe)

**Release Date:** November 21, 2025

---

## ✨ What's New in v1.1.0

### Multi-Screen Support

The biggest feature in this release is **multi-screen support** for the zzTakeoff web interface:

- 🖥️ **Separate Window**: zzTakeoff now opens in its own independent window
- 📺 **Dual Monitor Workflow**: Move the zzTakeoff window to a second screen for improved productivity
- 🔄 **Persistent Session**: Login state is maintained when switching between tabs
- 🎯 **Focus Window Button**: Quickly bring the zzTakeoff window to the front

**How it works:**
1. Navigate to the **zzTakeoff Web** tab
2. Click **Login** to open the zzTakeoff interface in a separate window
3. Drag the window to your second monitor
4. Work with Excel data on your main screen while using zzTakeoff on the second screen

### UI Improvements

- 🧹 **Cleaner Interface**: Removed fullscreen buttons from all tabs
- 🎨 **Simplified Toolbar**: Streamlined toolbar design across all tabs
- ✨ **Better Focus**: Less clutter, more focus on your work

---

## 🔧 Technical Changes

### Modified Files
- `main.js` - Replaced BrowserView with BrowserWindow for zzTakeoff
- `ZzTakeoffWebTab.vue` - Updated to manage separate window
- `TabToolbar.vue` - Removed fullscreen button component
- `RecentsTab.vue` - Removed fullscreen button
- `PreferencesTab.vue` - Removed fullscreen button

### Architecture
- Changed from embedded `BrowserView` to standalone `BrowserWindow`
- Added persistent session support (`persist:zztakeoff`)
- Implemented window focus management via IPC

---

## 📋 System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit)
- **Memory:** 4GB RAM minimum, 8GB recommended
- **Storage:** 300 MB free disk space
- **Display:** 1280x720 minimum resolution (dual monitors recommended for multi-screen feature)
- **Internet:** Required for zzTakeoff API integration

---

## 🚀 Installation

### New Installation

1. **Download** `XLx Connector Setup 1.1.0.exe`
2. **Run the installer**
3. **Choose installation location**
4. **Select shortcuts** (Desktop and Start Menu recommended)
5. **Complete installation** and launch

### Upgrading from v1.0.0

The installer will automatically update your existing installation while preserving your:
- Preferences and settings
- Recent files list
- Send history
- Templates
- SQLite cache

Simply run the new installer - no need to uninstall the old version.

---

## 📖 Usage Guide

### Using Multi-Screen Support

1. **Open XLx Connector**
2. **Navigate to zzTakeoff Web tab** (Ctrl+4)
3. **Click "Login"** - A separate window will open
4. **Log in to zzTakeoff** in the new window
5. **Drag the window** to your second monitor
6. **Switch back to Excel Grid tab** (Ctrl+1) in the main window
7. **Work seamlessly** across both screens

### Tips
- Use **Focus Window** button to quickly bring zzTakeoff window to front
- The zzTakeoff window maintains your login session
- You can resize and position the window as needed
- Close the window using the **Logout** button or window close button

---

## 🐛 Bug Fixes

- Fixed syntax error in RecentsTab component
- Improved window management and cleanup
- Enhanced session persistence

---

## 📝 Full Feature List

All features from v1.0.0 are included, plus the new multi-screen support:

### Excel Integration
- Open and edit Excel files (.xlsx, .xls, .xlsm, .csv)
- Auto-save file state
- Smart column mapping
- Hover tooltips
- Real-time editing

### Template Management
- Create and update templates
- SKU-based matching
- Send to template functionality

### zzTakeoff Integration
- **NEW: Multi-screen support**
- Direct upload to zzTakeoff
- Flexible column mapping
- Cost type support
- Send history tracking

### UI/UX
- Modern grid view (AG Grid)
- Dark mode support
- Responsive layout
- Keyboard shortcuts

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Excel Grid tab |
| `Ctrl+2` | Recents tab |
| `Ctrl+3` | History tab |
| `Ctrl+4` | zzTakeoff Web tab |
| `Ctrl+5` | Preferences tab |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+Shift+S` | Save As |
| `F12` | Developer Tools |
| `F1` | Help |

---

## 📁 Application Data Locations

- **Settings & Preferences:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\preferences.json`
- **Recent Files:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\recents.json`
- **Send History:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\send-history.json`
- **Templates:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\templates.json`
- **SQLite Cache:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\excel-cache\`

---

## 💬 Support & Community

- **Issues:** [GitHub Issues](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/issues)
- **Discussions:** [GitHub Discussions](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/discussions)
- **Documentation:** [README](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/blob/main/README.md)

---

## 🙏 Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [AG Grid](https://www.ag-grid.com/) - Enterprise-grade data grid
- [SheetJS](https://sheetjs.com/) - Excel file processing
- [Bootstrap 5](https://getbootstrap.com/) - UI framework
- [SQLite](https://www.sqlite.org/) (via sql.js) - Database caching

---

**Thank you for using XLx Connector!** 🎉

For previous release notes, see [v1.0.0 Release Notes](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/releases/tag/v1.0.0)
