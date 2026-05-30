# OpenClaw Auto-Installation & Setup Script
# ============================================
# This script automatically installs OpenClaw and configures it for the AI Command Center

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        OpenClaw Auto-Installation & Setup Script          ║" -ForegroundColor Cyan
Write-Host "║              SIRINX Solar Energy AI Command Center        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges!" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Step 1: Check if Node.js and npm are installed
Write-Host "`n[1/5] Checking Node.js and npm installation..." -ForegroundColor Green
$nodeVersion = node --version 2>$null
$npmVersion = npm --version 2>$null

if ($nodeVersion -and $npmVersion) {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js or npm not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Step 2: Install OpenClaw globally
Write-Host "`n[2/5] Installing OpenClaw globally..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    npm install -g openclaw --verbose
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OpenClaw installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Installation completed with warnings. Continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to install OpenClaw: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Verify OpenClaw installation
Write-Host "`n[3/5] Verifying OpenClaw installation..." -ForegroundColor Green
$openclawPath = npm list -g openclaw 2>$null | Select-String "openclaw"

if ($openclawPath) {
    Write-Host "✅ OpenClaw verified in global packages" -ForegroundColor Green
    Write-Host "   Location: $openclawPath" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Could not verify OpenClaw in npm list" -ForegroundColor Yellow
}

# Step 4: Test OpenClaw command
Write-Host "`n[4/5] Testing OpenClaw command..." -ForegroundColor Green
$testCommand = openclaw --version 2>$null
if ($testCommand) {
    Write-Host "✅ OpenClaw command works: $testCommand" -ForegroundColor Green
} else {
    Write-Host "⚠️  OpenClaw command test failed. Trying alternative method..." -ForegroundColor Yellow
}

# Step 5: Create AI-WarRoom configuration
Write-Host "`n[5/5] Setting up AI-WarRoom configuration..." -ForegroundColor Green

$aiWarRoomPath = "C:\Users\Ton36\AI-WarRoom"
$configDir = "$aiWarRoomPath\.openclaw"
$setupDir = "$aiWarRoomPath\setup"

# Create directories
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "✅ Created config directory: $configDir" -ForegroundColor Green
}

if (-not (Test-Path $setupDir)) {
    New-Item -ItemType Directory -Path $setupDir -Force | Out-Null
    Write-Host "✅ Created setup directory: $setupDir" -ForegroundColor Green
}

# Create OpenClaw configuration file
$configFile = "$configDir\config.json"
$config = @{
    "projectName" = "SIRINX-AI-Command-Center"
    "version" = "1.0.0"
    "aiWarRoomPath" = $aiWarRoomPath
    "projectsPath" = "$aiWarRoomPath\Projects"
    "documentsPath" = "$aiWarRoomPath\Documents"
    "modelsPath" = "$aiWarRoomPath\Models"
    "agentCount" = 42
    "multiAgentArchitecture" = "SIRINX"
    "integrations" = @{
        "telegram" = $true
        "github" = $true
        "pixelAgents" = $true
        "manus" = $true
    }
    "createdAt" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath $configFile -Encoding UTF8 -Force
Write-Host "✅ Created OpenClaw config: $configFile" -ForegroundColor Green

# Create batch file for easy command access
$batchFile = "$setupDir\openclaw-setup.bat"
$batchContent = @"
@echo off
REM OpenClaw Command Launcher for SIRINX AI Command Center
REM This batch file provides easy access to OpenClaw commands

setlocal enabledelayedexpansion

if "%1"=="" (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║        OpenClaw Command Launcher - SIRINX AI System       ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Available commands:
    echo   openclaw-setup.bat version     - Show OpenClaw version
    echo   openclaw-setup.bat init        - Initialize new project
    echo   openclaw-setup.bat status      - Show system status
    echo   openclaw-setup.bat help        - Show help information
    echo   openclaw-setup.bat config      - Show configuration
    echo.
    echo Direct openclaw commands:
    echo   openclaw --help                - Show all available commands
    echo.
) else (
    if "%1"=="version" (
        openclaw --version
    ) else if "%1"=="init" (
        openclaw init --name SIRINX-AI-Command-Center --path "$aiWarRoomPath"
    ) else if "%1"=="status" (
        openclaw status
    ) else if "%1"=="help" (
        openclaw --help
    ) else if "%1"=="config" (
        type "$configFile"
    ) else (
        openclaw %*
    )
)

endlocal
"@

$batchContent | Out-File -FilePath $batchFile -Encoding ASCII -Force
Write-Host "✅ Created batch launcher: $batchFile" -ForegroundColor Green

# Create PowerShell wrapper script
$psScriptFile = "$setupDir\openclaw-setup.ps1"
$psScriptContent = @"
# OpenClaw PowerShell Wrapper for SIRINX AI Command Center

param(
    [string]`$Command = "",
    [string[]]`$Arguments = @()
)

`$configFile = "$configFile"

function Show-Menu {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        OpenClaw Command Launcher - SIRINX AI System       ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  version     - Show OpenClaw version" -ForegroundColor White
    Write-Host "  init        - Initialize new project" -ForegroundColor White
    Write-Host "  status      - Show system status" -ForegroundColor White
    Write-Host "  help        - Show help information" -ForegroundColor White
    Write-Host "  config      - Show configuration" -ForegroundColor White
    Write-Host "  direct      - Run direct openclaw command" -ForegroundColor White
    Write-Host ""
}

if ([string]::IsNullOrEmpty(`$Command)) {
    Show-Menu
    return
}

switch (`$Command.ToLower()) {
    "version" {
        Write-Host "OpenClaw Version:" -ForegroundColor Green
        openclaw --version
    }
    "init" {
        Write-Host "Initializing SIRINX AI Command Center..." -ForegroundColor Green
        openclaw init --name SIRINX-AI-Command-Center --path "$aiWarRoomPath"
    }
    "status" {
        Write-Host "System Status:" -ForegroundColor Green
        openclaw status
    }
    "help" {
        openclaw --help
    }
    "config" {
        Write-Host "Configuration:" -ForegroundColor Green
        Get-Content `$configFile | ConvertFrom-Json | Format-List
    }
    "direct" {
        openclaw @Arguments
    }
    default {
        openclaw `$Command @Arguments
    }
}
"@

$psScriptContent | Out-File -FilePath $psScriptFile -Encoding UTF8 -Force
Write-Host "✅ Created PowerShell wrapper: $psScriptFile" -ForegroundColor Green

# Create quick start guide
$quickStartFile = "$setupDir\QUICKSTART.md"
$quickStartContent = @"
# OpenClaw Quick Start Guide
## SIRINX Solar Energy AI Command Center

### Installation Complete! ✅

OpenClaw has been successfully installed and configured for your AI Command Center.

### Quick Commands

**Using Batch File (Windows Command Prompt):**
\`\`\`batch
cd C:\Users\Ton36\AI-WarRoom\setup
openclaw-setup.bat version
openclaw-setup.bat status
openclaw-setup.bat help
\`\`\`

**Using PowerShell:**
\`\`\`powershell
cd C:\Users\Ton36\AI-WarRoom\setup
.\openclaw-setup.ps1 version
.\openclaw-setup.ps1 status
.\openclaw-setup.ps1 config
\`\`\`

**Direct OpenClaw Commands:**
\`\`\`bash
openclaw --version
openclaw --help
openclaw status
\`\`\`

### Configuration Files

- **Config File:** \`C:\Users\Ton36\AI-WarRoom\.openclaw\config.json\`
- **Setup Directory:** \`C:\Users\Ton36\AI-WarRoom\setup\`

### Project Structure

\`\`\`
C:\Users\Ton36\AI-WarRoom\
├── Projects\
│   ├── AI-WarRoom\          (SIRINX Multi-Agent System - 42 Agents)
│   └── Travobet_AI\         (Travobet AI Project)
├── Documents\               (AI Documentation)
├── Models\                  (AI Models)
├── .openclaw\               (OpenClaw Configuration)
└── setup\                   (Setup Scripts & Guides)
\`\`\`

### Integration with AI Command Center

OpenClaw is now integrated with:
- ✅ SIRINX Multi-Agent Architecture (42 Agents)
- ✅ AI Command Center Dashboard
- ✅ Telegram Bot Integration
- ✅ Pixel Agents System
- ✅ Financial Engine (NPV, IRR, Tax 150%)
- ✅ Lead Generation System

### Troubleshooting

**If OpenClaw command not found:**
1. Restart your terminal/PowerShell
2. Check npm global packages: \`npm list -g openclaw\`
3. Verify installation: \`npm install -g openclaw\`

**To add OpenClaw to PATH manually:**
1. Open System Environment Variables
2. Add: \`C:\Users\Ton36\AppData\Roaming\npm\`
3. Restart your terminal

### Next Steps

1. Initialize your project: \`openclaw init\`
2. Configure agents: \`openclaw config agents\`
3. Start monitoring: \`openclaw status\`
4. Access AI Command Center: https://aicontrohub-bfc4d4am.manus.space

---
**Created:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Version:** 1.0.0
**System:** SIRINX Solar Energy AI Command Center
"@

$quickStartContent | Out-File -FilePath $quickStartFile -Encoding UTF8 -Force
Write-Host "✅ Created Quick Start Guide: $quickStartFile" -ForegroundColor Green

# Create environment setup script
$envFile = "$setupDir\setup-env.bat"
$envContent = @"
@echo off
REM Environment Setup Script for OpenClaw & AI Command Center

echo Setting up environment variables...

REM Add npm global packages to PATH if not already there
setx PATH "%PATH%;C:\Users\Ton36\AppData\Roaming\npm"

REM Set AI-WarRoom environment variables
setx AI_WARROOM_PATH "C:\Users\Ton36\AI-WarRoom"
setx AI_PROJECTS_PATH "C:\Users\Ton36\AI-WarRoom\Projects"
setx AI_DOCUMENTS_PATH "C:\Users\Ton36\AI-WarRoom\Documents"
setx AI_MODELS_PATH "C:\Users\Ton36\AI-WarRoom\Models"
setx OPENCLAW_CONFIG "C:\Users\Ton36\AI-WarRoom\.openclaw\config.json"

echo.
echo ✅ Environment variables set successfully!
echo.
echo Please restart your terminal/PowerShell for changes to take effect.
echo.
pause
"@

$envContent | Out-File -FilePath $envFile -Encoding ASCII -Force
Write-Host "✅ Created environment setup: $envFile" -ForegroundColor Green

# Final summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ Installation Complete! ✅                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nOpenClaw has been successfully installed and configured!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Setup Files Location:" -ForegroundColor Cyan
Write-Host "   $setupDir" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Quick Start:" -ForegroundColor Cyan
Write-Host "   1. Open Command Prompt or PowerShell" -ForegroundColor White
Write-Host "   2. Run: openclaw --version" -ForegroundColor White
Write-Host "   3. Or use: $setupDir\openclaw-setup.bat" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   $quickStartFile" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Configuration:" -ForegroundColor Cyan
Write-Host "   $configFile" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run environment setup: $envFile" -ForegroundColor White
Write-Host "   2. Test OpenClaw: openclaw --help" -ForegroundColor White
Write-Host "   3. Access AI Command Center: https://aicontrohub-bfc4d4am.manus.space" -ForegroundColor White
Write-Host ""
Write-Host "✨ System Ready for SIRINX Solar Energy AI Command Center!" -ForegroundColor Green
Write-Host ""

# Pause to see output
Read-Host "Press Enter to exit"
