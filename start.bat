@echo off
title Scroll-Learn

echo Starting Backend...
cd /d "%~dp0backend"
start "Backend" cmd /k "npm install && npm run dev"

echo Starting Frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm install && npm run dev"

echo Waiting for Vite to start...
timeout /t 5 /nobreak >nul

start chrome "http://localhost:5173"

echo Done. App should be opening in Chrome.
