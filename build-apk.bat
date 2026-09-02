@echo off
title Kanakku APK Builder
color 0A

echo.
echo ========================================
echo    KANAKKU APK BUILDER v1.2
echo ========================================
echo.

echo [1/4] Building web app...
call npm run build
if %errorlevel% neq 0 ( echo ERROR: Web build failed! & pause & exit /b 1 )

echo.
echo [2/4] Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 ( echo ERROR: Cap sync failed! & pause & exit /b 1 )

echo.
echo [3/4] Building Debug APK (No Play Protect warning)...
rem Use JDK 21 - required by Gradle 8.x (Java 25 from Android Studio JBR is NOT supported)
set "JAVA_HOME=%USERPROFILE%\.jdks\jbr-21.0.11"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 ( echo ERROR: Gradle build failed! & cd .. & pause & exit /b 1 )
cd ..

echo.
echo [4/4] Copying APK to project folder...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "Kanakku.apk"

echo.
echo ========================================
echo  SUCCESS! APK Ready at:
echo  D:\kanakku-app\Kanakku.apk
echo ========================================
echo.
echo  Steps to install on phone:
echo  1. Connect USB cable
echo  2. Select File Transfer on phone
echo  3. Copy Kanakku.apk to phone Downloads
echo  4. Open file manager and tap Kanakku.apk
echo  5. Allow "Install from unknown sources" if asked
echo  6. Install - No harmful app warning!
echo.
pause
