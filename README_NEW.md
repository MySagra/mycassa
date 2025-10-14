# 🍕 Sistema Scontrini POS - Oratorio di Petosino

Sistema di gestione ordini e scontrini con integrazione API REST e autenticazione JWT.

## 🚀 Quick Start

```bash
# 1. Installa dipendenze
pip install -r requirements.txt

# 2. Configura URL API (opzionale, default: http://localhost:4300)
$env:API_BASE_URL = "http://localhost:4300"

# 3. Avvia l'applicazione
python start.py

# 4. Apri browser
http://localhost:7010/login
```

## 📋 Requisiti

- Python 3.7+
- Flask 3.1.2
- Requests 2.31.0
- PyJWT 2.8.0
- API REST backend in esecuzione

## 🔑 Funzionalità

### Autenticazione
- Login con username/password
- Token JWT per tutte le richieste
- Sessioni sicure con cookie HTTP-only
- Logout automatico alla chiusura

### Gestione Ordini
- Caricamento prodotti da API REST
- Selezione prodotti per categoria
- Personalizzazione pizze (aggiunte/rimozioni ingredienti)
- Calcolo automatico prezzi con extra
- Info tavolo e cliente obbligatorie
- Metodo pagamento (Contanti/POS)
- Calcolatore resto integrato

### Stampa
- Stampa automatica su stampante ESC/POS
- Scontrini HTML scaricabili in ZIP
- Scontrini separati per categoria
- Scontrino totale complessivo
- Codice ordine progressivo

## 📁 Struttura Progetto

```
scontrini_10/
├── app.py                          # Applicazione Flask principale
├── auth.py                         # Modulo autenticazione JWT
├── api_client.py                   # Client per API REST
├── config.py                       # Configurazione endpoint API
├── escpos_send.py                  # Gestione stampante ESC/POS
├── start.py                        # Script di avvio
├── test_api.py                     # Test connettività API
├── check_config.py                 # Verifica configurazione
├── requirements.txt                # Dipendenze Python
├── settings.json                   # Configurazione stampante
├── templates/
│   ├── index.html                  # Interfaccia principale
│   └── login.html                  # Pagina di login
├── static/
│   └── guida.txt                   # Guida rapida
└── data/
    ├── counter.json                # Contatore ordini progressivo
    ├── products.xlsx               # (deprecato, ora usa API)
    └── ordini.xlsx                 # (deprecato, ora usa API)
```

## 🔌 Endpoint API

L'applicazione si integra con i seguenti endpoint:

### Autenticazione
- `POST /auth/login` - Login utente (NO /v1)

### Risorse (con prefisso /v1)
- `GET /v1/categories` - Lista categorie
- `GET /v1/foods` - Lista prodotti
- `POST /v1/orders` - Creazione ordini

## ⚙️ Configurazione

### Variabili d'ambiente
```bash
API_BASE_URL=http://localhost:4300    # URL API REST
SECRET_KEY=your-secret-key            # Chiave sessioni Flask
```

### File config.py
Modifica direttamente il file per configurazioni permanenti.

## 🧪 Test

### Verifica configurazione
```bash
python check_config.py
```

### Test completo API
```bash
python test_api.py
```

Il test verifica:
- ✅ Connessione API
- ✅ Login funzionante  
- ✅ Recupero categorie
- ✅ Recupero prodotti

## 📖 Documentazione

- **QUICKSTART.md** - Guida rapida per iniziare
- **API_MIGRATION.md** - Dettagli tecnici migrazione
- **ENDPOINT_UPDATE.md** - Aggiornamento endpoint API
- **AGGIORNAMENTO_COMPLETATO.md** - Riepilogo modifiche

## 🔧 Troubleshooting

### Errore connessione API
```bash
# Verifica che l'API sia avviata
curl http://localhost:4300/health

# Controlla configurazione
python check_config.py

# Test connettività
python test_api.py
```

### Login non funziona
- Verifica credenziali con amministratore API
- Controlla che l'endpoint `/auth/login` sia raggiungibile
- Verifica log server per dettagli errore

### Prodotti non visualizzati
- Effettua nuovamente il login (token potrebbe essere scaduto)
- Verifica che l'API `/v1/foods` restituisca dati
- Controlla permessi token JWT

## 📝 Note

- Il contatore ordini rimane locale (file `counter.json`)
- I dati storici Excel non vengono più aggiornati
- I nuovi ordini vanno solo su API REST
- La stampa ESC/POS è opzionale
- Intestazione fissa: **Oratorio di Petosino - SeptemberFest**
- Supporto euro (€) tramite codepage CP858

## 🤝 Supporto

Per problemi o domande:
1. Consulta la documentazione (QUICKSTART.md, API_MIGRATION.md, ecc.)
2. Esegui `python test_api.py` per diagnostica
3. Controlla i log del server Flask

---

**Oratorio di Petosino - SeptemberFest**  
**Version**: 2.0.0 (API Integration)  
**Last Update**: 13 ottobre 2025
