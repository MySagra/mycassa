# Scontrini POS (Italiano) - Versione 3

- Intestazione fissa: **Oratorio di Petosino - SeptemberFest** in cima a ogni scontrino.
- Campi **Tavolo** e **Cliente** obbligatori nell’interfaccia; rifiuta l’ordine se assenti.
- Tavolo/Cliente stampati in fondo allo scontrino (ESC/POS in grande, HTML in grassetto).
- Log ordine completo (DataOra, CodiceOrdine, Tavolo, Cliente, Riepilogo, Totale) in `data/ordini.xlsx`.
- Opzione stampa diretta ESC/POS spuntata per default.
- Supporto euro (€) tramite codepage CP858 (modificabile in settings).

## Uso
```bash
python3 -m venv .venv
source .venv/bin/activate   # su Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Apri <http://127.0.0.1:7010> e usa l’interfaccia. Inserisci tavolo e cliente, aggiungi prodotti, premi “Genera Scontrini”.

## Immagini
Metti un file `static/logo.png` (max 140px larghezza) per mostrarlo negli scontrini HTML. Su stampante termica (ESC/POS) l’immagine richiede codice aggiuntivo (conversione raster). Per il momento la stampa ESC/POS gestisce solo testo.
