import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, Search, X, Maximize, Minimize, AlertTriangle } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useState, useCallback, useRef } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

interface CassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
    cashRegisterInvalid?: boolean;
    foodSearchQuery: string;
    onFoodSearchChange: (query: string) => void;
    user?: { username: string; role: string };
    onGeneralClosure?: () => void;
}

const EASTER_EGG_CLICKS = 20;
const EASTER_EGG_LOGO = 'https://mymagri.altervista.org/magri.jpg';

export function CassaHeader({ onLogout, onSettingsClick, theme, onThemeToggle, cashRegisterName, cashRegisterInvalid, foodSearchQuery, onFoodSearchChange, user, onGeneralClosure }: CassaHeaderProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [logoClickCount, setLogoClickCount] = useState(0);
    const [showClosureConfirm, setShowClosureConfirm] = useState(false);
    const easterEggActive = logoClickCount >= EASTER_EGG_CLICKS;
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userRoleName = user ? (typeof user.role === 'string' ? user.role : (user.role as any)?.name ?? '') : '';
    const isAdminOrMaintainer = userRoleName.toUpperCase() === 'ADMIN' || userRoleName.toUpperCase() === 'MAINTAINER';
    const { t } = useTranslation();

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

                {/* Center: Food Search Bar */}
                <div className="flex-1 flex justify-center px-8 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={foodSearchQuery}
                            onChange={(e) => onFoodSearchChange(e.target.value)}
                            placeholder={t('header.searchFood')}
                            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors select-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {foodSearchQuery && (
                            <button
                                onClick={() => onFoodSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                aria-label={t('header.clearSearch')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
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
