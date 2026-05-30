@echo off
:: SIRINX Telegram Bot — Auto-start launcher
:: Runs sirinx-bot.js in background, logs to logs\bot.log

cd /d "C:\Users\Ton36\AI-WarRoom"

:: Ensure logs directory exists
if not exist logs mkdir logs

:: Kill any previously running bot instance on this token
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo list ^| findstr "PID"') do (
    wmic process %%i get CommandLine 2>nul | findstr "sirinx-bot" >nul && taskkill /PID %%i /F >nul 2>&1
)

echo [%DATE% %TIME%] Starting SIRINX Bot... >> logs\bot.log
node scripts\sirinx-bot.js >> logs\bot.log 2>> logs\bot-error.log
