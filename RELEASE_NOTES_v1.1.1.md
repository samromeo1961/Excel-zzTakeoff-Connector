# Release Notes - v1.1.1

**Release Date:** November 21, 2025

## 🐛 Bug Fixes

### Window Sizing and Display Issues
- **Fixed application startup crash** - Resolved `TypeError` in `setBounds()` that prevented the application from opening
- **Fixed window sizing** - Application now opens at 1920x1080 pixels (previously 1400x900)
- **Fixed maximized window state** - Application no longer opens in maximized/fullscreen mode on startup
- **Improved window initialization** - Window sizing is now applied before content loads to prevent state restoration issues

## 🎯 What's Changed

The application now:
- Opens reliably without JavaScript errors
- Displays at the correct 1920x1080 window size
- Shows navigation tabs on startup (not in compact/fullscreen mode)
- Auto-loads the most recent Excel file (existing behavior preserved)
- Centers the window on screen

## 🔧 Technical Details

### Changes in `main.js`
- Replaced `setBounds()` with `setSize()` to avoid undefined coordinate errors
- Moved window sizing logic to execute before URL loading
- Removed automatic fullscreen mode on startup

### Changes in `App.vue`
- Disabled `enterFullscreen()` call on application mount
- Preserved auto-load behavior for recent files

## 📦 Installation

Download the installer for your platform:
- **Windows:** `XLx-Connector-Setup-1.1.1.exe`

## 🔄 Upgrade Notes

This is a patch release that fixes critical startup issues. All users on v1.1.0 should upgrade to v1.1.1.

---

**Full Changelog:** v1.1.0...v1.1.1
