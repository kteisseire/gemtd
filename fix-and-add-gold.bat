@echo off
echo ================================================
echo Script d'ajout de la gemme GOLD
echo ================================================
echo.

echo 1. Recherche du serveur API...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Arret du serveur API (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 2. Attente de la liberation de la base de donnees...
timeout /t 3 /nobreak >nul

echo.
echo 3. Suppression de la base de donnees...
del "%~dp0server\game.db" >nul 2>&1
if exist "%~dp0server\game.db" (
    echo ERREUR: Impossible de supprimer la base de donnees
    echo La base est peut-etre encore verrouillee
    echo.
    echo Solution: Redemarrez votre ordinateur et relancez ce script
    pause
    exit /b 1
)

echo.
echo 4. Demarrage du serveur API...
start /B node "%~dp0server\index.js" >nul 2>&1

echo.
echo 5. Attente du demarrage du serveur...
timeout /t 3 /nobreak >nul

echo.
echo 6. Ajout de la gemme GOLD...
curl -X POST http://localhost:3001/api/gems -H "Content-Type: application/json" -d "{\"id\":\"GOLD\",\"name\":\"Or\",\"color\":\"#ffd700\",\"damage\":200,\"speed\":500,\"range\":180,\"effect\":\"all\",\"icon\":\"💰\",\"is_droppable\":0,\"is_base\":0}" 2>nul

echo.
echo 7. Ajout de la recette de fusion GOLD...
curl -X POST http://localhost:3001/api/recipes -H "Content-Type: application/json" -d "{\"result_gem_id\":\"GOLD\",\"required_gems\":\"SILVER,RED,ORANGE\",\"min_count\":3}" 2>nul

echo.
echo.
echo ================================================
echo TERMINE!
echo ================================================
echo.
echo La gemme GOLD a ete ajoutee avec succes.
echo Rechargez la page du jeu pour voir les changements.
echo.
pause
