@echo off
REM OpenClaw Auto-Installation Runner
REM This script runs the PowerShell installation script with admin privileges

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        OpenClaw Auto-Installation & Setup                ║
echo ║              SIRINX Solar Energy AI System                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ⚠️  This script requires Administrator privileges!
    echo.
    echo Attempting to restart with Administrator privileges...
    echo.
    
    REM Create a temporary VBS script to run with admin privileges
    set "scriptPath=%~dp0install-openclaw.ps1"
    
    powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%scriptPath%""' -Verb RunAs"
    
    exit /b
)

REM Run the PowerShell installation script
echo Running installation script...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-openclaw.ps1"

if %errorLevel% equ 0 (
    echo.
    echo ✅ Installation completed successfully!
    echo.
) else (
    echo.
    echo ❌ Installation failed with error code: %errorLevel%
    echo.
)

pause
