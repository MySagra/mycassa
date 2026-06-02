"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { SettingsHeader } from '@/components/settings/header/SettingsHeader';
import { PrintersSettingsCard } from '../../components/settings/setting-card/PrintersSettingsCard';
import { AppearanceSettingsCard } from '../../components/settings/setting-card/AppearanceSettingsCard';
import { CategoryVisibilitySettingsCard } from '../../components/settings/setting-card/CategoryVisibilitySettingsCard';

export default function SettingsPage() {
    const router = useRouter();
    const { isLoading, isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();
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
                <PrintersSettingsCard />
                <CategoryVisibilitySettingsCard />
                <AppearanceSettingsCard
                    theme={theme}
                    setTheme={setTheme}
                />
            </main>
        </div>
    );
}

