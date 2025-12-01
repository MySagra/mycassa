import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface GeneralSettingsCardProps {
    enableTableInput: boolean;
    onTableInputToggle: (checked: boolean) => void;
    isLoading: boolean;
}

export function GeneralSettingsCard({ enableTableInput, onTableInputToggle, isLoading }: GeneralSettingsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 select-none">
                    <Settings className="h-5 w-5 text-amber-600" />
                    <CardTitle>Generali</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    Configura le impostazioni generali dell'interfaccia cassa
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>Abilita input tavolo</Label>
                        <div className="text-sm text-muted-foreground select-none">
                            Mostra il campo per inserire il numero del tavolo nell'interfaccia cassa
                        </div>
                    </div>
                    <Switch
                        checked={enableTableInput}
                        className='cursor-pointer'
                        onCheckedChange={onTableInputToggle}
                        disabled={isLoading}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
