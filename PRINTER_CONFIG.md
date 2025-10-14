# 🖨️ Sistema di Gestione Stampanti

## Panoramica

Ho creato un sistema completo per gestire le stampanti ESC/POS con un'interfaccia web minimalista che segue lo stesso stile della cassa.

## File Creati

### 1. `templates/printer_config.html`
Interfaccia web per configurare le stampanti:
- **Design minimalista** con lo stesso stile oklch di index_new.html
- **Dark mode** integrato con localStorage
- **Gestione stampanti**: aggiungi, rimuovi, attiva/disattiva
- **Test di stampa**: invia un test per verificare la connessione
- **Configurazione categorie**: seleziona quali categorie stampare per ogni stampante

### 2. `printer_manager.py`
Modulo Python per la gestione della configurazione:
- `load_printer_config()`: Carica la configurazione dal JSON
- `save_printer_config()`: Salva la configurazione nel JSON
- `get_printers_for_category()`: Ottiene le stampanti per una categoria
- `validate_printer_config()`: Valida la configurazione di una stampante
- `group_items_by_printer()`: Raggruppa gli item per stampante (utile per stampe multiple)

### 3. `data/printer_config.json`
File di configurazione JSON che memorizza:
```json
{
  "printers": [
    {
      "name": "Stampante Bar",
      "ip": "192.168.1.100",
      "port": 9100,
      "categories": [1, 2],
      "enabled": true
    }
  ]
}
```

## Endpoint API Aggiunti in app.py

### GET `/printer-config`
- Mostra la pagina di configurazione stampanti
- Richiede autenticazione

### GET `/api/printers/config`
- Restituisce la configurazione attuale delle stampanti
- Response: `{success: true, printers: [...]}`

### POST `/api/printers/config`
- Salva la configurazione delle stampanti
- Body: `{printers: [...]}`
- Valida ogni stampante prima di salvare

### POST `/api/printers/test`
- Invia un test di stampa a una stampante
- Body: `{ip: "192.168.1.100", port: 9100}`
- Stampa un messaggio di test per verificare la connessione

## Come Usare

### 1. Accedi alla Configurazione
- Dalla cassa, clicca sul pulsante **🖨️** in alto a destra
- Si aprirà l'interfaccia di configurazione stampanti

### 2. Aggiungi una Stampante
- Clicca su **"+ Aggiungi Stampante"**
- Compila i campi:
  - **Nome**: Es. "Stampante Bar"
  - **IP**: Es. "192.168.1.100"
  - **Porta**: Di default 9100 (standard ESC/POS)
- Seleziona le **categorie** che questa stampante deve stampare
- La configurazione viene salvata automaticamente

### 3. Test di Stampa
- Clicca sul pulsante **🧪 Test** per inviare un test
- Verifica che la stampante riceva e stampi il messaggio

### 4. Gestione Stampanti
- **🟢/🔴**: Attiva o disattiva la stampante
- **🗑️**: Rimuovi la stampante
- Ogni modifica viene salvata automaticamente

## Struttura della Configurazione

Ogni stampante ha:
- `name`: Nome descrittivo
- `ip`: Indirizzo IP della stampante
- `port`: Porta TCP (default 9100)
- `categories`: Array di ID categorie da stampare
- `enabled`: true/false per attivare/disattivare

## Esempio di Scenario

**Configurazione Tipica:**

1. **Stampante Bar** (192.168.1.100)
   - Categorie: Bar, Bibite
   
2. **Stampante Cucina** (192.168.1.101)
   - Categorie: Cucina, Primi, Secondi
   
3. **Stampante Pizzeria** (192.168.1.102)
   - Categorie: Pizzeria

Quando un ordine viene creato, gli item vengono automaticamente smistati alle stampanti giuste in base alla categoria del prodotto.

## Funzionalità dell'Interfaccia

### Header
- Titolo: "🖨️ Configurazione Stampanti"
- Dark mode toggle
- Pulsante per tornare alla cassa

### Card Stampante
Ogni stampante ha una card con:
- **Status indicator**: pallino verde (attiva) o rosso (disattiva)
- **Nome stampante**: editabile
- **IP e Porta**: configurabili
- **Categorie**: checkbox grid per selezione multipla
- **Pulsanti azione**: Test, Attiva/Disattiva, Rimuovi

### Alert System
- Messaggi di successo/errore temporanei (5 secondi)
- Feedback immediato per ogni azione

## Integrazione Futura

Il modulo `printer_manager.py` è pronto per essere integrato nella logica di stampa dell'app:

```python
# Esempio di utilizzo in app.py
from printer_manager import get_printers_for_category, group_items_by_printer

# Quando stampi un ordine
items_with_category = [...]  # Item con category_id
printer_groups = group_items_by_printer(items_with_category)

for printer_key, data in printer_groups.items():
    printer = data['printer']
    items = data['items']
    # Stampa gli items su questa stampante
    stampa_escpos_righe(items, ip=printer['ip'], port=printer['port'])
```

## Caratteristiche Tecniche

- **Responsive**: funziona su desktop e tablet
- **Dark mode**: sincronizzato con localStorage
- **Validazione**: controlli su IP, porta e configurazione
- **Auto-save**: salvataggio automatico ad ogni modifica
- **Error handling**: gestione errori con messaggi chiari

## Note

- La configurazione viene salvata in `data/printer_config.json`
- Il file viene creato automaticamente se non esiste
- Tutti gli endpoint richiedono autenticazione
- Il test di stampa usa le impostazioni ESC/POS esistenti

---

**Pronto per l'uso!** 🚀

Riavvia il server Flask e visita `/printer-config` per iniziare a configurare le tue stampanti.
