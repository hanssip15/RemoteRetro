@echo off
echo RetroSprint Refactor Setup
echo ========================================

echo.
echo Installing root dependencies...
call npm install

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo To start development servers:
echo   npm run dev
echo.
echo Frontend will run on: http://localhost:5173
echo Backend will run on: http://localhost:3001
echo.
echo Don't forget to:
echo 1. Set up your DATABASE_URL in backend/.env
echo 2. Run database scripts if needed
echo.
pause 