@echo off
echo Installing CORS package...
cd server
npm install cors
echo.
echo CORS package installed successfully!
echo.
echo Now restart your backend server:
echo   cd server
echo   npm run dev
pause
