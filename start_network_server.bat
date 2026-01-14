@echo off
echo ========================================
echo   Local Network Server Setup
echo ========================================
echo.

echo Finding your local IP address...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Your Local IP: !IP!
)

echo.
echo ========================================
echo   IMPORTANT: Share this URL with others
echo ========================================
echo.
echo   Frontend: http://%IP%:5173
echo   Backend:  http://%IP%:5000
echo.
echo ========================================
echo.

echo Starting servers...
echo.
echo Opening Backend Server (Terminal 1)...
start cmd /k "cd server && echo Backend Server Starting... && npm start"

timeout /t 3 /nobreak >nul

echo Opening Frontend Server (Terminal 2)...
start cmd /k "cd client && echo Frontend Server Starting... && npm run dev"

echo.
echo ========================================
echo   Servers are starting!
echo ========================================
echo.
echo Two terminal windows will open:
echo   1. Backend Server (Port 5000)
echo   2. Frontend Server (Port 5173)
echo.
echo Share this URL: http://%IP%:5173
echo.
echo Press any key to exit this window...
pause >nul
