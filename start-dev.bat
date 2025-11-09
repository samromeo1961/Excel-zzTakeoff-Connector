@echo off
REM Excel-zzTakeoff-Connector Development Server Launcher
REM Double-click this file to start the development environment

echo ============================================================
echo Starting Excel-zzTakeoff-Connector Development Environment
echo ============================================================
echo.
echo This will start:
echo  - Vite dev server (frontend)
echo  - Electron desktop application
echo.
echo Press Ctrl+C to stop both servers
echo ============================================================
echo.

cd /d "%~dp0"
npm run dev

pause
