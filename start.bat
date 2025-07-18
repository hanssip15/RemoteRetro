@echo off
echo Starting RetroSprint Project...
echo.

echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run start:dev"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo Project is starting...
echo Backend will be available at: 
echo Frontend will be available at:
echo.
echo Press any key to exit this script...
pause > nul 