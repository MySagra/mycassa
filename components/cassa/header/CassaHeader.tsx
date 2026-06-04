import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, Maximize, Minimize, AlertTriangle, Euro, DollarSign } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useState, useCallback, useRef, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { openDrawer } from '@/actions/cashier';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
    const { t, i18n } = useTranslation();

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
                    <h1 className="text-2xl font-bold select-none">{easterEggActive ? 'MaiMagri' : 'MyCassa'}</h1>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {cashRegisterInvalid ? (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/30 px-3 py-1 rounded-full select-none">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {t('header.invalidCashRegister')}
                            </span>
                        </div>
                    ) : cashRegisterName ? (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full select-none">
                                {cashRegisterName}
                            </span>
                        </div>
                    ) : null}
                    {isAdminOrMaintainer && (
                        <Button
                            variant="destructive"
                            className="cursor-pointer"
                            size="sm"
                            onClick={() => setShowClosureConfirm(true)}
                        >
                            {t('header.closureButton')}
                        </Button>
                    )}
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
                    <ButtonGroup>
                        <Button variant="outline" className='cursor-pointer' size="icon" onClick={onSettingsClick}>
                            <Settings className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            className='cursor-pointer'
                            size="icon"
                            onClick={onThemeToggle}
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5 cursor-pointer" /> : <Moon className="h-5 w-5 cursor-pointer" />}
                        </Button>
                        <Button
                            variant="outline"
                            className='cursor-pointer'
                            size="icon"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
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
