# GUIDA RAPIDA - Sistema Scontrini POS con API REST

## 🚀 Avvio Rapido

### 1. Installa le dipendenze
```bash
pip install -r requirements.txt
```

### 2. Configura l'URL dell'API
Crea un file `.env` o imposta la variabile d'ambiente:
```bash
# Windows PowerShell
$env:API_BASE_URL = "http://localhost:4300"

# Linux/Mac
export API_BASE_URL="http://localhost:4300"
```

### 3. Avvia l'applicazione
```bash
python start.py
```
oppure
```bash
python app.py
```

### 4. Accedi all'applicazione
1. Apri il browser su `http://localhost:7010/login`
2. Inserisci le tue credenziali
3. Inizia a usare il sistema!

## 🔑 Login

La prima volta che accedi dovrai effettuare il login:
- **URL**: http://localhost:7010/login
- Inserisci username e password forniti dall'API
- Il token JWT viene salvato automaticamente

## 📦 Funzionalità

### Gestione Prodotti
- I prodotti vengono caricati automaticamente dall'API
- Organizzati per categoria (Pizzeria, Bibite, ecc.)
- Prezzi e disponibilità gestiti centralmente

### Creazione Ordini
1. Seleziona i prodotti dal catalogo
2. Inserisci numero tavolo e nome cliente
3. Scegli il metodo di pagamento (Contanti/POS)
4. Per le pizze, puoi aggiungere/rimuovere ingredienti
5. Genera gli scontrini

### Stampa
- Stampa automatica su stampante ESC/POS (se configurata)
- Download scontrini in formato HTML in un file ZIP
- Scontrini separati per categoria + totale complessivo

## 🔧 Test Connessione API

Per verificare che tutto funzioni:
```bash
python test_api.py
```

Questo script testerà:
- ✅ Connessione all'API
- ✅ Login e generazione token
- ✅ Recupero prodotti

## 🛠️ Configurazione Avanzata

### Variabili d'ambiente disponibili
- `API_BASE_URL` - URL base dell'API REST (default: http://localhost:4300)
- `SECRET_KEY` - Chiave segreta per le sessioni Flask
- `API_TIMEOUT` - Timeout richieste API in secondi (default: 30)

### File di configurazione
Modifica `config.py` per impostazioni permanenti.

## 📱 Endpoint API Richiesti

L'applicazione necessita che l'API esponga:

### POST /auth/login
Login utente, restituisce token JWT

### GET /v1/categories
Lista categorie disponibili

### GET /v1/foods
Lista prodotti (foods) con categoria, nome, prezzo

### POST /v1/orders
Creazione nuovo ordine con items, tavolo, cliente, pagamento

## ❗ Risoluzione Problemi

### "Impossibile connettersi al server API"
- Verifica che l'API sia avviata
- Controlla l'URL in `config.py` o nella variabile d'ambiente
- Prova a eseguire `python test_api.py`

### "Credenziali non valide"
- Verifica username e password con l'amministratore API
- Assicurati che l'endpoint `/auth/login` funzioni

### "Prodotti non visualizzati"
- Verifica di aver effettuato il login
- Controlla che il token JWT sia valido
- Verifica che l'API `/products` restituisca dati

### Token scaduto
- Effettua nuovamente il login
- Il sistema ti redirige automaticamente alla pagina di login

## 📞 Supporto

Per assistenza:
1. Consulta `API_MIGRATION.md` per documentazione completa
2. Esegui `python test_api.py` per diagnostica
3. Controlla i log del server per errori dettagliati

## 🔄 Migrazione da versione Excel

Se stavi usando la versione precedente con file Excel:
- I dati storici in `data/ordini.xlsx` rimangono disponibili
- I nuovi ordini vengono salvati solo tramite API
- Il file `data/products.xlsx` non viene più letto
- Il contatore ordini locale continua a funzionare

---

**Oratorio di Petosino - SeptemberFest**
