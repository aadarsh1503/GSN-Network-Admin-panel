@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Your Network Information
echo ========================================
echo.

echo Finding your local IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP=%%a"
    set "IP=!IP:~1!"
    if not "!IP:~0,3!"=="127" (
        echo Local IP Address: !IP!
        echo.
        echo ========================================
        echo   Share these URLs with others:
        echo ========================================
        echo.
        echo   Frontend: http://!IP!:5173
        echo   Backend:  http://!IP!:5000
        echo.
        echo ========================================
        echo.
        echo Make sure:
        echo  1. Both servers are running
        echo  2. Others are on the same WiFi/LAN
        echo  3. Windows Firewall allows the ports
        echo.
    )
)

echo.
echo Press any key to exit...
pause >nul
