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
echo [2/3] Creating commit with FCM push, instant order sync, price save button, and brand logo...
git commit -m "feat(system): instant real-time order sync without reload, FCM v1 push alerts for Android & Web Admin, Firebase price save buttons, and brand logo update"

echo.
echo [3/3] Pushing to GitHub (git push origin main)...
git push origin main

echo.
echo ========================================================
echo Check the output above. If it says "Everything up-to-date"
echo or shows object writing progress (100%%), push succeeded!
echo ========================================================
echo.
pause
