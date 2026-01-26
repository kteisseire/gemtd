@echo off
chcp 65001 >nul
cls
color 0A
title Tower Defense - Serveurs

echo.
echo ╔════════════════════════════════════════╗
echo ║     TOWER DEFENSE - Démarrage          ║
echo ╚════════════════════════════════════════╝
echo.
echo Démarrage des serveurs...
echo.

cd /d "%~dp0"

start "Tower Defense - API" cmd /k "echo API Server (Port 3001) && echo. && node server/index.js"

timeout /t 2 /nobreak >nul

start "Tower Defense - Frontend" cmd /k "echo Frontend Dev Server (Port 5176) && echo. && npm run dev -- --host"

timeout /t 3 /nobreak >nul

echo.
echo ✓ Serveurs lancés !
echo.
echo ┌─────────────────────────────────────┐
echo │  Ouvrez votre navigateur sur :     │
echo │  http://localhost:5176              │
echo └─────────────────────────────────────┘
echo.
echo Deux fenêtres se sont ouvertes :
echo  - API Server (port 3001)
echo  - Frontend (port 5176)
echo.
echo Fermez ces fenêtres pour arrêter les serveurs.
echo.
pause
