@echo off
REM SIRINX Solar Energy — Deploy Cloudflare Workers
REM Usage: scripts\deploy-cloudflare.bat [staging]

setlocal

set ENV=%1
if "%ENV%"=="" set ENV=production

echo ============================================
echo   SIRINX Cloudflare Workers Deploy
echo   Environment: %ENV%
echo ============================================
echo.

REM Check wrangler is installed
where wrangler >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] wrangler not found. Install with: npm install -g wrangler
    exit /b 1
)

REM Check login
wrangler whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Not logged in. Running wrangler login...
    wrangler login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed
        exit /b 1
    )
)

echo [1/3] Deploying API Proxy Worker...
if "%ENV%"=="staging" (
    wrangler deploy --config cloudflare\worker-api-proxy\wrangler.toml --env staging
) else (
    wrangler deploy --config cloudflare\worker-api-proxy\wrangler.toml
)
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] API Proxy deploy failed
    exit /b 1
)
echo [OK] API Proxy deployed
echo.

echo [2/3] Deploying SEO Pages Worker...
if "%ENV%"=="staging" (
    wrangler deploy --config cloudflare\worker-seo-pages\wrangler.toml --env staging
) else (
    wrangler deploy --config cloudflare\worker-seo-pages\wrangler.toml
)
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] SEO Pages deploy failed
    exit /b 1
)
echo [OK] SEO Pages deployed
echo.

echo [3/3] Deploying Image Optimizer Worker...
if "%ENV%"=="staging" (
    wrangler deploy --config cloudflare\worker-image-optimizer\wrangler.toml --env staging
) else (
    wrangler deploy --config cloudflare\worker-image-optimizer\wrangler.toml
)
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Image Optimizer deploy failed
    exit /b 1
)
echo [OK] Image Optimizer deployed
echo.

echo ============================================
echo   Deploy complete!
echo ============================================
echo.
echo Workers deployed:
echo   - sirinx-api-proxy       (sirinx.com/api/*)
echo   - sirinx-seo-pages       (sirinx.com/solar/*)
echo   - sirinx-image-optimizer (cdn.sirinx.com/img*)
echo.
echo Monitor logs:
echo   wrangler tail sirinx-api-proxy
echo   wrangler tail sirinx-seo-pages
echo   wrangler tail sirinx-image-optimizer

endlocal
