@echo off
title SK Pizza Point - Extract Hero Video Frames
color 0E
echo ========================================================
echo   SK PIZZA POINT - EXTRACTING HERO SCROLL FRAMES
echo ========================================================
echo.

set "ZIP_PATH=C:\Users\intel\Downloads\ezgif-299b8a55effead93-jpg\ezgif-299b8a55effead93-jpg.zip"
set "DEST_DIR=%~dp0public\hero-frames"

echo Checking for zip file at:
echo %ZIP_PATH%
echo.

if not exist "%ZIP_PATH%" (
    echo [ERROR] Zip file not found at:
    echo %ZIP_PATH%
    echo.
    echo Please make sure ezgif-299b8a55effead93-jpg.zip is in your Downloads folder!
    echo Or manually copy/extract its images into:
    echo %DEST_DIR%
    echo.
    pause
    exit /b 1
)

echo Creating destination directory: %DEST_DIR%
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

echo.
echo [1/2] Extracting frames from zip archive...
tar -xf "%ZIP_PATH%" -C "%DEST_DIR%" 2>nul
if %errorlevel% neq 0 (
    echo Tar fallback: using PowerShell Expand-Archive...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%DEST_DIR%' -Force"
)

echo.
echo [2/2] Checking extracted files...
dir /b "%DEST_DIR%" | findstr /i "\.jpg \.jpeg \.png" >nul
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Video frames extracted to public\hero-frames!
    echo  The website will now smoothly animate them on scroll!
    echo ========================================================
) else (
    echo.
    echo Note: If images were in a subfolder inside the zip, please check:
    echo %DEST_DIR%
)

echo.
pause
