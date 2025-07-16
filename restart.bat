@echo off
echo Restarting RetroSprint Project...
echo.

echo Stopping existing processes...
taskkill /f /im node.exe 2>nul

echo.
echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run start:dev"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Project is restarting...
echo Backend will be available at: http://localhost:3000
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to exit this script...
pause > nul 