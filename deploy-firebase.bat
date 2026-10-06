@echo off
title SK Pizza Point - Direct Firebase Hosting Deploy
color 0B
echo ========================================================
echo       SK PIZZA POINT - DIRECT FIREBASE DEPLOY
echo ========================================================
echo.
echo [1/2] Building Vite web project...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo Build encountered an issue. Checking details...
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Deploying directly to Firebase Hosting (sk-pizza-point)...
call npx -y firebase-tools deploy --only hosting
echo.
echo ========================================================
echo  DONE! Website is directly deployed to Firebase!
echo  Visit: https://sk-pizza-point.web.app
echo ========================================================
echo.
pause
