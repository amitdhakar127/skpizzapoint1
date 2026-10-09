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
git commit -m "feat: launch checklist, local SEO schema, sitemap, robots, 404 & thank-you pages, honeypot protection"

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
