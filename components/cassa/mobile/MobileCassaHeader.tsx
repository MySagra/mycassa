'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { MobileUserMenu } from './MobileUserMenu';
import { AlertTriangle, Euro, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { openDrawer } from '@/actions/cashier';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface MobileCassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
    cashRegisterId?: string;
    cashRegisterInvalid?: boolean;
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
    cashRegisterId,
    cashRegisterInvalid,
    user,
    onGeneralClosure,
    onVerificaClick,
}: MobileCassaHeaderProps) {
    const { t, i18n } = useTranslation();
    const [logoClickCount, setLogoClickCount] = useState(0);
    const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);
    const easterEggActive = logoClickCount >= EASTER_EGG_CLICKS;
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const drawerIcon = useMemo(() => {
        return i18n.language === 'it' ? <Euro className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />;
    }, [i18n.language]);

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

    const handleOpenDrawer = useCallback(async () => {
        if (!cashRegisterId) {
            toast.error(t('toast.cashierNotSelected'));
            return;
        }

        setIsOpeningDrawer(true);
        try {
            const result = await openDrawer(cashRegisterId);
            if (!result.success) throw new ApiError(result.status ?? 0, result.error, (result as any).code);
            toast.success(t('toast.drawerOpened'));
        } catch (error: any) {
            if (error instanceof ApiError && error.isAuthError) {
                onLogout();
                return;
            }
            toast.error(error instanceof ApiError ? error.message : t('toast.drawerOpenError'));
        } finally {
            setIsOpeningDrawer(false);
        }
    }, [cashRegisterId, t]);

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
                    {cashRegisterInvalid && (
                        <span className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 px-2 py-1 rounded-full select-none">
                            <AlertTriangle className="h-3 w-3" />
                            {t('header.invalidCashRegister')}
                        </span>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="cursor-pointer select-none"
                                onClick={handleOpenDrawer}
                                disabled={isOpeningDrawer}
                                aria-label={t('header.openDrawerButton')}
                            >
                                {drawerIcon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('header.openDrawerTooltip')}
                        </TooltipContent>
                    </Tooltip>
                    {onVerificaClick && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer select-none"
                            onClick={onVerificaClick}
                        >
                            {t('mobile.header.verifyOrder')}
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
                            cashRegisterInvalid={cashRegisterInvalid}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
