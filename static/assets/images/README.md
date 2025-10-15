# Immagini Personalizzate

## Icona Login

Per personalizzare l'icona della pagina di login:

1. Aggiungi un file nella cartella `static/assets/images/`
2. Rinomina il file come: **`login-icon.svg`** o **`login-icon.png`**
3. L'immagine verrà automaticamente caricata al posto dell'icona predefinita

### Priorità di Caricamento:
Il sistema cerca i file in questo ordine:
1. **`login-icon.svg`** (priorità alta - consigliato)
2. **`login-icon.png`** (alternativa)
3. Icona predefinita (se nessun file trovato)

### Specifiche Consigliate:

#### SVG (consigliato):
- **Formato**: SVG ottimizzato
- **Dimensioni**: viewBox="0 0 64 64" o simile
- **Peso**: < 20 KB
- **Vantaggi**: Scalabile, nitido su tutti gli schermi

#### PNG (alternativa):
- **Formato**: PNG con sfondo trasparente
- **Dimensioni**: 128x128 px o 256x256 px (quadrata)
- **Peso**: < 50 KB

### Note:
- Se nessun file personalizzato esiste, verrà mostrata l'icona predefinita (receipt icon)
- L'immagine verrà automaticamente adattata al cerchio dell'icona
- Supporta sia tema chiaro che scuro
- Gli SVG sono consigliati per la migliore qualità visiva
