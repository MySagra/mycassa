# Guida alla nuova versione con API REST

## Modifiche implementate

L'applicazione è stata aggiornata per utilizzare API REST invece dei file Excel per la gestione di prodotti e ordini. È stata inoltre aggiunta l'autenticazione con JWT.

## Nuove funzionalità

### 1. Autenticazione JWT
- **Pagina di login**: `/login` - Gli utenti devono autenticarsi prima di accedere all'applicazione
- **Logout**: Pulsante in alto a destra nella pagina principale
- **Token JWT**: Il token viene salvato nella sessione Flask e usato per tutte le richieste API

### 2. Integrazione API REST
- **Prodotti**: Caricati dall'endpoint `GET /products` invece del file Excel
- **Ordini**: Creati tramite `POST /orders` invece di scrivere su Excel

## File creati/modificati

### Nuovi file
- `config.py` - Configurazione URL API e impostazioni
- `auth.py` - Modulo per gestione autenticazione e token JWT
- `api_client.py` - Client per chiamate API REST
- `templates/login.html` - Pagina di login
- `API_MIGRATION.md` - Questa guida

### File modificati
- `app.py` - Aggiornato per usare API e autenticazione
- `templates/index.html` - Aggiunto pulsante logout
- `requirements.txt` - Aggiunte librerie `requests` e `PyJWT`

## Configurazione

### 1. Installare le dipendenze
```bash
pip install -r requirements.txt
```

### 2. Configurare l'URL dell'API
Modificare il file `config.py` oppure impostare la variabile d'ambiente:

```bash
# Windows PowerShell
$env:API_BASE_URL = "http://localhost:4300"

# Linux/Mac
export API_BASE_URL="http://localhost:4300"
```

### 3. Configurare la chiave segreta (opzionale)
Per maggiore sicurezza in produzione:

```bash
# Windows PowerShell
$env:SECRET_KEY = "la-tua-chiave-segreta-molto-lunga"

# Linux/Mac
export SECRET_KEY="la-tua-chiave-segreta-molto-lunga"
```

## Avvio dell'applicazione

```bash
python app.py
```

L'applicazione sarà disponibile su `http://0.0.0.0:7010`

## Flusso di utilizzo

1. **Login**: Accedere a `http://localhost:7010/login` e inserire username/password
2. **Utilizzo normale**: Dopo il login, l'applicazione funziona come prima
3. **Logout**: Cliccare sul pulsante "Logout" in alto a destra

## Struttura API richiesta

L'applicazione si aspetta che l'API REST abbia i seguenti endpoint:

### POST /auth/login
Autenticazione utente
```json
Request:
{
  "username": "admin",
  "password": "password"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /v1/categories
Recupero lista categorie (richiede autenticazione)
```json
Headers:
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "id": 1,
    "name": "Pizzeria"
  },
  {
    "id": 2,
    "name": "Bibite"
  },
  ...
]
```

### GET /v1/foods
Recupero lista prodotti (richiede autenticazione)
```json
Headers:
Authorization: Bearer <token>

Response (200 OK):
[
  {
    "id": 1,
    "name": "Margherita",
    "category": {
      "id": 1,
      "name": "Pizzeria"
    },
    "price": 5.00,
    "active": true
  },
  ...
]
```

### POST /v1/orders
Creazione nuovo ordine (richiede autenticazione)
```json
Headers:
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "table": "12",
  "customer": "Mario Rossi",
  "payment_method": "CONTANTI",
  "total": 15.50,
  "items": [
    {
      "name": "Margherita",
      "category": "Pizzeria",
      "quantity": 2,
      "unit_price": 5.00,
      "subtotal": 10.00,
      "additions": ["bufala"],
      "removals": ["cipolla"]
    }
  ]
}

Response (201 Created):
{
  "id": 123,
  "message": "Order created successfully"
}
```

## Gestione errori

### Errori di connessione
Se l'API non è raggiungibile, l'applicazione mostrerà pagine vuote o errori. Verificare:
- Che l'API sia avviata
- Che l'URL in `config.py` sia corretto
- Che non ci siano firewall che bloccano le connessioni

### Errori di autenticazione
Se il token scade o non è valido:
- L'applicazione redirige automaticamente alla pagina di login
- Effettuare nuovamente il login

## Note sulla compatibilità

### Mantenimento funzionalità esistenti
- La stampa ESC/POS continua a funzionare come prima
- Il formato degli scontrini HTML è invariato
- Il calcolo dei prezzi con aggiunte/rimozioni è identico
- Il contatore ordini progressivo rimane locale (file `counter.json`)

### Dati storici
Gli ordini salvati nel file Excel `data/ordini.xlsx` rimangono accessibili ma non vengono più aggiornati. I nuovi ordini vengono salvati solo tramite API.

## Troubleshooting

### "Non autenticato" anche dopo il login
- Verificare che la SECRET_KEY sia impostata
- Controllare i cookie del browser (potrebbero essere bloccati)
- Provare a cancellare i cookie e rifare il login

### Prodotti non visualizzati
- Verificare che l'API `/products` restituisca dati
- Controllare che il token JWT sia valido
- Vedere i log del server per dettagli sull'errore

### Ordini non salvati
- Verificare che l'API `/orders` accetti il formato dati inviato
- Controllare i log del server per errori di validazione
- Verificare che il token JWT abbia i permessi necessari

## Supporto

Per problemi o domande, consultare i log dell'applicazione che mostrano:
- Errori di connessione API
- Dettagli su autenticazione fallita
- Problemi di salvataggio ordini
