# macOS Build Guide

This guide explains how to build XLx Connector for macOS.

## Option 1: Automatic Build with GitHub Actions (Recommended)

The easiest way to create macOS builds is using GitHub Actions, which builds automatically on GitHub's macOS servers.

### Setup:

1. **Push your code to GitHub** (already done)
2. **Create a git tag for release**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **GitHub Actions will automatically**:
   - Build for Windows (x64)
   - Build for macOS (Intel x64 + Apple Silicon arm64)
   - Build for Linux (AppImage + deb)
   - Create a GitHub Release with all installers

### View Build Progress:
- Go to: https://github.com/samromeo1961/Excel-zzTakeoff-Connector/actions
- Click on the workflow run to see progress
- Download artifacts when complete

## Option 2: Manual Build on macOS

If you have access to a Mac computer:

### Requirements:
- macOS 10.13 or later
- Node.js 18 or later
- Xcode Command Line Tools

### Steps:

1. **Clone repository on Mac**:
   ```bash
   git clone https://github.com/samromeo1961/Excel-zzTakeoff-Connector.git
   cd Excel-zzTakeoff-Connector
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build frontend**:
   ```bash
   npm run build-frontend
   ```

4. **Build macOS installer**:
   ```bash
   npm run dist
   ```

5. **Find installers in `dist/` folder**:
   - `XLx Connector-1.0.0.dmg` (DMG installer for drag-and-drop)
   - `XLx Connector-1.0.0-mac.zip` (ZIP archive)
   - Builds for both Intel (x64) and Apple Silicon (arm64)

## macOS Icon

The build configuration expects a macOS icon at `assets/icon.icns`.

### Convert Windows icon to macOS format:

**Option 1: Online converter**
- Upload `assets/icon.ico` to https://cloudconvert.com/ico-to-icns
- Download the `.icns` file
- Save as `assets/icon.icns`

**Option 2: On Mac with iconutil**
```bash
# Create iconset folder structure
mkdir icon.iconset
# Copy PNG files at various sizes (16, 32, 128, 256, 512, 1024)
# Then run:
iconutil -c icns icon.iconset -o assets/icon.icns
```

**Option 3: Use existing icon temporarily**
If you don't have a Mac icon yet, the build will still work but use a default Electron icon.

## Unsigned vs Signed Builds

### Unsigned (Current - Beta)
- ✅ Free
- ❌ Shows Gatekeeper warning on macOS
- ✅ Users can bypass: Right-click → Open → "Open anyway"

### Signed (Production)
Requires Apple Developer Program ($99/year):

1. **Join Apple Developer Program**:
   - https://developer.apple.com/programs/

2. **Get Developer ID Certificate**:
   - Download from Apple Developer portal
   - Install in Keychain

3. **Update package.json**:
   ```json
   {
     "build": {
       "mac": {
         "identity": "Developer ID Application: Your Name (TEAM_ID)",
         "hardenedRuntime": true,
         "gatekeeperAssess": true
       }
     }
   }
   ```

4. **Notarize the app**:
   ```bash
   # electron-builder will automatically notarize if credentials are provided
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   npm run dist
   ```

## How to Bypass Gatekeeper (For Beta Testers)

When users download the unsigned .dmg:

1. **Download** `XLx Connector.dmg`
2. **Open the DMG** (double-click)
3. **Drag app to Applications folder**
4. **First launch**:
   - Don't double-click the app (will be blocked)
   - Right-click (or Control+click) the app
   - Select "Open"
   - Click "Open" in the dialog
5. **Subsequent launches**: Normal double-click works

## Output Files

After building, you'll find in the `dist/` folder:

### Universal Builds (Recommended):
- `XLx Connector-1.0.0-universal.dmg` - Works on both Intel and Apple Silicon

### Architecture-Specific:
- `XLx Connector-1.0.0-x64.dmg` - Intel Macs only
- `XLx Connector-1.0.0-arm64.dmg` - Apple Silicon only
- `XLx Connector-1.0.0-mac.zip` - ZIP archive (universal)

## System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 300 MB free disk space
- **Display**: 1280x720 minimum resolution

## Troubleshooting

### Error: "Cannot find module 'dmg-builder'"
```bash
npm install --save-dev dmg-builder
```

### Error: "Code signing required"
Add to your environment or package.json:
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

### Build succeeds but no DMG file
Check `dist/mac/` folder - the app might be there but DMG creation failed.
Try running:
```bash
npm run dist -- --mac dmg
```

## Next Steps

After building macOS version:

1. **Test on macOS** (Intel and Apple Silicon if possible)
2. **Update documentation** to mention macOS support
3. **Create new release** (v1.0.1) with all platforms
4. **Update system requirements** in README.md

## Resources

- [electron-builder macOS docs](https://www.electron.build/configuration/mac)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [macOS Code Signing](https://www.electron.build/code-signing)
