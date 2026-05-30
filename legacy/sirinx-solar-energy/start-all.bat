@echo off
echo ======================================
echo  SIRINX AI-WarRoom — Auto Start
echo ======================================
echo.

:: Move to project root
cd /d "C:\Users\Ton36\AI-WarRoom"

:: Start both apps via PM2
pm2 start ecosystem.config.js
pm2 save

echo.
echo ✅ SIRINX System Started!
echo.
echo 🤖 Engine (Telegram bot + agents):
echo    pm2 logs sirinx-engine
echo.
echo 🌐 Web Dashboard:
echo    http://localhost:3002        (ใน PC)
echo    http://192.168.1.38:3002     (มือถือ / LAN)
echo.
echo 📊 Status:  pm2 status
echo 🛑 Stop:    pm2 stop all
echo.
pause
