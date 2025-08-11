@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ------------------------------------------------------------
echo BVOTE - Dev environment setup (Windows CMD)
echo ------------------------------------------------------------

REM 1) Collect inputs (with reasonable defaults)
set "SITE_ID_DEFAULT=0b6bf062-8279-4684-aec3-57268a976e93"
set "SITE_ID="
set /p SITE_ID=Enter Netlify Site ID [!SITE_ID_DEFAULT!]:
if "!SITE_ID!"=="" set "SITE_ID=!SITE_ID_DEFAULT!"

set "VITE_LOGIN_BOT_ENABLED_DEFAULT=true"
set "VITE_LOGIN_BOT_ENABLED="
set /p VITE_LOGIN_BOT_ENABLED=Enable login bot [true/false, default !VITE_LOGIN_BOT_ENABLED_DEFAULT!]:
if "!VITE_LOGIN_BOT_ENABLED!"=="" set "VITE_LOGIN_BOT_ENABLED=!VITE_LOGIN_BOT_ENABLED_DEFAULT!"

set "VITE_USE_MORELOGIN_DEFAULT=true"
set "VITE_USE_MORELOGIN="
set /p VITE_USE_MORELOGIN=Use MoreLogin integration [true/false, default !VITE_USE_MORELOGIN_DEFAULT!]:
if "!VITE_USE_MORELOGIN!"=="" set "VITE_USE_MORELOGIN=!VITE_USE_MORELOGIN_DEFAULT!"

set "VITE_LOGIN_BOT_ENDPOINT="
set /p VITE_LOGIN_BOT_ENDPOINT=Custom login-bot endpoint [blank to auto-detect]:

set "VITE_AGENT_URL="
set /p VITE_AGENT_URL=Agent URL (optional, leave blank if none):

set "MORELOGIN_BASE_URL_DEFAULT=http://127.0.0.1:40000"
set "MORELOGIN_BASE_URL="
set /p MORELOGIN_BASE_URL=MoreLogin base URL [default !MORELOGIN_BASE_URL_DEFAULT!]:
if "!MORELOGIN_BASE_URL!"=="" set "MORELOGIN_BASE_URL=!MORELOGIN_BASE_URL_DEFAULT!"

set "MORELOGIN_API_ID="
set /p MORELOGIN_API_ID=MoreLogin API ID (optional):

set "MORELOGIN_API_KEY="
set /p MORELOGIN_API_KEY=MoreLogin API KEY (optional):

set "TELEGRAM_BOT_TOKEN="
set /p TELEGRAM_BOT_TOKEN=Telegram BOT TOKEN (optional):

set "TELEGRAM_CHAT_ID="
set /p TELEGRAM_CHAT_ID=Telegram CHAT ID (optional):

set "LOG_WEBHOOK_URL="
set /p LOG_WEBHOOK_URL=Log webhook URL (optional):

echo.
echo Writing .env.local for Vite ...
(
  echo VITE_LOGIN_BOT_ENABLED=!VITE_LOGIN_BOT_ENABLED!
  if not "!VITE_LOGIN_BOT_ENDPOINT!"=="" echo VITE_LOGIN_BOT_ENDPOINT=!VITE_LOGIN_BOT_ENDPOINT!
  echo VITE_USE_MORELOGIN=!VITE_USE_MORELOGIN!
  if not "!VITE_AGENT_URL!"=="" echo VITE_AGENT_URL=!VITE_AGENT_URL!
) > .env.local

echo Writing .env for Functions ...
(
  echo MORELOGIN_BASE_URL=!MORELOGIN_BASE_URL!
  if not "!MORELOGIN_API_ID!"=="" echo MORELOGIN_API_ID=!MORELOGIN_API_ID!
  if not "!MORELOGIN_API_KEY!"=="" echo MORELOGIN_API_KEY=!MORELOGIN_API_KEY!
  if not "!TELEGRAM_BOT_TOKEN!"=="" echo TELEGRAM_BOT_TOKEN=!TELEGRAM_BOT_TOKEN!
  if not "!TELEGRAM_CHAT_ID!"=="" echo TELEGRAM_CHAT_ID=!TELEGRAM_CHAT_ID!
  if not "!LOG_WEBHOOK_URL!"=="" echo LOG_WEBHOOK_URL=!LOG_WEBHOOK_URL!
) > .env

echo Ensuring Netlify state link ...
if not exist .netlify mkdir .netlify 2^>NUL
(
  echo {"siteId": "!SITE_ID!"}
) > .netlify\state.json

echo.
echo Installing dependencies ...
call npm i
call npm i -E @netlify/functions@latest puppeteer-core@latest

echo.
echo Setup complete.
echo   - Vite env:      .env.local
echo   - Functions env: .env
echo   - Netlify site:  .netlify\state.json (^!SITE_ID^!)
echo.
set "CHOICE=Y"
set /p CHOICE=Start Netlify Dev now? [Y/n]:
if /I "!CHOICE!"=="N" goto :end

echo Starting Netlify Dev on http://localhost:8888 ...
npx netlify-cli@latest dev --port 8888 --target-port 5173 --functions netlify/functions --framework vite --live=false

:end
echo Done.
endlocal
