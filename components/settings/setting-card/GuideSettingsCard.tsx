import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CircleHelp, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGuide } from '@/components/cassa/guide/GuideContext';

export function GuideSettingsCard() {
    const { openGuide } = useGuide();
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CircleHelp className="h-5 w-5 text-amber-600" />
                    <CardTitle className='select-none'>{t('settings.guide.title')}</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    {t('settings.guide.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Label>{t('settings.guide.tutorial')}</Label>
                    <Button variant="outline" size="sm" className='select-none cursor-pointer' onClick={openGuide}>
                        <Play className="h-4 w-4 mr-2" />
                        {t('settings.guide.open')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
