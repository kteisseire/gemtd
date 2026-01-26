@echo off
echo Arret de tous les serveurs Node.js...
taskkill /F /IM node.exe >nul 2>&1
echo Serveurs arretes !
timeout /t 2 /nobreak >nul
