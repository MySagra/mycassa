# Script PowerShell per eseguire comandi Python nell'ambiente virtuale
# Uso: .\run_python.ps1 <script.py> [argomenti]

$VENV_PYTHON = "C:\Users\nicol\Desktop\scontrini_10\.venv\Scripts\python.exe"

if ($args.Count -eq 0) {
    Write-Host "Uso: .\run_python.ps1 <script.py> [argomenti]"
    Write-Host ""
    Write-Host "Esempi:"
    Write-Host "  .\run_python.ps1 test_api.py"
    Write-Host "  .\run_python.ps1 check_config.py"
    Write-Host "  .\run_python.ps1 start.py"
    exit 1
}

& $VENV_PYTHON $args
