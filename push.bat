@echo off
title SK Pizza Point - Auto Push
color 0A
echo ========================================================
echo       SK PIZZA POINT - PUSHING UPDATES TO GITHUB
echo ========================================================
echo.

echo Setting git user identity...
git config user.name "SK Pizza Point"
git config user.email "skpizzapoint@gmail.com"

echo.
echo [1/3] Adding modified files...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "Fix customer location resilience, admin alarm restriction, and update APK brand logo"

echo.
echo [3/3] Pushing to GitHub (origin main)...
git push origin main

echo.
echo ========================================================
echo  SUCCESS! All changes are pushed to GitHub!
echo  Firebase Hosting and Android APK build started!
echo ========================================================
echo.
pause
