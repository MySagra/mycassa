import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

interface OrderFormProps {
    displayCode: string;
    customer: string;
    table: string;
    enableTableInput: boolean;
    validationErrors: { customer?: string; table?: string };
    onUpdateDisplayCode: (value: string) => void;
    onUpdateCustomer: (value: string) => void;
    onUpdateTable: (value: string) => void;
    onLoadOrder: () => void;
    loadingOrder: boolean;
}

export function OrderForm({
    displayCode,
    customer,
    table,
    enableTableInput,
    validationErrors,
    onUpdateDisplayCode,
    onUpdateCustomer,
    onUpdateTable,
    onLoadOrder,
    loadingOrder
}: OrderFormProps) {
    return (
        <div className="space-y-2 p-4">
            {/* Load Order */}
            <div>
                <Label htmlFor="displayCode" className='mb-2'>Carica Ordine</Label>
                <div className="mt-1 flex gap-2">
                    <Input
                        autoComplete='off'
                        id="displayCode"
                        placeholder="CODICE ORDINE (ES. ABC)"
                        value={displayCode}
                        onChange={(e) => onUpdateDisplayCode(e.target.value.toUpperCase())}
                        maxLength={3}
                        enterKeyHint="enter"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onLoadOrder();
                            }
                        }}
                    />
                    <Button onClick={onLoadOrder} className="cursor-pointer" disabled={loadingOrder}>
                        {loadingOrder ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Customer and Table */}
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <Label htmlFor="customer" className='mb-2'>Cliente *</Label>
                    <Input
                        autoComplete='off'
                        id="customer"
                        placeholder="Es. Mario Rossi"
                        value={customer}
                        onChange={(e) => onUpdateCustomer(e.target.value)}
                        className={validationErrors.customer ? 'border-red-500' : ''}
                    />
                    {validationErrors.customer && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.customer}</p>
                    )}
                </div>

                {enableTableInput && (
                    <div>
                        <Label htmlFor="table" className='mb-2'>Tavolo *</Label>
                        <Input
                            autoComplete='off'
                            id="table"
                            placeholder="Es. 12 o Tavolo A5"
                            value={table}
                            onChange={(e) => onUpdateTable(e.target.value)}
                            className={validationErrors.table ? 'border-red-500' : ''}
                        />
                        {validationErrors.table && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors.table}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
