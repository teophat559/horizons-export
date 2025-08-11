@echo off
REM Deploy User to Netlify (requires Netlify CLI login)
REM Set required env before run or edit below
REM set VITE_API_URL=https://api.yourdomain.com
set VITE_BASE_PATH=/
set VITE_OUT_DIR=dist

if "%VITE_API_URL%"=="" (
	echo [WARN] VITE_API_URL chua duoc dat. Nen dat URL API cong khai (VD: https://api.yourdomain.com)
)

call npm ci || goto :eof
call npm run build || goto :eof

npx netlify deploy --dir=dist --prod
