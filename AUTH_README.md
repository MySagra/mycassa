# MyCassa - Sistema di Gestione Cassa

Sistema di autenticazione e gestione per eventi MySagra.

## 🚀 Caratteristiche Implementate

### Autenticazione
- ✅ Login con username e password
- ✅ Gestione Access Token (JWT, scadenza 15 minuti)
- ✅ Gestione Refresh Token (cookie HTTP-only, scadenza 7 giorni)
- ✅ Auto-refresh automatico dei token scaduti
- ✅ Funzione "Ricordami" (localStorage vs sessionStorage)
- ✅ Logout sicuro con revoca del refresh token
- ✅ Protezione delle route con redirect automatico

### Componenti UI
- Pagina di login moderna con componenti shadcn/ui
- Dashboard protetta
- Toast notifications con sonner
- Form validation con Zod e React Hook Form
- Design responsive con Tailwind CSS

## 📦 Struttura del Progetto

```
mycassa/
├── app/
│   ├── login/
│   │   └── page.tsx          # Pagina di login
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard protetta
│   ├── layout.tsx            # Layout principale con AuthProvider
│   └── page.tsx              # Home page con redirect
├── components/
│   ├── ui/                   # Componenti shadcn/ui
│   └── protected-route.tsx   # HOC per proteggere le route
├── lib/
│   ├── auth-context.tsx      # Context per autenticazione
│   ├── api-client.ts         # Client axios con interceptors
│   └── utils.ts              # Utility functions
└── .env.local                # Variabili d'ambiente
```

## 🛠️ Setup

1. **Installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Configura le variabili d'ambiente:**
   
   Copia `.env.example` in `.env.local` e configura l'URL dell'API:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

4. **Apri il browser:**
   ```
   http://localhost:3000
   ```

## 🔐 Sistema di Autenticazione

### Flow di Login

1. L'utente inserisce username e password
2. Validazione del form con Zod
3. Chiamata POST a `/auth/login`
4. Ricezione di:
   - User info (username, role)
   - Access Token (JWT)
   - Refresh Token (cookie HTTP-only)
5. Storage del token:
   - "Ricordami" attivo → localStorage
   - "Ricordami" disattivo → sessionStorage

### Gestione Token

**Access Token:**
- Durata: 15 minuti
- Storage: localStorage o sessionStorage
- Inviato in header `Authorization: Bearer <token>`

**Refresh Token:**
- Durata: 7 giorni
- Storage: cookie HTTP-only (gestito dal server)
- Usato automaticamente per ottenere nuovi access token

### Auto-Refresh

Il client axios ha un interceptor che:
1. Intercetta errori 401 (Unauthorized)
2. Prova a refreshare il token chiamando `/auth/refresh`
3. Riprova la richiesta originale con il nuovo token
4. In caso di fallimento, fa logout e redirect al login

### Logout

Il logout:
1. Chiama `/auth/logout` per revocare il refresh token
2. Cancella user e token da localStorage/sessionStorage
3. Redirect alla pagina di login

## 📡 API Endpoints (da Swagger)

### POST /auth/login
```json
Request:
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "user": {
    "username": "admin",
    "role": "admin"
  },
  "accessToken": "eyJhbGc..."
}
+ Set-Cookie: refreshToken=...; HttpOnly; Secure
```

### POST /auth/refresh
```
Cookies: refreshToken=...

Response:
{
  "accessToken": "eyJhbGc..."
}
```

### POST /auth/logout
```
Cookies: refreshToken=...

Response: 200 OK
```

## 🎨 UI/UX

La pagina di login replica il design fornito:
- Sfondo nero
- Card con header giallo/amber
- Icona dollaro con cerchi concentrici
- Form con username, password e "Ricordami"
- Pulsante giallo con effetto hover
- Tema scuro coerente

## 🔒 Sicurezza

- ✅ Refresh token in cookie HTTP-only (non accessibile da JavaScript)
- ✅ Access token con scadenza breve
- ✅ CORS configurato con `credentials: 'include'`
- ✅ Validazione input con Zod
- ✅ Protezione route lato client
- ✅ Gestione errori con feedback utente

## 🧪 Testing

Per testare il sistema:

1. **Avvia il server API** (sulla porta 3001 o come configurato)
2. **Avvia Next.js** con `npm run dev`
3. **Naviga a** `http://localhost:3000`
4. **Login** con credenziali valide
5. **Verifica** il redirect alla dashboard
6. **Testa il refresh** aspettando 15 minuti o invalidando il token
7. **Logout** e verifica il redirect al login

## 📚 Tecnologie Utilizzate

- **Next.js 16** - Framework React
- **React 19** - UI Library
- **TypeScript 5** - Type Safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Componenti UI
- **React Hook Form** - Form Management
- **Zod** - Schema Validation
- **Axios** - HTTP Client
- **Sonner** - Toast Notifications

## 🎯 Prossimi Passi

- [ ] Implementare recupero password
- [ ] Aggiungere autenticazione a due fattori
- [ ] Middleware di protezione lato server
- [ ] Test automatizzati
- [ ] Gestione permessi per ruoli
- [ ] Analytics e logging

## 📞 Supporto

Per problemi o domande, consulta la documentazione API Swagger o contatta il team di sviluppo.
