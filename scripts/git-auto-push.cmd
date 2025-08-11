@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Usage: scripts\git-auto-push.cmd <repo-url> [branch]
REM Example: scripts\git-auto-push.cmd https://github.com/USERNAME/REPO.git main

if "%~1"=="" (
  echo Usage: %~nx0 ^<repo-url^> [branch]
  exit /b 1
)

set REPO_URL=%~1
set BRANCH=%~2
if "%BRANCH%"=="" set BRANCH=main

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not installed or not in PATH.
  echo Download: https://git-scm.com/download/win
  exit /b 2
)

cd /d "%~dp0.." || exit /b 1

REM Initialize if needed
if not exist .git (
  git init || exit /b 1
)

REM Basic user config guard (skip if already set)
for /f "tokens=2 delims==" %%A in ('git config user.name 2^>nul ^| findstr /r ".*"') do set GIT_USER=%%A
for /f "tokens=2 delims==" %%A in ('git config user.email 2^>nul ^| findstr /r ".*"') do set GIT_EMAIL=%%A
if "%GIT_USER%"=="" (
  echo [INFO] git user.name is not set. Setting a placeholder.
  git config user.name "Your Name" >nul 2>nul
)
if "%GIT_EMAIL%"=="" (
  echo [INFO] git user.email is not set. Setting a placeholder.
  git config user.email "you@example.com" >nul 2>nul
)

REM Ensure .gitignore present
if not exist .gitignore (
  echo node_modules/>> .gitignore
  echo dist/>> .gitignore
  echo backend/.env>> .gitignore
)

REM Add remote origin (idempotent)
for /f "delims=" %%R in ('git remote 2^>nul') do set HAS_REMOTE=1
if not defined HAS_REMOTE (
  git remote add origin "%REPO_URL%" 2>nul
) else (
  git remote set-url origin "%REPO_URL%" 2>nul
)

REM Stage and commit
git add -A || exit /b 1

for /f %%C in ('git rev-parse --verify HEAD 2^>nul ^| findstr /r ".*"') do set HAS_COMMIT=1
if defined HAS_COMMIT (
  git commit -m "chore: update" || echo [INFO] Nothing to commit.
) else (
  git commit -m "feat: initial commit" || echo [INFO] Nothing to commit.
)

git branch -M %BRANCH% 2>nul

echo Pushing to %REPO_URL% on branch %BRANCH% ...
git push -u origin %BRANCH%
set ERR=%ERRORLEVEL%
if not %ERR%==0 (
  echo [HINT] If prompted for credentials, use a GitHub PAT as password when pushing over HTTPS.
)
exit /b %ERR%
