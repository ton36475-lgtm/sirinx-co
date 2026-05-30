@echo off
:: SIRINX Daily Report — 9:00 AM Bangkok time (02:00 UTC)
cd /d "C:\Users\Ton36\AI-WarRoom"

if not exist logs mkdir logs

echo [%DATE% %TIME%] Running daily report... >> logs\daily-report.log
node scripts\daily-report.js >> logs\daily-report.log 2>&1
