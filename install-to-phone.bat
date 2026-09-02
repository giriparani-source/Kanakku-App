@echo off
title Kanakku - Install to Phone
color 0A

set ADB=C:\Users\ELCOT\AppData\Local\Android\Sdk\platform-tools\adb.exe
set APK=D:\kanakku-app\Kanakku.apk

echo.
echo ========================================
echo   KANAKKU - DIRECT PHONE INSTALL
echo   (No Play Protect Warning!)
echo ========================================
echo.
echo Make sure:
echo  1. USB cable connected to phone
echo  2. USB Debugging is ON in phone settings
echo  3. "Allow USB Debugging" popup - click OK
echo.
pause

echo Checking phone connection...
"%ADB%" devices

echo.
echo Installing Kanakku.apk to phone...
"%ADB%" install -r "%APK%"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Kanakku installed on phone!
    echo  No Play Protect warning!
    echo ========================================
) else (
    echo.
    echo ERROR! Make sure:
    echo  - USB Debugging is ON
    echo  - Phone is connected
    echo  - Allow USB Debugging popup accepted
)
echo.
pause
