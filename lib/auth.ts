import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Nome del cookie HTTP-only impostato dal backend in risposta al login.
 * Il backend autentica le chiamate API leggendo questo cookie.
 */
export const BACKEND_COOKIE_NAME = 'mysagra_session';

/**
 * Nome del cookie di sessione NextAuth salvato sul client.
 * NON contiene il token in chiaro: è la sessione NextAuth cifrata (JWE) che
 * trasporta al suo interno il token backend `mysagra_session`.
 */
export const CLIENT_SESSION_COOKIE_NAME = 'mycassa.session';

const IS_PROD = process.env.NODE_ENV === 'production';

// Durata massima di fallback della sessione se il backend non fornisce Expires/Max-Age.
const FALLBACK_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

interface ParsedSessionCookie {
  token: string;
  /** unix seconds, oppure null se il backend non specifica scadenza */
  expiresAt: number | null;
}

/**
 * Estrae valore e scadenza del cookie `mysagra_session` da un header Set-Cookie
 * del backend. Gestisce sia `Expires=` che `Max-Age=`.
 */
function parseSessionCookie(setCookie: string): ParsedSessionCookie | null {
  const tokenMatch = setCookie.match(new RegExp(`${BACKEND_COOKIE_NAME}=([^;]+)`));
  if (!tokenMatch) return null;

  const token = tokenMatch[1];
  let expiresAt: number | null = null;

  const maxAgeMatch = setCookie.match(/[Mm]ax-[Aa]ge=(\d+)/);
  if (maxAgeMatch) {
    expiresAt = Math.floor(Date.now() / 1000) + parseInt(maxAgeMatch[1], 10);
  } else {
    const expiresMatch = setCookie.match(/[Ee]xpires=([^;]+)/);
    if (expiresMatch) {
      const ms = Date.parse(expiresMatch[1]);
      if (!Number.isNaN(ms)) expiresAt = Math.floor(ms / 1000);
    }
  }

  return { token, expiresAt };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          // getSetCookie() (Node 18.14+) restituisce i cookie separati;
          // fallback all'header unito per runtime più vecchi.
          const setCookieList =
            typeof res.headers.getSetCookie === 'function'
              ? res.headers.getSetCookie()
              : [res.headers.get('set-cookie') ?? ''];

          let parsed: ParsedSessionCookie | null = null;
          for (const sc of setCookieList) {
            if (!sc) continue;
            parsed = parseSessionCookie(sc);
            if (parsed) break;
          }

          if (!parsed) {
            console.error('Login: il backend non ha restituito il cookie mysagra_session');
            return null;
          }

          // Recupera l'utente canonico (id cuid, username, role) da /auth/me
          // usando il cookie appena ottenuto. Il body del login non garantisce l'id.
          const loginBody = await res.json().catch(() => ({}));
          let user = loginBody.user ?? loginBody;

          try {
            const meRes = await fetch(`${API_URL}/auth/me`, {
              headers: { Cookie: `${BACKEND_COOKIE_NAME}=${parsed.token}` },
            });
            if (meRes.ok) {
              const me = await meRes.json().catch(() => null);
              if (me) user = me.user ?? me;
            } else {
              console.error('Login: /auth/me ha risposto', meRes.status);
            }
          } catch (e) {
            console.error('Login: /auth/me fetch fallita', e);
          }

          // Estrazione id robusta a varianti di shape backend.
          const id =
            user?.id ?? user?.userId ?? user?._id ?? user?.sub ?? null;

          if (!id) {
            console.error('Login: id utente non trovato. Chiavi utente:', Object.keys(user ?? {}));
          }

          const role =
            typeof user?.role === 'object' && user?.role !== null
              ? user.role.name
              : user?.role;

          return {
            // Mai usare lo username come id (deve essere un cuid).
            id: id != null ? String(id) : '',
            name: user?.username ?? user?.name ?? String(credentials.username),
            email: user?.email ?? null,
            role,
            sessionToken: parsed.token,
            expiresAt: parsed.expiresAt,
          };
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: FALLBACK_MAX_AGE_SECONDS,
  },
  cookies: {
    sessionToken: {
      name: CLIENT_SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: IS_PROD,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          name?: string | null;
          role?: string;
          sessionToken?: string;
          expiresAt?: number | null;
        };
        token.sessionToken = u.sessionToken;
        token.role = u.role;
        token.expiresAt = u.expiresAt ?? null;
        // Allinea la scadenza della sessione NextAuth all'Expires del cookie backend.
        if (u.expiresAt) {
          token.exp = u.expiresAt;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = token.role as string | undefined;
      }
      session.expiresAt = (token.expiresAt as number | null) ?? null;
      // NB: token.sessionToken NON viene esposto al client. È leggibile solo
      // lato server tramite getBackendToken() (vedi lib/auth-token.ts).
      return session;
    },
  },
});
