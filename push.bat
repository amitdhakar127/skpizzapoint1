@echo off
title SK Pizza Point - Auto Push
color 0A
cls
echo ========================================================
echo       SK PIZZA POINT - PUSHING ALL 123 FRAMES TO GITHUB
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
echo [3/5] Adding all files and 123 hero video frames...
git add -A

echo.
echo [4/5] Creating commit...
git commit -m "feat: add 123 hero video scroll frames and sync canvas animation"

echo.
echo [5/5] Pushing to GitHub (origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [SUCCESS] All 123 frames pushed to GitHub successfully!
    echo  Website deployment will start automatically!
    echo ========================================================
) else (
    echo ========================================================
    echo  [NOTICE] Retrying push...
    git push -u origin main
    echo ========================================================
)
echo.
pause

