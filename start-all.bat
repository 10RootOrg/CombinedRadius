@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    10Root MFA Suite - Setup and Start
echo ==========================================
echo.

:: Get the directory where this batch file is located
set "BASEDIR=%~dp0"

:: ==========================================
:: STEP 1: Kill existing processes
:: ==========================================
echo [1/6] Stopping any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done.
echo.

:: ==========================================
:: STEP 2: Check and install dependencies
:: ==========================================
echo [2/6] Checking dependencies...

:: Check PushAppServer
if not exist "%BASEDIR%PushAppServer\node_modules" (
    echo       Installing PushAppServer dependencies...
    cd /d "%BASEDIR%PushAppServer"
    call npm install >nul 2>&1
    echo       PushAppServer dependencies installed.
) else (
    echo       PushAppServer dependencies OK.
)

:: Check RadiusServer
if not exist "%BASEDIR%RadiusServer\node_modules" (
    echo       Installing RadiusServer dependencies...
    cd /d "%BASEDIR%RadiusServer"
    call npm install >nul 2>&1
    echo       RadiusServer dependencies installed.
) else (
    echo       RadiusServer dependencies OK.
)

:: Check PushAppClient
if not exist "%BASEDIR%PushAppClient\node_modules" (
    echo       Installing PushAppClient dependencies...
    cd /d "%BASEDIR%PushAppClient"
    call npm install >nul 2>&1
    echo       PushAppClient dependencies installed.
) else (
    echo       PushAppClient dependencies OK.
)
echo.

:: ==========================================
:: STEP 3: Check/Generate RSA Keys
:: ==========================================
echo [3/6] Checking RSA keys...
if not exist "%BASEDIR%PushAppServer\10Root-privateKey.pem" (
    echo       Generating RSA keys...
    cd /d "%BASEDIR%PushAppServer"
    node r.js -g.path "." -g.company "10Root" >nul 2>&1
    echo       Keys generated:
    echo         - 10Root-privateKey.pem
    echo         - 10Root-public.pem
    echo         - 10Root-qrCode.png (scan this with mobile app)
) else (
    echo       RSA keys exist.
    echo         - 10Root-privateKey.pem
    echo         - 10Root-qrCode.png
)
echo.

:: ==========================================
:: STEP 4: Check port availability
:: ==========================================
echo [4/6] Checking port availability...

:: Check port 5555
netstat -ano | findstr ":5555" >nul 2>&1
if %errorlevel%==0 (
    echo       WARNING: Port 5555 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5555" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo       Port 5555: OK

:: Check port 8888
netstat -ano | findstr ":8888" >nul 2>&1
if %errorlevel%==0 (
    echo       WARNING: Port 8888 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8888" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo       Port 8888: OK
echo.

:: ==========================================
:: STEP 5: Start Servers
:: ==========================================
echo [5/6] Starting servers...

:: Start PushAppServer (equivalent to RestApi.bat)
echo       Starting PushAppServer on port 5555...
start "PushAppServer - Port 5555" cmd /k "cd /d %BASEDIR%PushAppServer && echo PushAppServer starting... && node r.js -r -z 5555 -v demo_password -f 10 -l"
timeout /t 3 /nobreak >nul

:: Start RadiusServer (equivalent to Turn on radius.bat)
echo       Starting RadiusServer on UDP port 8888...
start "RadiusServer - Port 8888" cmd /k "cd /d %BASEDIR%RadiusServer && echo RadiusServer starting... && node ser.js --jsonSettings settings.json"
timeout /t 2 /nobreak >nul

echo       Servers started.
echo.

:: ==========================================
:: STEP 6: Mobile App
:: ==========================================
echo [6/6] Mobile App Setup
echo.
echo    ==========================================
echo       Connection Mode for Mobile App
echo    ==========================================
echo.
echo    [1] Normal mode - Same WiFi network
echo    [2] Tunnel mode - Works through firewalls
echo    [3] Skip - Don't start mobile app
echo.
set /p TUNNEL_CHOICE="   Choose (1, 2, or 3): "

if "%TUNNEL_CHOICE%"=="3" (
    echo       Skipping mobile app.
) else if "%TUNNEL_CHOICE%"=="2" (
    echo       Starting PushAppClient with TUNNEL mode...
    start "PushAppClient - Expo Tunnel" cmd /k "cd /d %BASEDIR%PushAppClient && npx expo start --tunnel"
) else (
    echo       Starting PushAppClient in normal mode...
    start "PushAppClient - Expo" cmd /k "cd /d %BASEDIR%PushAppClient && npx expo start"
)

echo.
echo ==========================================
echo    ALL SERVICES STARTED!
echo ==========================================
echo.
echo    Services Running:
echo    -----------------
echo    PushAppServer:  http://localhost:5555
echo    RadiusServer:   UDP port 8888
echo    PushAppClient:  Scan QR code with Expo Go
echo.
echo    Next Steps:
echo    -----------
echo    1. Open Expo Go on your phone
echo    2. Scan the QR code from the PushAppClient window
echo    3. In the app, go to Options and scan:
echo       %BASEDIR%PushAppServer\10Root-qrCode.png
echo    4. Copy your Phone ID from the app
echo    5. Add it to: %BASEDIR%RadiusServer\settings.json
echo       in the "PHONELIST" field
echo.
echo    Test with NTRadPing:
echo    --------------------
echo    Server: 127.0.0.1
echo    Port: 8888
echo    Secret: testing123
echo    User: testuser@domain.com
echo.
echo ==========================================
pause
