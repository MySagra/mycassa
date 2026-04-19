import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AppearanceSettingsCardProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
}

export function AppearanceSettingsCard({ theme, setTheme }: AppearanceSettingsCardProps) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-amber-600" />
                    <CardTitle className='select-none'>{t('settings.appearance.title')}</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    {t('settings.appearance.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>{t('settings.appearance.theme')}</Label>
                        <div className="text-sm text-muted-foreground select-none">
                            {t('settings.appearance.themeDescription')}
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
                            {t('settings.appearance.light')}
                        </Button>
                        <Button
                            variant={theme === 'dark' ? 'default' : 'outline'}
                            size="sm"
                            className='select-none cursor-pointer'
                            onClick={() => setTheme('dark')}
                        >
                            <Moon className="h-4 w-4 mr-2" />
                            {t('settings.appearance.dark')}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
