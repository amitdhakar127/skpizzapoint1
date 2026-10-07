@echo off
title SK Pizza Point - Push To GitHub
color 0A
cls
echo ========================================================
echo       SK PIZZA POINT - PUSHING ALL UPDATES TO GITHUB
echo ========================================================
echo.

echo [1/3] Staging all files (git add -A)...
git add -A

echo.
echo [2/3] Creating commit with all fixes...
git commit -m "feat: 4-step admin order workflow, dedicated live GPS map tracking page, and Android heads-up push notifications with lock screen wake"

echo.
echo [3/3] Pushing to GitHub (git push origin main)...
git push origin main

echo.
echo ========================================================
echo Check the output above. If it shows writing objects (100%),
echo the push was successful and GitHub will build the APK!
echo ========================================================
echo.
pause
