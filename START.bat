@echo off
echo.
echo  ==========================================
echo   CS2 Market Pro - Iniciando servidores...
echo  ==========================================
echo.

start "CS2 Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul
start "CS2 Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo  Backend: http://localhost:3001/api/health
echo  Frontend: http://localhost:5173
echo.

start http://localhost:5173
