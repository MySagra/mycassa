import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// In-memory storage for settings (in production, use a database)
const globalSettings: Record<string, any> = {
    enableTableInput: true, // default value
};

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (key) {
            return NextResponse.json({ [key]: globalSettings[key] ?? null });
        }

        return NextResponse.json(globalSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Errore nel recupero delle impostazioni' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        
        if (!session) {
            return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key è obbligatoria' }, { status: 400 });
        }

        globalSettings[key] = value;

        return NextResponse.json({ success: true, [key]: value });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Errore nel salvataggio delle impostazioni' }, { status: 500 });
    }
}
