@echo off
title SK Pizza Point - Local APK Simulator & Tester
color 0E
cls
echo ================================================================
echo       SK PIZZA POINT - LIVE APK LOCALHOST SIMULATOR & TESTER
echo ================================================================
echo.
echo  [1/2] Opening Local Android APK Phone Simulator in 2 seconds...
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000/apk-preview.html"

echo.
echo  [2/2] Starting Localhost Dev Server on Port 3000...
echo.
echo  ----------------------------------------------------------------
echo   TESTING URLS:
echo   - 📱 APK Mobile Simulator: http://localhost:3000/apk-preview.html
echo   - 👑 Direct Admin Console:  http://localhost:3000/#/admin
echo   - 🍕 Customer Storefront:  http://localhost:3000/
echo  ----------------------------------------------------------------
echo.
echo  Press Ctrl+C anytime to stop.
echo ================================================================
echo.

npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo [!] npm run dev failed. Installing packages...
    npm install && npm run dev
)
pause
