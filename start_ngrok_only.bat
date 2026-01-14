@echo off
echo ========================================
echo   Starting ngrok Tunnel
echo ========================================
echo.
echo Make sure your servers are running:
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo.
echo Starting ngrok...
echo.
echo ========================================
echo   COPY THE URL BELOW AND SHARE IT!
echo ========================================
echo.

.\ngrok http 5173
