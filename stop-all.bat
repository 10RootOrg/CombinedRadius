@echo off
echo ==========================================
echo    10Root MFA Suite - Stopping All Services
echo ==========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo All services stopped.
echo Press any key to close...
pause >nul
