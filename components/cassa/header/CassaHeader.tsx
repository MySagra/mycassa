import { Button } from '@/components/ui/button';
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
                    <h1 className="text-2xl font-bold">MyCassa</h1>
                </div>

                <div className="flex items-center gap-2">
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
                    <Button variant="outline" onClick={onLogout}>
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
