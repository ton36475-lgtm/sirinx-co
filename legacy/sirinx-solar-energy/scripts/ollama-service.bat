@echo off
:: ================================================================
:: SIRINX AI-WarRoom — Ollama Service Manager
:: PRIMARY AI engine — LOCAL, FREE, 24/7
:: ================================================================

setlocal enabledelayedexpansion

set "OLLAMA_HOST=http://localhost:11434"
set "PRIMARY_MODEL=llama3.1:latest"
set "CODE_MODEL=qwen2.5-coder:7b"
set "CODE_MODEL_LARGE=qwen2.5-coder:14b"
set "VISION_MODEL=qwen3-vl:4b"

title SIRINX Ollama Service Manager

echo.
echo ================================================================
echo   SIRINX AI-WarRoom — Ollama Service Manager
echo   PRIMARY: %PRIMARY_MODEL%
echo ================================================================
echo.

:: Check if ollama is installed
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not installed or not in PATH
    echo Install with: winget install Ollama.Ollama
    pause
    exit /b 1
)

:: Check if Ollama server is already running
curl -s -o nul -w "%%{http_code}" http://localhost:11434/api/tags 2>nul | findstr "200" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama server already running at %OLLAMA_HOST%
    goto :check_models
)

echo [INFO] Starting Ollama server...
start /B ollama serve >nul 2>&1

:: Wait for server to start (up to 15 seconds)
set /a attempts=0
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempts+=1
curl -s -o nul -w "%%{http_code}" http://localhost:11434/api/tags 2>nul | findstr "200" >nul 2>&1
if %errorlevel% equ 0 goto :server_ready
if %attempts% geq 15 (
    echo [ERROR] Ollama server failed to start after 15 seconds
    echo Try running manually: ollama serve
    pause
    exit /b 1
)
goto :wait_loop

:server_ready
echo [OK] Ollama server started successfully

:check_models
echo.
echo Checking installed models...
echo.

:: List available models
ollama list

echo.
echo ================================================================
echo   Checking required models...
echo ================================================================
echo.

:: Check and pull primary model
ollama list | findstr "%PRIMARY_MODEL%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [PULL] Downloading %PRIMARY_MODEL% ...
    ollama pull %PRIMARY_MODEL%
) else (
    echo [OK] %PRIMARY_MODEL% ready
)

:: Check qwen2.5-coder:7b
ollama list | findstr "qwen2.5-coder:7b" >nul 2>&1
if %errorlevel% neq 0 (
    echo [PULL] Downloading qwen2.5-coder:7b ...
    ollama pull qwen2.5-coder:7b
) else (
    echo [OK] qwen2.5-coder:7b ready
)

:: Check qwen3-vl:4b
ollama list | findstr "qwen3-vl:4b" >nul 2>&1
if %errorlevel% neq 0 (
    echo [PULL] Downloading qwen3-vl:4b ...
    ollama pull qwen3-vl:4b
) else (
    echo [OK] qwen3-vl:4b ready
)

echo.
echo ================================================================

:: Show GPU/CPU memory info
echo   System Resources:
echo ================================================================
for /f "tokens=2 delims==" %%i in ('wmic computersystem get TotalPhysicalMemory /value') do set RAM_BYTES=%%i
if defined RAM_BYTES (
    set /a RAM_GB=!RAM_BYTES:~0,-9!
    echo   RAM: approximately !RAM_GB! GB
)

:: Check for GPU via NVIDIA SMI
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader 2>nul
if %errorlevel% equ 0 (
    echo   GPU detected above
) else (
    echo   GPU: Not detected - running on CPU
)

echo.
echo ================================================================
echo   Ollama Service Status: RUNNING
echo   Endpoint: %OLLAMA_HOST%
echo   Primary Model: %PRIMARY_MODEL%
echo   Fallback Model: %CODE_MODEL%
echo ================================================================
echo.
echo Press any key to exit (Ollama will continue running in background)
pause >nul
exit /b 0
