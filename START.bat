@echo off
cls
color 0A
echo.
echo ========================================
echo    TOWER DEFENSE - Demarrage
echo ========================================
echo.
echo Lancement des serveurs...
echo.
echo - API Server: http://localhost:3001
echo - Dev Server: http://localhost:5176
echo.
echo Une fois demarre, ouvrez:
echo   http://localhost:5176
echo.
echo Pour arreter: Ctrl+C
echo ========================================
echo.
pause
npm run dev
