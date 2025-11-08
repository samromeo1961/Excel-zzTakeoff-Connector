# XLx Connector - Beta

XLx Connector is a desktop application for Windows that enhances Excel spreadsheets with construction takeoff capabilities, integrating seamlessly with zzTakeoff.

## Features

### Excel Integration
- **Open and Edit Excel Files**: Work with .xlsx, .xls, .xlsm, and .csv files directly
- **Auto-Save File State**: Your last opened file automatically reloads when you restart the app
- **Smart Column Mapping**: Automatically detects and maps Excel columns to standard fields
- **Hover Tooltips**: View full text of truncated cells by hovering over them
- **Real-time Editing**: Edit cells directly in the grid with instant updates

### Template Management
- **Create Templates**: Save frequently used item configurations as reusable templates
- **Update Templates**: Sync templates with Excel data using SKU-based matching
- **Send to Template**: Add selected Excel rows to existing or new templates
- **Smart Matching**: Automatically detects duplicate items by code/SKU

### zzTakeoff Integration
- **Direct Upload**: Send Excel items directly to zzTakeoff projects
- **Flexible Mapping**: Configure which columns to send
- **Cost Type Support**: Material, Labour, Plant, Subcontractor, Other
- **zzType Options**: Area, Linear, Segment, Count measurements
- **Send History**: Track all items sent to zzTakeoff

### User Interface
- **Modern Grid View**: Powered by AG Grid for smooth performance with large datasets
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Layout**: Adapts to different screen sizes
- **Keyboard Shortcuts**: Navigate efficiently with keyboard commands

## Installation

1. Download the latest installer: `XLx-Connector-Setup-{version}.exe`
2. Run the installer and follow the prompts
3. Launch XLx Connector from your Start Menu or Desktop shortcut

## Quick Start

### Opening an Excel File
1. Click **Open Excel File** button or use `Ctrl+O`
2. Select your Excel file (.xlsx, .xls, .xlsm, or .csv)
3. The file loads automatically with smart column detection
4. Your file will auto-reload next time you start the app

### Working with Templates

#### Create a Template
1. Select rows in the Excel Grid
2. Click the **📁 Send to Template** button
3. Choose "Create new template" and enter a name
4. Click "Send to Template"

#### Update a Template
1. Open your Excel file with updated data
2. Go to the **Templates** tab
3. Select the template you want to update
4. Click the **🔄 Update** button
5. Review the changes summary
6. Choose update options (add new items, remove deleted items)
7. Click "Update Template"

### Sending to zzTakeoff
1. Configure zzTakeoff API settings in **Preferences**
2. Select rows in Excel Grid you want to send
3. Click **Send to zzTakeoff** button
4. Select project and configure options
5. Click Send

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Excel Grid Tab |
| `Ctrl+2` | Recent Files Tab |
| `Ctrl+3` | Send History Tab |
| `Ctrl+4` | zzTakeoff Web Tab |
| `Ctrl+5` | Preferences Tab |
| `Ctrl+O` | Open File |
| `Ctrl+S` | Save File |
| `Ctrl+Shift+S` | Save As |
| `F12` | Developer Tools |
| `F1` | Help |

## New in This Version

### v1.0.0-beta
- ✨ **Auto-Reload**: Last opened file automatically loads on app startup
- ✨ **Hover Tooltips**: Full text preview for truncated Description columns
- ✨ **Update Template**: Update existing templates from Excel data with smart SKU matching
- ✨ **Enhanced Column Widths**: Description columns are 30% wider for better readability
- 🐛 **Fixed**: Template update serialization errors
- 🐛 **Fixed**: Smart file loading uses already-loaded file instead of reopening

## System Requirements

- **OS**: Windows 10 or later (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 200MB for application + space for Excel files
- **Display**: 1280x720 minimum resolution

## Data Storage

Application data is stored in:
```
C:\Users\{YourUsername}\AppData\Roaming\excel-zztakeoff-connector\
```

This includes:
- `preferences.json` - User settings and preferences
- `templates.json` - Saved templates
- `send-history.json` - History of items sent to zzTakeoff
- `recents.json` - Recent files list

## Troubleshooting

### The app won't start
- Check that no other instance is running
- Restart your computer
- Reinstall the application

### Excel file won't load
- Ensure the file isn't open in Microsoft Excel
- Check file permissions
- Verify the file isn't corrupted

### Auto-reload not working
- The file path must not have changed
- The file must still exist at the original location
- Check that the file hasn't been renamed or moved

### Data not saving
- Ensure you click Save (Ctrl+S) after making changes
- Check that the file isn't read-only
- Verify you have write permissions to the file location

## Support

For bug reports and feature requests, please contact your beta program coordinator.

## License

Proprietary - Beta Testing License
This software is provided for beta testing purposes only and may not be redistributed.

---

**Version**: 1.0.0-beta
**Build Date**: 2025-11-08
