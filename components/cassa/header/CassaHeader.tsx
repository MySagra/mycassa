import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Settings, Moon, Sun, LogOut } from 'lucide-react';

interface CassaHeaderProps {
    onLogout: () => void;
    onSettingsClick: () => void;
    theme: string | undefined;
    onThemeToggle: () => void;
}

export function CassaHeader({ onLogout, onSettingsClick, theme, onThemeToggle }: CassaHeaderProps) {
    return (
        <header className="border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none"
                    />
                    <h1 className="text-2xl font-bold select-none">MyCassa</h1>
                </div>

                <div className="flex items-center gap-2">
                    <ButtonGroup>
                        <Button variant="outline" size="icon" onClick={onSettingsClick}>
                            <Settings className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onThemeToggle}
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                    </ButtonGroup>

                    <Button variant="outline" onClick={onLogout} className="select-none">
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
