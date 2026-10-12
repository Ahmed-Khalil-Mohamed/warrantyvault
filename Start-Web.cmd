@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js 24 or newer first. & pause & exit /b 1)
if not exist node_modules (call npm ci || exit /b 1)
if not exist dist-server\main.js (call npm run build || exit /b 1)
echo Open http://localhost:4317
call npm start
