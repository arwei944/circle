@echo off
title Circle (lndev-ui) - App Server [port 3100]
cd /d "%~dp0"

REM If the server is already running on 3100, just open the window.
set "PORT_UP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue; if ($c) { 'UP' }"`) do set "PORT_UP=%%i"

if defined PORT_UP goto open_only

if not exist ".next\BUILD_ID" (
    echo First run: building production bundle, please wait ...
    pnpm build
    if errorlevel 1 (
        echo BUILD FAILED - see output above.
        pause
        exit /b 1
    )
)
echo Starting Circle on http://localhost:3100 ...
echo Closing this window stops the server.
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-app-window.ps1"
pnpm start --port 3100
pause
exit /b 0

:open_only
echo Circle server already running on port 3100.
echo Opening standalone app window...
start "" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-app-window.ps1"
exit /b 0