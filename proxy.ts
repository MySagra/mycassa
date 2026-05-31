import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_STORE_NAME, USER_COOKIE_NAME } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_STORE_NAME)?.value;
  const userToken = request.cookies.get(USER_COOKIE_NAME)?.value;
  const isAuthenticated = !!(token && userToken);

  const isRoot = pathname === '/';
  const isOnProtectedRoute =
    pathname.startsWith('/cashier') || pathname.startsWith('/impostazioni') || pathname.startsWith('/settings');
  const isOnLogin = pathname.startsWith('/login');

  if (isRoot) {
    return NextResponse.redirect(new URL(isAuthenticated ? '/cashier' : '/login', request.url));
  }

  if (isOnProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnLogin && isAuthenticated) {
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
