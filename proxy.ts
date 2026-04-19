import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_STORE_NAME } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_STORE_NAME)?.value;

  const isRoot = pathname === '/';
  const isOnProtectedRoute =
    pathname.startsWith('/cashier') || pathname.startsWith('/impostazioni') || pathname.startsWith('/settings');
  const isOnLogin = pathname.startsWith('/login');

  // Root redirect
  if (isRoot) {
    return NextResponse.redirect(new URL(token ? '/cashier' : '/login', request.url));
  }

  if (isOnProtectedRoute && !token) {
    // Non autenticato: redirect al login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnLogin && token) {
    // Già autenticato: redirect alla cashier
    return NextResponse.redirect(new URL('/cashier', request.url));
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
