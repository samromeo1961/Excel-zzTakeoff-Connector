# Distribution Guide - XLx Connector v1.0.0

## Build Completed Successfully

**Date**: 2025-11-08
**Version**: 1.0.0
**Platform**: Windows 64-bit

## Distribution Files

The installer and distribution files are located in the `dist/` folder:

### Main Installer
- **File**: `XLx Connector Setup 1.0.0.exe`
- **Location**: `C:\Dev\Excel-zzTakeoff-Connector\dist\`
- **Type**: NSIS Installer (not one-click, allows custom installation directory)
- **Architecture**: x64
- **File Description**: This is the primary installer for beta testers

### Additional Files
- `XLx Connector Setup 1.0.0.exe.blockmap` - Update verification file
- `win-unpacked/` - Unpacked application files (for development/testing)
- `builder-debug.yml` - Build configuration details

## Distribution to Beta Testers

### Step 1: Test the Installer
Before distributing, test the installer:
```cmd
cd dist
"XLx Connector Setup 1.0.0.exe"
```

### Step 2: Upload to GitHub

#### Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `Excel-zzTakeoff-Connector` (or your preferred name)
3. Description: "XLx Connector - Excel integration for zzTakeoff construction estimating"
4. Set to Private (for beta testing)
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

#### Push Code to GitHub
```bash
# Add the GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/Excel-zzTakeoff-Connector.git

# Push the code
git branch -M main
git push -u origin main
```

#### Create a Release for Beta Testers
```bash
# Create and push a version tag
git tag -a v1.0.0-beta -m "Beta Release v1.0.0

New Features:
- Auto-reload last opened file on app startup
- Hover tooltips for truncated Description columns
- Enhanced column widths (Description 30% wider)
- Smart file loading optimization in Template updates
- Template management system
- zzTakeoff integration
- Dark mode support

Known Issues:
- None reported yet

Beta Testing Notes:
- This is a beta release for testing purposes
- Please report any bugs or feature requests"

git push origin v1.0.0-beta
```

#### Upload Installer to GitHub Release
1. Go to your repository on GitHub
2. Click "Releases" > "Draft a new release"
3. Choose the tag: `v1.0.0-beta`
4. Release title: `XLx Connector v1.0.0 - Beta`
5. Description: Copy from the tag message above
6. Check "This is a pre-release"
7. Drag and drop `XLx Connector Setup 1.0.0.exe` into the assets area
8. Click "Publish release"

### Step 3: Share with Beta Testers

Send beta testers the following:

**Email Template:**
```
Subject: XLx Connector Beta v1.0.0 - Ready for Testing

Hi [Beta Tester],

The XLx Connector beta is ready for testing!

Download Link: [GitHub Release URL]

Installation Instructions:
1. Download "XLx Connector Setup 1.0.0.exe"
2. Run the installer and follow the prompts
3. Launch from Start Menu or Desktop shortcut

Documentation:
- See the included README.md in the repository or installation folder
- Keyboard shortcuts and features are documented in the app

What to Test:
✓ Opening Excel files (.xlsx, .xls, .xlsm, .csv)
✓ Auto-reload feature (close and reopen the app)
✓ Creating and managing templates
✓ Updating templates from Excel data
✓ zzTakeoff integration (if you have access)
✓ Dark mode toggle
✓ Hover tooltips on description columns

Please Report:
- Any bugs or errors encountered
- Performance issues
- Feature requests or improvements
- User experience feedback

Report issues to: [Your Contact Info]

Thank you for helping test XLx Connector!
```

## Alternative Distribution Methods

### Cloud Storage (OneDrive/Google Drive)
If you prefer not to use GitHub releases:
1. Upload `XLx Connector Setup 1.0.0.exe` to cloud storage
2. Create a shareable link
3. Send link to beta testers
4. Consider adding password protection

### Direct Distribution
- Copy installer to USB drive
- Share via network drive
- Send via file transfer service (WeTransfer, SendAnywhere, etc.)

## System Requirements

Ensure beta testers meet these requirements:
- Windows 10 or later (64-bit)
- 4GB RAM minimum (8GB recommended)
- 200MB free disk space
- 1280x720 minimum screen resolution

## Troubleshooting for Beta Testers

### Windows SmartScreen Warning
Users may see "Windows protected your PC" warning:
1. Click "More info"
2. Click "Run anyway"
3. This is normal for unsigned applications

### Antivirus Warnings
Some antivirus software may flag the installer:
- This is a false positive (app is not signed)
- Users can add an exception if needed
- Consider code signing for production release

## Next Steps

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create v1.0.0-beta tag and release
- [ ] Upload installer to GitHub release
- [ ] Test download and installation
- [ ] Send beta testing invitations
- [ ] Set up issue tracking for bug reports
- [ ] Schedule beta testing period (suggested: 2-4 weeks)
- [ ] Collect and analyze feedback
- [ ] Plan v1.1.0 based on feedback

## Build Information

**Frontend Build**: Vite 7.2.1
**Backend**: Electron 39.1.1
**Electron Builder**: 26.0.12
**Build Time**: ~15 seconds
**Installer Size**: ~150 MB (includes Electron runtime)

## Version History

### v1.0.0-beta (2025-11-08)
- Initial beta release
- Excel file integration with SheetJS
- Template management system
- zzTakeoff API integration
- Auto-reload feature
- Enhanced UI with tooltips and improved column widths
- Dark mode support
- Recent files tracking
- Send history logging

---

**Note**: This is a beta release. Code signing is disabled for development. Consider adding code signing for production releases to avoid Windows SmartScreen warnings.
