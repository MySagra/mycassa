import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';

interface AppearanceSettingsCardProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
}

export function AppearanceSettingsCard({ theme, setTheme }: AppearanceSettingsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-amber-600" />
                    <CardTitle className='select-none'>Aspetto</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    Personalizza l'aspetto dell'applicazione
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Tema</Label>
                        <div className="text-sm text-muted-foreground select-none">
                            Scegli tra tema chiaro e scuro
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={theme === 'light' ? 'default' : 'outline'}
                            size="sm"
                            className='select-none cursor-pointer'
                            onClick={() => setTheme('light')}
                        >
                            <Sun className="h-4 w-4 mr-2" />
                            Chiaro
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'outline'}
                            size="sm"
                            className='select-none cursor-pointer'
                            onClick={() => setTheme('dark')}
                        >
                            <Moon className="h-4 w-4 mr-2" />
                            Scuro
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
