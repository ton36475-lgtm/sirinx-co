@echo off
title SIRINX AI Command Center — Telegram Bot
color 0A

echo.
echo  @@@@@@@@  @@@ @@@@@@@  @@@@@@ @@@  @@@ @@@  @@@
echo  @@!  @@@ @@! @@!  @@@ @@!  @@@ @@!@!@@@ @@!  !@@
echo  @!@!!@!  !!@ @!@!!@!  @!@  !@! @!@@!!@! @!@@!@!
echo  !!: :!!  !!: !!: :!!  !!:  !!!  !@@:!!  !!: :!!
echo   :   ::  :    :   ::   :.::.: :   ::  :   :   :
echo.
echo  SIRINX 47 Ronin AI Command Center
echo  Telegram Bot v1.0 — Bangkok, Thailand
echo  ================================================
echo.

:: Change to the AI-WarRoom root directory
cd /d "%~dp0"

:: Check Node is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found. Please install Node.js first.
    echo  Download: https://nodejs.org
    pause
    exit /b 1
)

:: Check .env exists
if not exist ".env" (
    echo  ERROR: .env file not found in %~dp0
    echo  Copy .env.example to .env and fill in your TELEGRAM_BOT_TOKEN
    pause
    exit /b 1
)

:: Check node_modules
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    echo.
)

echo  Starting SIRINX Bot...
echo  Press Ctrl+C to stop
echo.
node scripts\sirinx-bot.js

echo.
echo  Bot stopped.
pause
