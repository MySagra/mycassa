'use client';

import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, Receipt, Loader2 } from 'lucide-react';
import { getPrinterById, reprintOrder } from '@/actions/cassa';
import { toast } from 'sonner';

interface PrinterInfo {
    id: string;
    name: string;
    checked: boolean;
    /** IDs of order items that belong to this printer */
    itemIds: string[];
}

interface ReprintDialogProps {
    order: OrderDetailResponse;
    open: boolean;
    onClose: () => void;
}

export function ReprintDialog({ order, open, onClose }: ReprintDialogProps) {
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [reprintReceipt, setReprintReceipt] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Extract unique printers and fetch their names when the dialog opens
    useEffect(() => {
        if (!open) return;

        const fetchPrinters = async () => {
            setLoading(true);
            setPrinters([]);
            setReprintReceipt(false);

            // Build a map: printerId -> list of order item IDs
            const printerItemMap = new Map<string, string[]>();

            for (const catItem of order.categorizedItems) {
                for (const item of catItem.items) {
                    const pid = item.food.printerId;
                    if (pid) {
                        const existing = printerItemMap.get(pid) || [];
                        existing.push(item.id);
                        printerItemMap.set(pid, existing);
                    }
                }
            }

            // Fetch each printer's name
            const printerInfos: PrinterInfo[] = [];

            for (const [printerId, itemIds] of printerItemMap.entries()) {
                try {
                    const result = await getPrinterById(printerId);
                    printerInfos.push({
                        id: printerId,
                        name: result.success ? (result.data as any)?.name || printerId : printerId,
                        checked: false,
                        itemIds,
                    });
                } catch {
                    printerInfos.push({
                        id: printerId,
                        name: printerId,
                        checked: false,
                        itemIds,
                    });
                }
            }

            setPrinters(printerInfos);
            setLoading(false);
        };

        fetchPrinters();
    }, [open, order]);

    const togglePrinter = (printerId: string) => {
        setPrinters((prev) =>
            prev.map((p) =>
                p.id === printerId ? { ...p, checked: !p.checked } : p
            )
        );
    };

    const hasSelection = printers.some((p) => p.checked) || reprintReceipt;

    const handleSubmit = async () => {
        if (!hasSelection) return;

        setSubmitting(true);

        // Collect item IDs from selected printers
        const selectedItemIds = printers
            .filter((p) => p.checked)
            .flatMap((p) => p.itemIds);

        // Deduplicate
        const uniqueItemIds = [...new Set(selectedItemIds)];

        const body = {
            orderItems: uniqueItemIds.map((id) => ({ id })),
            reprintReceipt,
        };

        try {
            const result = await reprintOrder(order.id, body);
            if (result.success) {
                toast.success('Ristampa eseguita con successo');
                onClose();
            } else {
                toast.error(result.error || 'Errore durante la ristampa');
            }
        } catch {
            toast.error('Errore durante la ristampa');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[450px] select-none">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Ristampa Ordine {order.displayCode}
                    </DialogTitle>
                    <DialogDescription>
                        Seleziona le stampanti su cui eseguire la ristampa
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Printer checkboxes */}
                        {printers.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-muted-foreground">
                                    Stampanti
                                </p>
                                {printers.map((printer) => (
                                    <label
                                        key={printer.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted dark:bg-muted/40 cursor-pointer hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors"
                                    >
                                        <Checkbox
                                            checked={printer.checked}
                                            onCheckedChange={() =>
                                                togglePrinter(printer.id)
                                            }
                                        />
                                        <div className="flex items-center gap-2">
                                            <Printer className="h-4 w-4 text-amber-600" />
                                            <span className="font-medium">
                                                {printer.name}
                                            </span>
                                        </div>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {printer.itemIds.length}{' '}
                                            {printer.itemIds.length === 1
                                                ? 'prodotto'
                                                : 'prodotti'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">
                                Nessuna stampante trovata per questo ordine
                            </p>
                        )}

                        {/* Divider */}
                        <div className="border-t" />

                        {/* Fiscal receipt checkbox */}
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-muted dark:bg-muted/40 cursor-pointer hover:bg-muted/80 dark:hover:bg-muted/60 transition-colors">
                            <Checkbox
                                checked={reprintReceipt}
                                onCheckedChange={(checked) =>
                                    setReprintReceipt(checked === true)
                                }
                            />
                            <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-amber-600" />
                                <span className="font-medium">
                                    Scontrino fiscale
                                </span>
                            </div>
                        </label>
                    </div>
                )}

                <DialogFooter>
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Annulla
                        </Button>
                        <Button
                            className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={handleSubmit}
                            disabled={!hasSelection || submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Printer className="h-4 w-4 mr-2" />
                            )}
                            Ristampa
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
