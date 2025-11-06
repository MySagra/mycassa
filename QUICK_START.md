# 🚀 Quick Start - MyCassa

## Setup Rapido (5 minuti)

### 1. Verifica Dipendenze ✅
```bash
npm install
```
*Dipendenze già installate: React, Next.js, shadcn/ui, axios, zod, react-hook-form*

### 2. Configura API 🔧
Modifica `.env.local` con l'URL del tuo server API:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Avvia il Server 🏃
```bash
npm run dev
```

### 4. Apri il Browser 🌐
```
http://localhost:3000
```

## Primo Accesso 🔑

1. Verrai **automaticamente reindirizzato** a `/login`
2. Inserisci le tue **credenziali** dell'API
3. (Opzionale) Spunta **"Ricordami"** per sessioni persistenti
4. Clicca **"Accedi"**
5. Verrai reindirizzato alla **Dashboard** 🎉

## Struttura Progetto 📁

```
mycassa/
├── app/
│   ├── login/page.tsx      ← Pagina di login
│   ├── dashboard/page.tsx  ← Dashboard (esempio)
│   └── page.tsx            ← Home (redirect)
├── lib/
│   ├── auth-context.tsx    ← Gestione autenticazione
│   ├── api-client.ts       ← Client API con auto-refresh
│   └── api-types.ts        ← TypeScript types
├── components/
│   ├── protected-route.tsx ← HOC per route protette
│   └── ui/                 ← Componenti shadcn
└── .env.local              ← Configurazione API
```

## Features Principali ⭐

- ✅ **Login Sicuro** con JWT tokens
- ✅ **Auto-refresh** token automatico
- ✅ **Protezione Route** automatica
- ✅ **Remember Me** con localStorage
- ✅ **Toast Notifications** per feedback
- ✅ **Dark Theme** integrato
- ✅ **Responsive Design**
- ✅ **TypeScript** type-safe

## Test Veloce 🧪

### Test Login
```
1. Vai su http://localhost:3000
2. Inserisci username e password validi
3. Verifica redirect a /dashboard
4. Vedi le tue info utente
```

### Test Logout
```
1. Clicca "Esci" nella dashboard
2. Verifica redirect a /login
3. Token e storage cancellati
```

### Test Protected Route
```
1. Fai logout
2. Prova ad accedere a /dashboard
3. Verifica redirect automatico a /login
```

### Test Remember Me
```
1. Login CON "Ricordami"
2. Chiudi browser
3. Riapri → Ancora loggato ✓

1. Login SENZA "Ricordami"
2. Chiudi browser
3. Riapri → Devi rifare login ✓
```

## API Requirements 🔌

Il tuo server API deve avere questi endpoint:

```
POST /auth/login
  Body: { username, password }
  Response: { user: {...}, accessToken: "..." }
  Cookie: refreshToken (HTTP-only, 7 days)

POST /auth/refresh
  Cookie: refreshToken
  Response: { accessToken: "..." }

POST /auth/logout
  Cookie: refreshToken
  Response: 200 OK
```

## Troubleshooting 🔍

### "Network Error" o "Failed to fetch"
- ✓ Verifica che l'API sia avviata
- ✓ Controlla URL in `.env.local`
- ✓ Verifica CORS settings sull'API

### "Unauthorized" dopo login
- ✓ Verifica credenziali corrette
- ✓ Controlla formato response API
- ✓ Verifica cookie settings

### Token non si refresha
- ✓ Verifica cookie HTTP-only dal server
- ✓ Controlla `withCredentials: true`
- ✓ Verifica endpoint `/auth/refresh`

### Redirect loop
- ✓ Pulisci localStorage: `localStorage.clear()`
- ✓ Pulisci cookie browser
- ✓ Riavvia dev server

## Comandi Utili 💻

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build

# Start produzione
npm start

# Lint
npm run lint

# Pulisci cache Next.js
rm -rf .next
```

## Prossimi Passi 🎯

1. **Personalizza Dashboard** - Modifica `app/dashboard/page.tsx`
2. **Aggiungi Route Protette** - Usa `<ProtectedRoute>`
3. **Integra altre API** - Usa `hooks/use-api.ts`
4. **Gestisci Ruoli** - Estendi `auth-context.tsx`
5. **Aggiungi Features** - Ordini, Cassa, Stats...

## Supporto 📞

Documentazione completa:
- `AUTH_README.md` - Guida autenticazione completa
- `ARCHITECTURE.md` - Diagrammi architettura
- `CHECKLIST.md` - Checklist implementazione
- `IMPLEMENTATION_SUMMARY.md` - Riepilogo implementazione

## Sei Pronto! 🚀

Il sistema è completamente configurato e pronto all'uso.
Buon sviluppo con MyCassa! 💰
