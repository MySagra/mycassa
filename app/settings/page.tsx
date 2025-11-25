"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { SettingsHeader } from '@/components/settings/header/SettingsHeader';
import { GeneralSettingsCard } from '../../components/settings/setting-card/GeneralSettingsCard';
import { PrintersSettingsCard } from '../../components/settings/setting-card/PrintersSettingsCard';
import { AppearanceSettingsCard } from '../../components/settings/setting-card/AppearanceSettingsCard';
import { AboutSettingsCard } from '../../components/settings/setting-card/AboutSettingsCard';

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

    const loadSettings = () => {
        try {
            const saved = localStorage.getItem('enableTableInput');
            setEnableTableInput(saved ? JSON.parse(saved) : true);
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const saveSetting = (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            toast.success('Impostazione salvata con successo');
        } catch (error) {
            console.error('Error saving setting:', error);
            toast.error('Errore nel salvataggio dell\'impostazione');
        }
    };

    const handleTableInputToggle = (checked: boolean) => {
        setEnableTableInput(checked);
        saveSetting('enableTableInput', checked);
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
            <SettingsHeader />
            <main className="container max-w-4xl mx-auto p-6 space-y-6">
                <GeneralSettingsCard
                    enableTableInput={enableTableInput}
                    onTableInputToggle={handleTableInputToggle}
                    isLoading={isLoadingSettings}
                />
                <PrintersSettingsCard />
                <AppearanceSettingsCard
                    theme={theme}
                    setTheme={setTheme}
                />
                <AboutSettingsCard />
            </main>
        </div>
    );
}

