@echo off
title SK Pizza Point - Auto Push
color 0A
cls
echo ========================================================
echo       SK PIZZA POINT - DEPLOYING ALL REAL-TIME & APK UPDATES
echo ========================================================
echo.

echo [1/5] Setting git user identity...
git config user.name "SK Pizza Point"
git config user.email "skpizzapoint@gmail.com"

echo.
echo [2/5] Syncing with GitHub remote...
git fetch origin main
git reset --mixed origin/main

echo.
echo [3/5] Adding all files and system updates...
git add -A

echo.
echo [4/5] Creating commit...
git commit -m "feat: real-time order siren alerts, two-way GPS sync, live tracking radar, and 2D APK logo"

echo.
echo [5/5] Pushing to GitHub (origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [SUCCESS] All updates pushed to GitHub successfully!
    echo  Website and Admin APK build will start automatically!
    echo ========================================================
) else (
    echo ========================================================
    echo  [NOTICE] Retrying push...
    git push -u origin main
    echo ========================================================
)
echo.
pause

