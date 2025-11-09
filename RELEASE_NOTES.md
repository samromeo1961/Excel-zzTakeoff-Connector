# XLx Connector - Beta Release v1.0.0

**Excel to zzTakeoff Integration Tool**

## 📥 Download

Download the installer for Windows:
- [XLx Connector Setup 1.0.0.exe](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/releases/download/v1.0.0/XLx.Connector.Setup.1.0.0.exe)

**File Size:** ~120 MB
**SHA256 Checksum:** `996534683509e9bdff49ad1b2ab6ab9f2b65f8c09e21937dfc70d93212642a13`

---

## ⚠️ IMPORTANT: Unsigned Application Warning

**This beta version is NOT digitally signed.** Windows will display security warnings when installing or running the application. This is normal for unsigned software and does not indicate malicious code.

### How to Bypass Windows SmartScreen Warning

1. **Download and run the installer**
2. **Click "More info"** when SmartScreen blocks the app
3. **Click "Run anyway"** to proceed with installation
4. **Click "Yes"** on the User Account Control (UAC) prompt

**Detailed installation instructions with screenshots:** [View Beta Testing Guide](https://samromeo1961.github.io/Excel-zzTakeoff-Connector/BETA_TESTING_GUIDE.html)

---

## ✨ What's New in v1.0.0

### Major Features

#### 📊 Excel Grid Tab
- **AG Grid Integration:** View and edit Excel files with a modern spreadsheet interface
- **No Excel Required:** Uses SheetJS for native Excel file support (.xlsx, .xls, .xlsm, .csv)
- **SQLite Caching:** 10-100x faster loading on subsequent file opens
- **Multi-Sheet Support:** Work with files containing multiple worksheets
- **Row Tracking:** SHA-256 fingerprinting for tracking row changes
- **Custom Columns:**
  - `_zzType`: Area/Linear/Segment/Count dropdown selector
  - `_markupPercent`: Editable markup percentage with visual indicators
  - `_costType`: Labor/Material cost type selector
  - `_Actions`: Send to zzTakeoff button per row

#### 🕐 Recent Files Tab
- **Visual Indicators:** Green pulsing badge and row highlighting for currently open files
- **File Metadata:** Shows file size, row count, sheet names, and last opened time
- **Search & Filter:** Quickly find files with expandable search bar
- **Column Management:** Show/hide and reorder columns with Column Picker modal
- **Quick Actions:**
  - Open file with one click
  - Remove from recent history
  - View file location
- **Dark Mode Support:** Fully styled for both light and dark themes

#### 📋 Send History Tab
- Track all data sent to zzTakeoff API
- View timestamps, row counts, and response status
- Filter and search through history
- Export history data

#### 🌐 zzTakeoff Web Tab
- Embedded browser for zzTakeoff web interface
- Persistent login session (separate partition)
- Full screen mode support
- No need to switch between applications

#### ⚙️ Preferences Tab
- **Theme Settings:** Light/Dark mode toggle
- **API Configuration:** zzTakeoff API endpoint and credentials
- **Application Settings:** Customize behavior and appearance
- **Database Management:** Clear cache, view storage locations

### UI/UX Improvements

- **Responsive Toolbar:** Expandable search bars with flex-grow layout
- **Icon-Only Buttons:** Compact 38x38px action buttons with hover tooltips
- **Fullscreen Mode:** Distraction-free work environment with enhanced header
- **Row Count Display:** Live row count badge showing filtered/total rows
- **Auto-Refresh:** Recents tab automatically updates when navigating back
- **Pulsing Animations:** Visual feedback for active/open files

### Performance Enhancements

- **SQLite Database Caching:** Dramatically faster file re-loading
- **Incremental Loading:** Large files load progressively
- **Optimized Rendering:** AG Grid virtual scrolling for smooth performance
- **Memory Management:** Efficient cleanup of cached data

### Keyboard Shortcuts

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

## 📋 System Requirements

- **OS:** Windows 10 or Windows 11 (64-bit)
- **Memory:** 4GB RAM minimum, 8GB recommended
- **Storage:** 300 MB free disk space
- **Display:** 1280x720 minimum resolution
- **Internet:** Required for zzTakeoff API integration

---

## 🚀 Installation

1. **Download** `XLx Connector Setup 1.0.0.exe`
2. **Run the installer** (bypass SmartScreen warning - see above)
3. **Choose installation location** (default: `C:\Users\[YourName]\AppData\Local\Programs\excel-zztakeoff-connector`)
4. **Select shortcuts** (Desktop and Start Menu recommended)
5. **Complete installation** and launch

**Full installation guide with screenshots:** [BETA_TESTING_GUIDE.html](https://samromeo1961.github.io/Excel-zzTakeoff-Connector/BETA_TESTING_GUIDE.html)

---

## 🧪 Beta Testing

Thank you for participating in the beta test! Your feedback is crucial for improving XLx Connector.

### What to Test

- ✅ Opening various Excel file formats (.xlsx, .xls, .xlsm, .csv)
- ✅ Editing data in the grid (cell values, zzType, markup %)
- ✅ Sending data to zzTakeoff API
- ✅ Recent files tracking and visual indicators
- ✅ Search and filter functionality
- ✅ Column show/hide and reordering
- ✅ Theme switching (light/dark mode)
- ✅ Multi-sheet file handling
- ✅ File save/save-as operations
- ✅ Keyboard shortcuts

### Known Issues

- **SmartScreen Warning:** Expected for unsigned builds (will be signed in production)
- **Large Files:** First load of 10,000+ row files may take 30-60 seconds (subsequent loads are instant)
- **File Locking:** Close file in XLx Connector before opening in Excel
- **Antivirus:** Some AV software may flag unsigned Electron apps (safe to allow)

### Report Issues

**GitHub Issues:** [Report a bug or request a feature](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/issues)

**Include in your report:**
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Console errors (F12 → Console tab)
- Windows version
- File type/size (if file-related)

---

## 📁 Application Data Locations

- **Settings & Preferences:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\preferences.json`
- **Recent Files:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\recents.json`
- **Send History:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\send-history.json`
- **SQLite Cache:** `C:\Users\[YourName]\AppData\Roaming\excel-zztakeoff-connector\excel-cache\`

---

## 🗑️ Uninstallation

1. Open **Windows Settings** (`Win+I`)
2. Go to **Apps** → **Installed apps**
3. Find **XLx Connector** or **Excel-zzTakeoff Connector**
4. Click **⋯** → **Uninstall**

*Note: Application data will remain in AppData folder. Delete manually if desired.*

---

## 🔒 Security & Privacy

- **No telemetry or tracking** - Your data stays on your machine
- **Local storage only** - Settings and cache stored locally in AppData
- **Secure API calls** - All HTTPS requests proxied through main process
- **No cloud sync** - Files and data are not uploaded anywhere except zzTakeoff API (when you explicitly send data)
- **Open source** - Review the code on GitHub

### Why Unsigned?

Code signing certificates cost $300-$500+ annually and require business verification. For this beta release, we've chosen to distribute unsigned builds to gather feedback before investing in a certificate. **Future production releases will be properly signed.**

**Is it safe?**
- ✅ Source code is available on GitHub
- ✅ Built from public repository
- ✅ No obfuscated or hidden code
- ✅ Distributed through official GitHub Releases

---

## 💬 Support & Community

- **Issues:** [GitHub Issues](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/issues)
- **Discussions:** [GitHub Discussions](https://github.com/samromeo1961/Excel-zzTakeoff-Connector/discussions)
- **Email:** Contact via GitHub

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

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

**Thank you for beta testing XLx Connector!** 🎉

Your feedback will help make this tool better for the construction estimating community.
