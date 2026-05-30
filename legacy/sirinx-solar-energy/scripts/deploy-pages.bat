@echo off
REM SIRINX Solar Energy — Deploy to Cloudflare Pages
REM Usage: scripts\deploy-pages.bat [branch-name]
REM   branch-name defaults to "main" (production)

setlocal

set BRANCH=%1
if "%BRANCH%"=="" set BRANCH=main
set PROJECT=sirinx-solar-pages
set BUILD_DIR=sirinx-app\out

echo ============================================
echo   SIRINX Cloudflare Pages Deploy
echo   Project: %PROJECT%
echo   Branch:  %BRANCH%
echo ============================================
echo.

REM Check wrangler
where wrangler >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] wrangler not found. Install: npm install -g wrangler
    exit /b 1
)

REM Check Node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found
    exit /b 1
)

echo [1/2] Building Next.js...
cd sirinx-app
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    cd ..
    exit /b 1
)
cd ..
echo [OK] Build complete — output: %BUILD_DIR%
echo.

echo [2/2] Deploying to Cloudflare Pages...
if "%BRANCH%"=="main" (
    wrangler pages deploy %BUILD_DIR% --project-name %PROJECT% --branch main
) else (
    wrangler pages deploy %BUILD_DIR% --project-name %PROJECT% --branch %BRANCH%
)
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pages deploy failed
    exit /b 1
)

echo.
echo ============================================
echo   Pages deploy complete!
echo ============================================
echo.
echo View deployments:
echo   https://dash.cloudflare.com/pages/%PROJECT%
echo.
echo Production URL: https://sirinx.com

endlocal
