@echo off
setlocal
set "PORT=%~1"
if "%PORT%"=="" (
  echo Usage: kill-port.cmd ^<port^>
  exit /b 1
)

set "PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  set "PID=%%a"
)

if not defined PID (
  echo [kill-port] No process is listening on port %PORT%.
  exit /b 0
)

echo [kill-port] Killing PID %PID% on port %PORT% ...
taskkill /PID %PID% /F >NUL 2>&1
exit /b 0
endlocal
