'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MobileUserMenu } from './MobileUserMenu';

interface MobileCassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
    user?: { username: string; role: string };
    onGeneralClosure?: () => void;
    onVerificaClick?: () => void;
}

const EASTER_EGG_CLICKS = 20;
const EASTER_EGG_LOGO = 'https://mymagri.altervista.org/magri.jpg';

export function MobileCassaHeader({
    onLogout,
    onSettingsClick,
    theme,
    onThemeToggle,
    cashRegisterName,
    user,
    onGeneralClosure,
    onVerificaClick,
}: MobileCassaHeaderProps) {
    const [logoClickCount, setLogoClickCount] = useState(0);
    const easterEggActive = logoClickCount >= EASTER_EGG_CLICKS;
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogoClick = useCallback(() => {
        setLogoClickCount((prev: number) => {
            const next = prev + 1;
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
            if (next < EASTER_EGG_CLICKS) {
                clickTimeoutRef.current = setTimeout(() => setLogoClickCount(0), 20000);
            }
            return next;
        });
    }, []);

    return (
        <header className="fixed top-0 w-full border-b bg-card z-50">
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center">
                    <img
                        src={easterEggActive ? EASTER_EGG_LOGO : '/logo.svg'}
                        alt="Logo"
                        className="h-10 w-auto select-none cursor-pointer"
                        onClick={handleLogoClick}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {onVerificaClick && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer select-none"
                            onClick={onVerificaClick}
                        >
                            Verifica ordine
                        </Button>
                    )}
{user && (
                        <MobileUserMenu
                            user={user}
                            onLogout={onLogout}
                            onSettingsClick={onSettingsClick}
                            theme={theme}
                            onThemeToggle={onThemeToggle}
                            onGeneralClosure={onGeneralClosure}
                            cashRegisterName={cashRegisterName}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
