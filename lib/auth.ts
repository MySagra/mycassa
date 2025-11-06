import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          console.log('Attempting login to:', `${process.env.API_URL}/auth/login`);
          
          const response = await fetch(`${process.env.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          console.log('Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Login failed:', response.status, errorText);
            return null;
          }

          const data = await response.json();
          console.log('Login response:', JSON.stringify(data, null, 2));

          // Check if we have the expected data structure
          if (!data.accessToken) {
            console.error('No accessToken in response:', data);
            return null;
          }

          // Return user object with token
          const user = {
            id: String(data.user?.id || '1'),
            name: data.user?.username || credentials.username as string,
            email: data.user?.email || `${credentials.username}@mycassa.local`,
            token: data.accessToken, // Backend returns accessToken
          };

          console.log('Returning user:', { ...user, token: '***' });
          return user;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign in, add token from backend
      if (user && account) {
        console.log('JWT callback - initial sign in, adding token to JWT');
        token.accessToken = user.token;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add access token to session
      if (token && session.user) {
        console.log('Session callback - adding token to session');
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnCassa = nextUrl.pathname.startsWith('/cassa');
      const isOnImpostazioni = nextUrl.pathname.startsWith('/impostazioni');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      console.log('Authorized callback:', { 
        isLoggedIn, 
        isOnCassa, 
        isOnImpostazioni, 
        isOnLogin,
        pathname: nextUrl.pathname 
      });

      if (isOnCassa || isOnImpostazioni) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/cassa', nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
