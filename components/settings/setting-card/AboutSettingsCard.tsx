import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';

export function AboutSettingsCard() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-amber-600" />
                    <CardTitle className='select-none'>Informazioni</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    Dettagli sull'applicazione
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Versione</Label>
                        <div className="text-sm text-muted-foreground">1.0.0</div>
                    </div>
                    <div className="space-y-2">
                        <Label>Build</Label>
                        <div className="text-sm text-muted-foreground">2025.11</div>
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label>Licenza</Label>
                    <div className="text-sm text-muted-foreground">
                        © 2025 MyCassa. Tutti i diritti riservati.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
