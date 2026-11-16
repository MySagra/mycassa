import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, Maximize, Minimize, AlertTriangle, Euro, DollarSign, PoundSterling, Banknote, CircleHelp, Monitor } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useState, useCallback, useRef, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { openDrawer } from '@/actions/cashier';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useGuide } from '@/components/cassa/guide/GuideContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { OrderingStatusBadge, headerChipClass } from './OrderingStatusBadge';
import { HeaderClock } from './HeaderClock';
import { cn } from '@/lib/utils';

interface CassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
    cashRegisterId?: string;
    cashRegisterInvalid?: boolean;
    user?: { username: string; role: string };
    onGeneralClosure?: () => void;
}

const EASTER_EGG_CLICKS = 20;
const EASTER_EGG_LOGO = 'https://mymagri.altervista.org/magri.jpg';

export function CassaHeader({ onLogout, onSettingsClick, theme, onThemeToggle, cashRegisterName, cashRegisterId, cashRegisterInvalid, user, onGeneralClosure }: CassaHeaderProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [logoClickCount, setLogoClickCount] = useState(0);
    const [showClosureConfirm, setShowClosureConfirm] = useState(false);
    const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);
    const easterEggActive = logoClickCount >= EASTER_EGG_CLICKS;
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userRoleName = user ? (typeof user.role === 'string' ? user.role : (user.role as any)?.name ?? '') : '';
    const isAdminOrMaintainer = userRoleName.toUpperCase() === 'ADMIN' || userRoleName.toUpperCase() === 'MAINTAINER';
    const { t } = useTranslation();
    const { openGuide } = useGuide();
    const { currency, sagraName } = useSettings();

    const drawerIcon = useMemo(() => currencyIcon(currency), [currency]);

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

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
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
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left: Logo + Title */}
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <img
                        src={easterEggActive ? EASTER_EGG_LOGO : '/logo.svg'}
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none"
                        onClick={handleLogoClick}
                    />
                    <div className="flex flex-col min-w-0 leading-tight">
                        <h1 className="text-2xl font-bold select-none">{easterEggActive ? 'MaiMagri' : 'MyCassa'}</h1>
                        {sagraName && (
                            <span className="text-xs text-muted-foreground truncate max-w-64 select-none" title={sagraName}>
                                {sagraName}
                            </span>
                        )}
                    </div>
                    <div className="mx-2 h-8 w-px bg-border" aria-hidden />
                    <HeaderClock />
                </div>

                {/* Right: status chips | actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <OrderingStatusBadge />
                    {cashRegisterInvalid ? (
                        <span className={cn(headerChipClass, 'text-destructive bg-destructive/10 border-destructive/30')}>
                            <AlertTriangle className="h-4 w-4" />
                            {t('header.invalidCashRegister')}
                        </span>
                    ) : cashRegisterName ? (
                        <span className={cn(headerChipClass, 'text-muted-foreground bg-muted/50')}>
                            <Monitor className="h-4 w-4" />
                            {cashRegisterName}
                        </span>
                    ) : null}

                    <div className="mx-1 h-6 w-px bg-border" aria-hidden />

                    {isAdminOrMaintainer && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
                                    onClick={() => setShowClosureConfirm(true)}
                                >
                                    {t('header.closureButton')}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                {t('header.closureTooltip')}
                            </TooltipContent>
                        </Tooltip>
                    )}
                    <ButtonGroup>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer"
                                    size="icon"
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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" className='cursor-pointer' size="icon" onClick={onSettingsClick} aria-label={t('userMenu.settings')}>
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('userMenu.settings')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className='cursor-pointer'
                                    size="icon"
                                    onClick={onThemeToggle}
                                    aria-label={theme === 'dark' ? t('userMenu.lightTheme') : t('userMenu.darkTheme')}
                                >
                                    {theme === 'dark' ? <Sun className="h-5 w-5 cursor-pointer" /> : <Moon className="h-5 w-5 cursor-pointer" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{theme === 'dark' ? t('userMenu.lightTheme') : t('userMenu.darkTheme')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className='cursor-pointer'
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    aria-label={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
                                >
                                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" className='cursor-pointer' size="icon" onClick={openGuide} aria-label={t('header.guide')}>
                                    <CircleHelp className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('header.guide')}</TooltipContent>
                        </Tooltip>
                    </ButtonGroup>

                    {user && <UserMenu user={user} onLogout={onLogout} />}
                </div>
            </div>

            <AlertDialog open={showClosureConfirm} onOpenChange={setShowClosureConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('header.closureConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('header.closureConfirmDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('header.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowClosureConfirm(false);
                                onGeneralClosure?.();
                            }}
                        >
                            {t('header.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}

/** Icona del cassetto in base alla valuta configurata. */
export function currencyIcon(currency: string, className = 'h-5 w-5') {
    switch (currency.toUpperCase()) {
        case 'EUR': return <Euro className={className} />;
        case 'USD': return <DollarSign className={className} />;
        case 'GBP': return <PoundSterling className={className} />;
        default: return <Banknote className={className} />;
    }
}
