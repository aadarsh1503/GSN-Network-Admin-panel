@echo off
echo ========================================
echo   Internet Sharing Setup (ngrok)
echo ========================================
echo.

echo Checking if ngrok is installed...
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] ngrok is not installed!
    echo.
    echo Please install ngrok:
    echo 1. Go to https://ngrok.com/download
    echo 2. Download ngrok for Windows
    echo 3. Extract ngrok.exe to this folder
    echo 4. Sign up at https://dashboard.ngrok.com/signup
    echo 5. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit /b
)

echo ngrok found!
echo.
echo ========================================
echo   Starting Servers...
echo ========================================
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd server && echo Backend running on http://localhost:5000 && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd client && echo Frontend running on http://localhost:5173 && npm run dev"

timeout /t 5 /nobreak >nul

echo [3/3] Starting ngrok tunnel...
echo.
echo ========================================
echo   IMPORTANT: Copy the ngrok URL!
echo ========================================
echo.
echo Look for a line like:
echo   Forwarding: https://abc123.ngrok-free.app
echo.
echo Share that URL with anyone!
echo.
echo ========================================
echo.

start "ngrok Tunnel" cmd /k "echo Starting ngrok... && timeout /t 2 /nobreak >nul && ngrok http 5173"

echo.
echo All servers started!
echo.
echo Three windows opened:
echo   1. Backend Server (Port 5000)
echo   2. Frontend Server (Port 5173)
echo   3. ngrok Tunnel (Public URL)
echo.
echo Copy the ngrok URL from window 3 and share it!
echo.
pause
