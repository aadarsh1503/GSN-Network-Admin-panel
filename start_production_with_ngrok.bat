@echo off
echo ========================================
echo   Production Build + ngrok
echo ========================================
echo.
echo This uses production build (fewer requests)
echo Better for sharing with ngrok free plan!
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul

echo [2/3] Building Frontend...
cd client
call npm run build
echo.
echo Build complete!
echo.

echo [3/3] Starting Production Server...
start "Production Server" cmd /k "cd client && npx serve -s build -l 5173"
timeout /t 5 /nobreak >nul

echo [4/4] Starting ngrok...
cd ..
start "ngrok Tunnel" cmd /k ".\ngrok http 5173"

echo.
echo ========================================
echo   All servers started!
echo ========================================
echo.
echo Production build uses MUCH fewer requests
echo Better for ngrok free plan limits
echo.
echo Copy the ngrok URL and share it!
echo.
pause
