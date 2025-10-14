# 🚀 GUIDA RAPIDA - Come Eseguire l'Applicazione

## ⚠️ Problema: "Python non è stato trovato"

Questo errore si verifica quando provi a usare `python` direttamente da PowerShell/CMD, ma devi usare il Python dell'**ambiente virtuale**.

## ✅ Soluzioni

### **Opzione 1: Attiva l'ambiente virtuale (Consigliato)**

In PowerShell:
```powershell
# Attiva l'ambiente virtuale
.\.venv\Scripts\Activate.ps1

# Oppure usa lo script helper
. .\activate_env.ps1

# Ora puoi usare python normalmente
python test_api.py
python check_config.py
python start.py
```

### **Opzione 2: Usa il percorso completo**

```powershell
C:\Users\nicol\Desktop\scontrini_10\.venv\Scripts\python.exe test_api.py
```

### **Opzione 3: Usa gli script helper**

Ho creato degli script per facilitare l'esecuzione:

#### PowerShell:
```powershell
.\run_python.ps1 test_api.py
.\run_python.ps1 check_config.py
.\run_python.ps1 start.py
```

#### CMD/Batch:
```cmd
run_python.bat test_api.py
run_python.bat check_config.py
run_python.bat start.py
```

## 📝 Comandi Utili

### Test e Verifica
```powershell
# Attiva ambiente
. .\activate_env.ps1

# Verifica configurazione
python check_config.py

# Test completo API
python test_api.py

# Avvia applicazione
python start.py
```

### Disattivare Ambiente Virtuale
```powershell
deactivate
```

## 🎯 Workflow Consigliato

1. **Prima volta / Nuova sessione PowerShell:**
   ```powershell
   cd C:\Users\nicol\Desktop\scontrini_10
   . .\activate_env.ps1
   ```

2. **Test configurazione:**
   ```powershell
   python check_config.py
   ```

3. **Test API (opzionale):**
   ```powershell
   python test_api.py
   ```

4. **Avvia applicazione:**
   ```powershell
   python start.py
   ```

5. **Quando hai finito:**
   ```powershell
   deactivate
   ```

## 📊 Output Atteso

### check_config.py
```
============================================================
   🔍 CONFIGURAZIONE ENDPOINT API
============================================================

📡 Base URL: http://localhost:4300

📌 Endpoint configurati:
   ├─ Login:      http://localhost:4300/auth/login
   ├─ Categories: http://localhost:4300/v1/categories
   ├─ Foods:      http://localhost:4300/v1/foods
   └─ Orders:     http://localhost:4300/v1/orders
```

### test_api.py
```
==================================================
   TEST CONNETTIVITÀ API REST
==================================================

🔍 Test connessione API: http://localhost:4300
--------------------------------------------------
✅ API raggiungibile (Status: 200)

👤 Inserisci le credenziali per testare il login:
Username: [inserisci username]
Password: [inserisci password]

✅ Login riuscito!
✅ Categorie recuperate
✅ Prodotti recuperati
```

### start.py
```
============================================================
   🍕 SCONTRINI POS - Sistema di gestione ordini
============================================================

📡 API Base URL: http://localhost:4300
🔐 Autenticazione: JWT Token
🌐 Server: http://0.0.0.0:7010

💡 Prima di usare l'applicazione:
   1. Assicurati che l'API REST sia avviata
   2. Accedi a http://localhost:7010/login
   3. Inserisci le credenziali per autenticarti
```

## 🔧 Troubleshooting

### "Activate.ps1 cannot be loaded"
Se ricevi errori di esecuzione script in PowerShell:
```powershell
# Esegui come amministratore
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Python non è stato trovato"
- **NON** usare `python` direttamente
- Attiva prima l'ambiente virtuale con `. .\activate_env.ps1`
- Oppure usa `.\run_python.ps1 <script>`

### Ambiente virtuale non si attiva
Verifica che esista la cartella `.venv`:
```powershell
Test-Path .\.venv\Scripts\python.exe
```

Se restituisce `False`, ricrea l'ambiente virtuale:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 📌 Note Importanti

- L'ambiente virtuale mantiene le dipendenze isolate
- Ogni nuova sessione PowerShell richiede la riattivazione
- Gli script `run_python.*` funzionano anche senza attivare l'ambiente
- Lo script `activate_env.ps1` mostra comandi utili dopo l'attivazione

---

**Per assistenza**, consulta:
- `QUICKSTART.md` - Guida completa
- `API_MIGRATION.md` - Dettagli tecnici
- `AGGIORNAMENTO_COMPLETATO.md` - Riepilogo modifiche
