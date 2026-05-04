"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronDownIcon, LogOutIcon, Settings, Sun, Moon, Languages, ShieldAlert, Monitor, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

interface MobileUserMenuProps {
    user: { username: string; role: string };
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    onGeneralClosure?: () => void;
    cashRegisterName?: string;
    cashRegisterInvalid?: boolean;
}

function UserAvatar({ initials }: { initials: string }) {
    return (
        <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center text-base font-semibold select-none shrink-0">
            {initials}
        </div>
    );
}

export function MobileUserMenu({
    user,
    onLogout,
    onSettingsClick,
    theme,
    onThemeToggle,
    onGeneralClosure,
    cashRegisterName,
    cashRegisterInvalid,
}: MobileUserMenuProps) {
    const initials = user.username.slice(0, 2).toUpperCase();
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [showClosureConfirm, setShowClosureConfirm] = useState(false);

    const userRoleName = typeof user.role === 'string' ? user.role : (user.role as any)?.name ?? '';
    const isAdminOrMaintainer =
        userRoleName.toUpperCase() === 'ADMIN' || userRoleName.toUpperCase() === 'MAINTAINER';

    useEffect(() => { setMounted(true); }, []);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-8 px-2 bg-transparent hover:bg-transparent focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer">
                        <UserAvatar initials={initials} />
                        <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-48 rounded-lg select-none" align="end" sideOffset={6}>
                    <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5">
                            <UserAvatar initials={initials} />
                            <div className="grid text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.username}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdminOrMaintainer && onGeneralClosure && (
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setShowClosureConfirm(true)}
                        >
                            <ShieldAlert className="h-4 w-4" />
                            {t('header.closureButton')}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="cursor-pointer" onClick={onSettingsClick}>
                        <Settings className="h-4 w-4" />
                        {t("userMenu.settings")}
                    </DropdownMenuItem>
                    {mounted && (
                        <DropdownMenuItem className="cursor-pointer" onClick={onThemeToggle}>
                            {theme === "dark"
                                ? <Sun className="h-4 w-4" />
                                : <Moon className="h-4 w-4" />
                            }
                            {theme === "dark" ? t("userMenu.lightTheme") : t("userMenu.darkTheme")}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                            <Languages className="h-4 w-4" />
                            {t("userMenu.language")}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuCheckboxItem
                                    checked={i18n.language === 'it' || !i18n.language}
                                    onClick={() => i18n.changeLanguage('it')}
                                    className="cursor-pointer"
                                >
                                    {t("userMenu.italian")}
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={i18n.language === 'en'}
                                    onClick={() => i18n.changeLanguage('en')}
                                    className="cursor-pointer"
                                >
                                    {t("userMenu.english")}
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    {cashRegisterInvalid ? (
                        <DropdownMenuItem disabled className="cursor-default text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            {t('header.invalidCashRegister')}
                        </DropdownMenuItem>
                    ) : cashRegisterName ? (
                        <DropdownMenuItem disabled className="opacity-70 cursor-default">
                            <Monitor className="h-4 w-4" />
                            {cashRegisterName}
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                        <LogOutIcon className="h-4 w-4" />
                        {t("userMenu.logout")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
        </>
    );
}
