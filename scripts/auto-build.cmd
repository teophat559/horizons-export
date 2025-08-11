@echo off
setlocal enabledelayedexpansion

echo 🚀 Auto Build Script for Windows
echo.

:: Parse command line arguments
set "BUILD_ADMIN="
set "BUILD_USER="
set "WATCH_MODE="
set "CLEAN_MODE="
set "DEPLOY_MODE="

:parse_args
if "%~1"=="" goto :end_parse
if "%~1"=="--admin" set "BUILD_ADMIN=1"
if "%~1"=="--user" set "BUILD_USER=1"
if "%~1"=="--watch" set "WATCH_MODE=1"
if "%~1"=="--clean" set "CLEAN_MODE=1"
if "%~1"=="--deploy" set "DEPLOY_MODE=1"
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help
shift
goto :parse_args

:end_parse

:: Show current options
echo Options:
echo   Admin Build: %BUILD_ADMIN%
echo   User Build: %BUILD_USER%
echo   Watch Mode: %WATCH_MODE%
echo   Clean Mode: %CLEAN_MODE%
echo   Deploy Mode: %DEPLOY_MODE%
echo.

:: Run preflight checks
echo [%time%] Running preflight checks...
call npm run preflight
if errorlevel 1 (
    echo [%time%] Preflight checks failed
    exit /b 1
)
echo [%time%] Preflight checks completed

:: Clean admin if needed
if defined BUILD_ADMIN (
    if defined CLEAN_MODE (
        echo [%time%] Cleaning admin build...
        call npm run clean:admin
        if errorlevel 1 (
            echo [%time%] Admin cleanup failed
            exit /b 1
        )
        echo [%time%] Admin cleanup completed
    )
)

:: Build project
echo [%time%] Building project...
if defined BUILD_ADMIN (
    call npm run build:admin
) else if defined BUILD_USER (
    call npm run build:user
) else (
    call npm run build
)

if errorlevel 1 (
    echo [%time%] Build failed
    exit /b 1
)
echo [%time%] Build completed successfully

:: Post-build tasks for admin
if defined BUILD_ADMIN (
    echo [%time%] Purging legacy assets...
    call npm run purge:legacy
    if errorlevel 1 (
        echo [%time%] Legacy assets purge failed, continuing...
    ) else (
        echo [%time%] Legacy assets purged
    )

    echo [%time%] Verifying admin assets...
    call node scripts/verify-admin-assets.mjs
    if errorlevel 1 (
        echo [%time%] Admin assets verification failed, continuing...
    ) else (
        echo [%time%] Admin assets verified
    )
)

:: Deploy if requested
if defined DEPLOY_MODE (
    echo [%time%] Deploying to Netlify...
    if defined BUILD_ADMIN (
        call node scripts/deploy-admin-netlify.mjs
    ) else (
        call node scripts/deploy-user-netlify.mjs
    )
    if errorlevel 1 (
        echo [%time%] Deployment failed
        exit /b 1
    )
    echo [%time%] Deployment completed
)

:: Watch mode
if defined WATCH_MODE (
    echo [%time%] Starting watch mode...
    echo Press Ctrl+C to stop watching
    echo.

    if defined BUILD_ADMIN (
        call npm run build:admin:watch
    ) else if defined BUILD_USER (
        call npm run build:user:watch
    ) else (
        call npm run build:watch
    )
) else (
    echo [%time%] Auto build completed successfully!
)

exit /b 0

:show_help
echo Auto Build Script for Windows
echo.
echo Usage: scripts\auto-build.cmd [options]
echo.
echo Options:
echo   --admin          Build admin version
echo   --user           Build user version
echo   --watch          Watch for file changes and rebuild
echo   --clean          Clean before building
echo   --deploy         Deploy to Netlify after build
echo   --help, -h       Show this help message
echo.
echo Examples:
echo   scripts\auto-build.cmd                    # Build once
echo   scripts\auto-build.cmd --admin --watch    # Build admin with watch
echo   scripts\auto-build.cmd --user --deploy    # Build user and deploy
echo   scripts\auto-build.cmd --admin --watch --deploy  # Full admin build with watch and deploy
echo.
pause
exit /b 0
