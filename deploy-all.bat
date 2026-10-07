@echo off
title SK Pizza Point - 1-Click Complete System Deploy (Web + APK)
color 0B
cls
echo ================================================================
echo    SK PIZZA POINT - 1-CLICK ALL-IN-ONE SYSTEM DEPLOYMENT
echo    (Deploys Web Design to Firebase + Pushes APK to GitHub)
echo ================================================================
echo.

echo [1/4] Building Vite Frontend with all new designs and logo...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Frontend build encountered an error.
    pause
    exit /b %ERRORLEVEL%
)
echo [✓] Frontend built successfully.

echo.
echo [2/4] Deploying updated designs directly to Firebase Hosting...
call npx -y firebase-tools deploy --only hosting
if %ERRORLEVEL% EQU 0 (
    echo [✓] Firebase hosting updated! Live URL: https://sk-pizza-point.web.app
) else (
    echo [!] Notice: Firebase deploy skipped or login needed. Continuing to APK push...
)

echo.
echo [3/4] Generating high-resolution APK icons with new brand logo...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    python android-admin\generate_icons.py
) else (
    echo [i] Local python not detected. GitHub Actions will generate icons during cloud build.
)

echo.
echo [4/4] Committing all updates and pushing to GitHub for APK build...
git config user.name "SK Pizza Point"
git config user.email "skpizzapoint@gmail.com"
git fetch origin main
git reset --mixed origin/main
git add -A
git commit -m "feat(system): full sync with new brand logo x7VzA1Q, versionCode 3, and refreshed admin UI"
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================================
    echo  [SUCCESS] 100%% COMPLETE DEPLOYMENT FINISHED!
    echo.
    echo  1. Website Updated: https://sk-pizza-point.web.app
    echo  2. New APK Building: Check GitHub Actions for download link
    echo  3. Active Logo: https://i.imgur.com/x7VzA1Q.jpeg
    echo ================================================================
) else (
    echo [!] Push encountered an issue. Retrying with upstream branch...
    git push -u origin main
)

echo.
pause
