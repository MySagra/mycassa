# PWA Icons

Per generare le icone della PWA, hai due opzioni:

## Opzione 1: Generazione Automatica (Richiede Pillow)

1. Installa Pillow:
```bash
pip install Pillow
```

2. Esegui lo script:
```bash
python generate_icons.py
```

Questo genererà icone placeholder arancioni in tutte le dimensioni necessarie.

## Opzione 2: Creazione Manuale

Crea icone personalizzate con il tuo logo nelle seguenti dimensioni:

- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192) ⭐ Principale
- icon-384.png (384x384)
- icon-512.png (512x512) ⭐ Principale

Salvale tutte nella cartella `static/`.

### Requisiti per le icone:

- Formato: PNG con trasparenza (RGBA)
- Forma: Quadrata
- Contenuto: Il logo dovrebbe occupare circa l'80% dello spazio, lasciando margini
- Background: Trasparente o colore solido (#f59e0b per consistenza con il tema)
- Qualità: Alta risoluzione, ottimizzate per web

### Strumenti consigliati:

- [RealFaviconGenerator](https://realfavicongenerator.net/) - Generatore online
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) - CLI tool
- Photoshop, GIMP, Figma, Canva - Editor grafici

## Verifica

Dopo aver creato le icone, puoi verificarle visitando:
- Chrome DevTools > Application > Manifest
- Lighthouse audit per PWA
