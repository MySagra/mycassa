import { NextResponse } from 'next/server';

// La route NextAuth non è più in uso. L'autenticazione avviene tramite
// il cookie HTTP-only mysagra_token gestito direttamente dal backend.
export function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
