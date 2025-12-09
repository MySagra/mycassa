import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, LogOut } from 'lucide-react';

interface CassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
}

export function CassaHeader({ onLogout, onSettingsClick, theme, onThemeToggle, cashRegisterName }: CassaHeaderProps) {
    return (
        <header className="fixed top-0 w-full border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none"
                    />
                    <h1 className="text-2xl font-bold select-none">MyCassa</h1>
                </div>

                <div className="flex items-center gap-2">
                    {cashRegisterName && (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full select-none">
                                {cashRegisterName}
                            </span>
                        </div>
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
                    </ButtonGroup>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="select-none cursor-pointer">
                                <LogOut className="h-5 w-5" />
                                Logout
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Vuoi effettuare il logout?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ritornerai alla pagina di login
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
                                    <LogOut className="h-5 w-5" />
                                    Logout
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </header>
    );
}
