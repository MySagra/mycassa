# 🧾 MyCassa - Sistema POS per Ristoranti e Eventi

Un sistema di cassa completo e moderno per la gestione di ordini, scontrini e stampa su stampanti termiche ESC/POS, ideale per ristoranti, sagre ed eventi.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.1.2-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Caratteristiche Principali

- 🖥️ **Interfaccia Web Moderna** - Design responsive con supporto dark mode
- � **Progressive Web App (PWA)** - Installabile su desktop e mobile, funziona offline
- �🔐 **Sistema di Autenticazione** - Login sicuro con JWT token
- 🍕 **Gestione Prodotti e Categorie** - Caricamento dinamico via API REST con filtri
- 🖨️ **Stampa Multi-Stampante** - Supporto per stampanti ESC/POS con assegnazione per categoria
- 📝 **Personalizzazione Ordini** - Aggiunte e rimozioni con calcolo automatico prezzi
- 📊 **Logging Ordini** - Salvataggio automatico in Excel con timestamp
- 🎨 **Scontrini HTML/Termici** - Generazione scontrini sia web che per stampanti termiche
- 🌐 **Integrazione API REST** - Sincronizzazione con backend centralizzato
- 🗂️ **Filtro Categorie** - Sidebar dedicata per filtrare prodotti per categoria

## 📋 Requisiti

- **Python 3.8 o superiore**
- **Sistema Operativo**: Windows, Linux, macOS
- **Backend API REST** (opzionale ma consigliato)
- **Stampante termica ESC/POS** (opzionale per la stampa fisica)

## 🚀 Installazione

### 1. Clona il Repository

```bash
git clone https://github.com/MySagra/mycassa.git
cd mycassa
```

### 2. Crea l'Ambiente Virtuale

#### Windows (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### Linux/macOS
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Installa le Dipendenze

```bash
pip install -r requirements.txt
```

### 4. Configura le Variabili d'Ambiente

Crea un file `.env` nella root del progetto (puoi partire da `.env.example`):

```env
API_BASE_URL=http://localhost:4300
SECRET_KEY=la-tua-chiave-segreta-qui
```

**Variabili disponibili:**
- `API_BASE_URL`: URL del backend API REST (default: `http://localhost:4300`)
- `SECRET_KEY`: Chiave segreta per le sessioni (cambiare in produzione!)

### 5. Configura le Stampanti (Opzionale)

Se utilizzi stampanti termiche, configura il file `data/printer_config.json` o usa l'interfaccia web disponibile su `/printer_config`.

```json
{
  "printers": [
    {
      "id": "printer1",
      "name": "Stampante Cucina",
      "type": "network",
      "address": "192.168.1.100",
      "port": 9100,
      "enabled": true,
      "categories": ["pizza", "primi", "secondi"]
    }
  ]
}
```

## 🎯 Avvio dell'Applicazione

### Metodo Standard

```bash
python start.py
```

Oppure direttamente con Flask:

```bash
python app.py
```

L'applicazione sarà disponibile su: **http://localhost:7010**

### Script Helper per Windows

Puoi usare gli script batch/PowerShell inclusi:

```powershell
# PowerShell
.\run_python.ps1

# CMD
run_python.bat
```

## 📖 Guida all'Uso

### 1. Login

1. Apri il browser su `http://localhost:7010/login`
2. Inserisci le credenziali del tuo account
3. Il sistema salverà il token JWT nella sessione

### 2. Installazione PWA (Opzionale)

L'applicazione può essere installata come app standalone:

**Desktop (Chrome/Edge):**
1. Clicca sull'icona di installazione nella barra degli indirizzi (➕)
2. Conferma l'installazione

**Mobile (Android/iOS):**
1. Apri il menu del browser (⋮)
2. Seleziona "Aggiungi a schermata home" o "Installa app"
3. L'app funzionerà anche offline grazie al service worker

**Funzionalità Offline:**
- Cache automatica di pagine e risorse statiche
- Icone personalizzabili (vedi `static/ICONS_README.md`)
- Accesso rapido da dock/home screen

### 3. Gestione Ordini

1. **Seleziona la Categoria**: Usa la sidebar sinistra per filtrare i prodotti per categoria
2. **Aggiungi Prodotti**: Clicca sui prodotti per aggiungerli all'ordine
3. **Personalizza**: Usa i pulsanti "+" e "-" per gestire aggiunte e rimozioni
4. **Inserisci Dettagli**: Compila i campi **Tavolo** e **Cliente** (obbligatori)
5. **Genera Scontrino**: Clicca su "Genera Scontrini" per creare e stampare

### 4. Consultazione Ordini Precedenti

1. Clicca sul pulsante "Ordini" per aprire la sidebar degli ordini
2. **Visualizza Ordini Odierni**: Tutti gli ordini di oggi vengono caricati automaticamente
3. **Cerca Ordini**: Usa la barra di ricerca per trovare ordini specifici
4. **Carica Ordine**: Clicca su "Carica" per ripristinare un ordine nel carrello

### 5. Configurazione Stampanti

1. Vai su `http://localhost:7010/printer_config`
2. **Aggiungi Stampanti**: Configura le tue stampanti termiche
3. **Assegna Categorie**: Collega ogni stampante alle categorie pertinenti
4. **Test Stampa**: Verifica la connessione con il pulsante "Test"

### 6. Salvataggio Ordini

Gli ordini vengono salvati automaticamente in:
- `data/ordini.xlsx` - File Excel con tutti gli ordini
- `data/counter.json` - Contatore progressivo degli ordini

## 🏗️ Struttura del Progetto

```
mycassa/
├── app.py                  # Applicazione Flask principale
├── start.py                # Script di avvio
├── config.py               # Configurazione API e applicazione
├── auth.py                 # Sistema di autenticazione
├── api_client.py           # Client per le API REST
├── printer_manager.py      # Gestione stampanti
├── escpos_send.py          # Invio comandi ESC/POS
├── requirements.txt        # Dipendenze Python
├── data/
│   ├── counter.json        # Contatore ordini
│   ├── printer_config.json # Configurazione stampanti
│   └── ordini.xlsx         # Log ordini
├── templates/
│   ├── login.html          # Pagina di login
│   ├── index.html          # Interfaccia principale (con PWA)
│   └── printer_config.html # Configurazione stampanti
└── static/
    ├── manifest.json       # PWA manifest
    ├── sw.js               # Service worker per offline
    ├── icon.svg            # Icona SVG placeholder
    ├── ICONS_README.md     # Guida per generare icone PNG
    ├── logo.png            # Logo aziendale (opzionale)
    └── guida.txt           # Note e guide
```

## 🔧 Configurazione Avanzata

### Progressive Web App (PWA)

L'applicazione è configurata come PWA con le seguenti funzionalità:

**Caratteristiche:**
- ✅ **Installabile**: Può essere installata su desktop e mobile
- ✅ **Offline**: Service worker con cache delle risorse statiche
- ✅ **Standalone**: Funziona come app nativa senza browser UI
- ✅ **Icone Personalizzabili**: Supporto per icone multi-size

**Generare Icone Personalizzate:**

1. **Metodo Automatico (Consigliato):**
   ```bash
   pip install Pillow
   python generate_icons.py
   ```
   Questo genererà tutte le icone nelle dimensioni richieste (72px - 512px).

2. **Metodo Manuale:**
   - Crea le icone nelle dimensioni: 72, 96, 128, 144, 152, 192, 384, 512px
   - Salva come `icon-{size}x{size}.png` nella cartella `static/`
   - Consulta `static/ICONS_README.md` per dettagli

**File PWA:**
- `static/manifest.json`: Configurazione app (nome, icone, colori)
- `static/sw.js`: Service worker per caching e offline
- `templates/index.html`: Include meta tags PWA e registrazione service worker

**Nota**: In produzione, il service worker richiede HTTPS (funziona su localhost senza).

### Impostazioni ESC/POS

Puoi personalizzare le impostazioni di stampa modificando il file `settings.json`:

```json
{
  "codepage": "CP858",
  "char_width": 42,
  "logo_enabled": false
}
```

### API Backend

L'applicazione si integra con un backend REST che deve fornire i seguenti endpoint:

- `POST /auth/login` - Autenticazione utente
- `GET /v1/foods` - Lista prodotti
- `GET /v1/categories` - Lista categorie
- `POST /v1/orders` - Creazione ordine

Consulta il file `config.py` per personalizzare gli endpoint.

## 🛠️ Risoluzione Problemi

### L'applicazione non si avvia

1. Verifica che l'ambiente virtuale sia attivato
2. Controlla che tutte le dipendenze siano installate: `pip install -r requirements.txt`
3. Verifica che la porta 7010 non sia già in uso

### Errore "Python non è stato trovato"

Assicurati di aver attivato l'ambiente virtuale:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate
```

### La stampante non funziona

1. Verifica la connessione di rete (per stampanti network)
2. Controlla l'indirizzo IP e la porta in `printer_config.json`
3. Usa il pulsante "Test" nell'interfaccia di configurazione
4. Verifica che la stampante supporti comandi ESC/POS

### Errore di connessione API

1. Verifica che il backend sia avviato e raggiungibile
2. Controlla l'`API_BASE_URL` nel file `.env`
3. Verifica le credenziali di login

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha il branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per maggiori dettagli.

## 👥 Autori

- **MySagra Team** - [MySagra](https://github.com/MySagra)

## 🙏 Ringraziamenti

- Flask per il framework web
- python-escpos per il supporto stampanti termiche
- Tutti i contributori del progetto

## 📞 Supporto

Per domande o problemi:
- Apri un [Issue](https://github.com/MySagra/mycassa/issues) su GitHub
- Consulta la documentazione nel wiki del progetto

---

⭐ Se questo progetto ti è utile, considera di lasciare una stella su GitHub!
