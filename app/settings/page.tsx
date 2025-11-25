"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Moon,
    Sun,
    Info,
    Palette,
    Settings
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const [enableTableInput, setEnableTableInput] = useState(true);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const isAuthenticated = status === 'authenticated';
    const isLoading = status === 'loading';

    // Load settings on mount
    useEffect(() => {
        if (isAuthenticated) {
            loadSettings();
        }
    }, [isAuthenticated]);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings?key=enableTableInput');
            if (response.ok) {
                const data = await response.json();
                setEnableTableInput(data.enableTableInput ?? true);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const saveSetting = async (key: string, value: any) => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });

            if (response.ok) {
                toast.success('Impostazione salvata con successo');
            } else {
                toast.error('Errore nel salvataggio dell\'impostazione');
            }
        } catch (error) {
            console.error('Error saving setting:', error);
            toast.error('Errore nel salvataggio dell\'impostazione');
        }
    };

    const handleTableInputToggle = async (checked: boolean) => {
        setEnableTableInput(checked);
        await saveSetting('enableTableInput', checked);
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Caricamento...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="mx-auto h-10 w-auto select-none"
                        />
                        <h1 className="text-2xl font-bold select-none">Impostazioni</h1>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className='select-none'
                        onClick={() => router.push('/cassa')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Torna alla Cassa
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-4xl mx-auto p-6 space-y-6">
                {/* General Settings Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 select-none">
                            <Settings className="h-5 w-5 text-amber-600" />
                            <CardTitle>Generali</CardTitle>
                        </div>
                        <CardDescription className='select-none'>
                            Configura le impostazioni generali dell'interfaccia cassa
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Abilita input tavolo</Label>
                                <div className="text-sm text-muted-foreground select-none">
                                    Mostra il campo per inserire il numero del tavolo nell'interfaccia cassa
                                </div>
                            </div>
                            <Switch
                                checked={enableTableInput}
                                onCheckedChange={handleTableInputToggle}
                                disabled={isLoadingSettings}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-amber-600" />
                            <CardTitle className='select-none'>Aspetto</CardTitle>
                        </div>
                        <CardDescription className='select-none'>
                            Personalizza l'aspetto dell'applicazione
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Tema</Label>
                                <div className="text-sm text-muted-foreground select-none">
                                    Scegli tra tema chiaro e scuro
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={theme === 'light' ? 'default' : 'outline'}
                                    size="sm"
                                    className='select-none'
                                    onClick={() => setTheme('light')}
                                >
                                    <Sun className="h-4 w-4 mr-2" />
                                    Chiaro
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'default' : 'outline'}
                                    size="sm"
                                    className='select-none'
                                    onClick={() => setTheme('dark')}
                                >
                                    <Moon className="h-4 w-4 mr-2" />
                                    Scuro
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-amber-600" />
                            <CardTitle className='select-none'>Informazioni</CardTitle>
                        </div>
                        <CardDescription className='select-none'>
                            Dettagli sull'applicazione
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Versione</Label>
                                <div className="text-sm text-muted-foreground">1.0.0</div>
                            </div>
                            <div className="space-y-2">
                                <Label>Build</Label>
                                <div className="text-sm text-muted-foreground">2025.11</div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label>Licenza</Label>
                            <div className="text-sm text-muted-foreground">
                                © 2025 MyCassa. Tutti i diritti riservati.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
