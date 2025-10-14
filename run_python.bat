@echo off
REM Script per eseguire comandi Python nell'ambiente virtuale
REM Uso: run_python.bat <script.py> [argomenti]

set VENV_PYTHON=C:\Users\nicol\Desktop\scontrini_10\.venv\Scripts\python.exe

if "%1"=="" (
    echo Uso: run_python.bat ^<script.py^> [argomenti]
    echo.
    echo Esempi:
    echo   run_python.bat test_api.py
    echo   run_python.bat check_config.py
    echo   run_python.bat start.py
    exit /b 1
)

%VENV_PYTHON% %*
