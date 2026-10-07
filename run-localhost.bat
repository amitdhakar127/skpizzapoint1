@echo off
title SK Pizza Point - Localhost Dev Server
color 0B
cls
echo ================================================================
echo          SK PIZZA POINT - LOCALHOST DEVELOPMENT SERVER
echo ================================================================
echo.
echo  [1/2] Launching browser to Admin Dashboard in 3 seconds...
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000/#/admin"

echo.
echo  [2/2] Starting Vite Localhost Server on Port 3000...
echo.
echo  ----------------------------------------------------------------
echo   LOCAL ACCESS URLs:
echo   - Admin Console:        http://localhost:3000/#/admin
echo   - Customer Storefront:  http://localhost:3000/
echo   - Live Radar Tracker:   http://localhost:3000/#/track
echo  ----------------------------------------------------------------
echo.
echo  Press Ctrl+C in this terminal anytime to stop the localhost server.
echo ================================================================
echo.

npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] npm run dev failed or node_modules missing. Trying npm install...
    npm install && npm run dev
)
pause
