@echo off
echo ==========================================
echo    10Root MFA Suite - Starting All Services
echo ==========================================
echo.

:: Get the directory where this batch file is located
set "BASEDIR=%~dp0"

:: Kill any existing Node.js processes to free up ports
echo Stopping any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting PushAppServer on port 5555...
start "PushAppServer" cmd /k "cd /d %BASEDIR%PushAppServer && node r.js -r -z 5555 -v demo_password -f 10 -l"

:: Wait 3 seconds for PushAppServer to start
timeout /t 3 /nobreak >nul

echo Starting RadiusServer on UDP port 8888...
start "RadiusServer" cmd /k "cd /d %BASEDIR%RadiusServer && node ser.js --jsonSettings settings.json"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Ask user about tunnel mode
echo.
echo ==========================================
echo    Mobile App Connection Mode
echo ==========================================
echo.
echo    [1] Normal mode (same WiFi network)
echo    [2] Tunnel mode (works through firewalls)
echo.
set /p TUNNEL_CHOICE="Choose mode (1 or 2): "

if "%TUNNEL_CHOICE%"=="2" (
    echo Starting PushAppClient with TUNNEL mode...
    start "PushAppClient" cmd /k "cd /d %BASEDIR%PushAppClient && npx expo start --tunnel"
) else (
    echo Starting PushAppClient in normal mode...
    start "PushAppClient" cmd /k "cd /d %BASEDIR%PushAppClient && npx expo start"
)

echo.
echo ==========================================
echo    All services started!
echo ==========================================
echo.
echo    PushAppServer:  http://localhost:5555
echo    RadiusServer:   UDP port 8888
echo    PushAppClient:  Scan QR with Expo Go
echo.
echo    Press any key to close this window...
pause >nul
