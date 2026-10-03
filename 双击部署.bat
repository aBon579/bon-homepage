@echo off
cd /d "%~dp0"
echo ==========================================
echo   Deploy to GitHub Pages (commit - push)
echo ==========================================
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
echo.
echo ------------------------------------------
if errorlevel 1 (
  echo [FAILED] See messages above. Press any key to close.
) else (
  echo [DONE] GitHub Pages will update in 1-2 minutes. Press any key to close.
)
pause
