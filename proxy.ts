import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/login'];

// Next.js 16: il file proxy.ts sostituisce il vecchio middleware.ts.
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
  );

  // Già autenticato e su /login → manda all'app.
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL('/cashier', nextUrl));
  }

  // Non autenticato su rotta protetta → /login, conservando la destinazione.
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', nextUrl);
    if (nextUrl.pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Esegui sulle pagine; le route /api gestiscono l'auth da sé (ritornano 401).
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
