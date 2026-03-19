import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_STORE_NAME } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_STORE_NAME)?.value;

  const isRoot = pathname === '/';
  const isOnProtectedRoute =
    pathname.startsWith('/cassa') || pathname.startsWith('/impostazioni') || pathname.startsWith('/settings');
  const isOnLogin = pathname.startsWith('/login');

  // Root redirect
  if (isRoot) {
    return NextResponse.redirect(new URL(token ? '/cassa' : '/login', request.url));
  }

  if (isOnProtectedRoute && !token) {
    // Non autenticato: redirect al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnLogin && token) {
    // Già autenticato: redirect alla cassa
    return NextResponse.redirect(new URL('/cassa', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Escludi le route API interne di Next.js, i file statici e le favicon.
     * Proteggi solo le pagine applicative.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
