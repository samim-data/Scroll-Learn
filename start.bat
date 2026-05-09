@echo off
setlocal

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

:: ── Guard: node & npm ─────────────────────────────────────────────────────────
where node >nul 2>&1 || (echo [error] node not found. Install Node.js 18+. & exit /b 1)
where npm  >nul 2>&1 || (echo [error] npm not found. & exit /b 1)
for /f "tokens=*" %%v in ('node -v') do echo [start] Node %%v

:: ── Backend .env ──────────────────────────────────────────────────────────────
if not exist "%BACKEND%\.env" (
  echo [warn]  backend\.env not found - creating template. Fill in values before use.
  (
    echo PORT=3001
    echo SUPABASE_URL=
    echo SUPABASE_ANON_KEY=
    echo YOUTUBE_API_KEY=
    echo OPENROUTER_API_KEY=
    echo REFRESH_SECRET=
  ) > "%BACKEND%\.env"
)

:: ── Frontend .env ─────────────────────────────────────────────────────────────
if not exist "%FRONTEND%\.env" (
  echo [warn]  frontend\.env not found - creating with default local backend URL.
  echo VITE_API_URL=http://localhost:3001/api > "%FRONTEND%\.env"
)

:: ── Install dependencies ──────────────────────────────────────────────────────
if not exist "%BACKEND%\node_modules" (
  echo [start] Installing backend dependencies...
  pushd "%BACKEND%" && npm install && popd
)

if not exist "%FRONTEND%\node_modules" (
  echo [start] Installing frontend dependencies...
  pushd "%FRONTEND%" && npm install && popd
)

:: ── Start both services in separate windows ───────────────────────────────────
echo.
echo [start] Backend  ^-^> http://localhost:3001
echo [start] Frontend ^-^> http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop.
echo.

start "Scroll-Learn Backend"  cmd /k "cd /d "%BACKEND%" && npm run dev"
start "Scroll-Learn Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"
