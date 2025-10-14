# Script di attivazione ambiente virtuale e comandi utili
# Uso: . .\activate_env.ps1

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host "   🍕 Sistema Scontrini POS - Ambiente Virtuale" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 58) -ForegroundColor Cyan
Write-Host ""

# Attiva l'ambiente virtuale
& "C:\Users\nicol\Desktop\scontrini_10\.venv\Scripts\Activate.ps1"

Write-Host "✅ Ambiente virtuale attivato!" -ForegroundColor Green
Write-Host ""
Write-Host "Comandi disponibili:" -ForegroundColor Yellow
Write-Host "  python test_api.py       - Test connettività API"
Write-Host "  python check_config.py   - Verifica configurazione"
Write-Host "  python start.py          - Avvia applicazione"
Write-Host "  python app.py            - Avvia applicazione (alternativo)"
Write-Host "  deactivate               - Disattiva ambiente virtuale"
Write-Host ""
