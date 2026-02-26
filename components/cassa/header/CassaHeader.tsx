import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, LogOut, Search, X } from 'lucide-react';

interface CassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName?: string;
    foodSearchQuery: string;
    onFoodSearchChange: (query: string) => void;
}

export function CassaHeader({ onLogout, onSettingsClick, theme, onThemeToggle, cashRegisterName, foodSearchQuery, onFoodSearchChange }: CassaHeaderProps) {
    return (
        <header className="fixed top-0 w-full border-b bg-card z-50">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left: Logo + Title */}
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none"
                    />
                    <h1 className="text-2xl font-bold select-none">MyCassa</h1>
                </div>

                {/* Center: Food Search Bar */}
                <div className="flex-1 flex justify-center px-8 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={foodSearchQuery}
                            onChange={(e) => onFoodSearchChange(e.target.value)}
                            placeholder="Cerca un cibo..."
                            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {foodSearchQuery && (
                            <button
                                onClick={() => onFoodSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                aria-label="Cancella ricerca"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
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
