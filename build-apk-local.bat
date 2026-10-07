@echo off
title SK Pizza Point - Local APK Builder
color 0A
cls
echo ================================================================
echo           SK PIZZA POINT - LOCAL ANDROID APK BUILDER
echo ================================================================
echo.

echo [1/4] Checking Java Development Kit (JDK)...
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Java is not found in PATH.
    echo     To build APK locally on Windows, OpenJDK 17 or Android Studio is required.
    echo     NOTE: You can always build the APK automatically on GitHub by running push.bat!
    echo.
    pause
    exit /b 1
)
echo [✓] Java detected successfully.

echo.
echo [2/4] Generating high-resolution APK icons from new brand logo...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    python android-admin\generate_icons.py
) else (
    echo [i] Python not found. Using pre-configured icon sets.
)

echo.
echo [3/4] Building Native Debug APK using Gradle...
cd android-admin
call gradlew.bat assembleDebug --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Gradle build encountered an issue.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [4/4] Copying newly built APK to project root...
if exist "android-admin\app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "android-admin\app\build\outputs\apk\debug\app-debug.apk" "SKPizzaPointAdmin-v1.2.apk" >nul
    echo.
    echo ================================================================
    echo  [SUCCESS] APK BUILT SUCCESSFULLY WITH NEW LOGO!
    echo  File: SKPizzaPointAdmin-v1.2.apk (in project root)
    echo ================================================================
    echo.
    echo Opening output location...
    explorer.exe /select,"SKPizzaPointAdmin-v1.2.apk"
) else (
    echo [!] APK file was not found in outputs directory.
)

echo.
pause
