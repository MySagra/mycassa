import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
    /** Scadenza sessione (unix seconds), allineata all'Expires del cookie backend. */
    expiresAt?: number | null;
  }

  interface User {
    role?: string;
    /** Token backend mysagra_session — solo lato server, mai esposto al client. */
    sessionToken?: string;
    expiresAt?: number | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    sessionToken?: string;
    expiresAt?: number | null;
  }
}
