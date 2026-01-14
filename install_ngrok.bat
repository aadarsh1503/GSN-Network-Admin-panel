@echo off
echo ========================================
echo   ngrok Installation Helper
echo ========================================
echo.

echo This script will help you install ngrok.
echo.
echo Step 1: Download ngrok
echo ----------------------------------------
echo.
echo Opening ngrok download page in your browser...
echo Please download ngrok for Windows (ZIP file)
echo.
start https://ngrok.com/download
echo.
echo After downloading:
echo 1. Extract the ZIP file
echo 2. Copy ngrok.exe to this folder: D:\GSN NETWORK\
echo 3. Come back here and press any key
echo.
pause
echo.

echo Step 2: Check if ngrok.exe is in this folder
echo ----------------------------------------
echo.

if exist ngrok.exe (
    echo [SUCCESS] ngrok.exe found!
    echo.
) else (
    echo [ERROR] ngrok.exe not found in this folder.
    echo.
    echo Please:
    echo 1. Extract the downloaded ZIP file
    echo 2. Copy ngrok.exe to: D:\GSN NETWORK\
    echo 3. Run this script again
    echo.
    pause
    exit /b
)

echo Step 3: Sign up for ngrok (if you haven't)
echo ----------------------------------------
echo.
echo Opening ngrok signup page...
echo Please sign up for a FREE account
echo.
start https://dashboard.ngrok.com/signup
echo.
echo After signing up, press any key to continue...
pause
echo.

echo Step 4: Get your authtoken
echo ----------------------------------------
echo.
echo Opening authtoken page...
echo Copy your authtoken from this page
echo.
start https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo Please copy your authtoken and paste it below:
echo (Right-click to paste in CMD)
echo.
set /p AUTHTOKEN="Enter your authtoken: "
echo.

if "%AUTHTOKEN%"=="" (
    echo [ERROR] No authtoken entered!
    echo Please run this script again and enter your authtoken.
    pause
    exit /b
)

echo Configuring ngrok with your authtoken...
ngrok config add-authtoken %AUTHTOKEN%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! ngrok is ready to use!
    echo ========================================
    echo.
    echo You can now run:
    echo   ngrok http 5173
    echo.
    echo Or use the automatic script:
    echo   start_with_ngrok.bat
    echo.
) else (
    echo.
    echo [ERROR] Failed to configure ngrok.
    echo Please check if ngrok.exe is in this folder.
    echo.
)

pause
