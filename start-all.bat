@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    10Root MFA Suite - Setup and Start
echo ==========================================
echo.

:: Get the directory where this batch file is located
set "BASEDIR=%~dp0"

:: ==========================================
:: CHECK: Node.js Installation
:: ==========================================
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ==========================================
    echo    ERROR: Node.js is not installed!
    echo ==========================================
    echo.
    echo    Please install Node.js v18 or higher:
    echo    https://nodejs.org/en/download/
    echo.
    echo    After installing, restart this script.
    echo ==========================================
    echo.
    pause
    exit /b 1
)

:: Show Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Node.js %NODE_VERSION% detected.
echo.

:: ==========================================
:: STEP 1: Kill existing processes
:: ==========================================
echo [1/5] Stopping any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done.
echo.

:: ==========================================
:: STEP 2: Check and install dependencies
:: ==========================================
echo [2/5] Checking dependencies...

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
echo [3/5] Checking RSA keys...
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
echo [4/5] Checking port availability...

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
echo [5/5] Starting servers...

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

:: Start PushAppClient (Expo - WiFi mode)
echo       Starting PushAppClient...
start "PushAppClient - Expo" cmd /k "cd /d %BASEDIR%PushAppClient && npx expo start"

echo ==========================================
echo    ALL SERVICES STARTED!
echo ==========================================
echo.
echo    Services Running:
echo    -----------------
echo    PushAppServer:  http://localhost:5555
echo    RadiusServer:   UDP port 8888
echo    PushAppClient:  Expo (WiFi mode)
echo.
echo    Test with: .\test-mfa.ps1
echo.
echo ==========================================
pause
