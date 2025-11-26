import { ExtendedCartItem, PaymentMethod } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash2, Percent, ShoppingBasket } from 'lucide-react';
import { OrderForm } from './OrderForm';
import { PaymentSection } from './PaymentSection';
import { CartItem } from './CartItem';
import { useState } from 'react';
import { toast } from 'sonner';

interface CartSidebarProps {
    cart: ExtendedCartItem[];
    customer: string;
    table: string;
    displayCode: string;
    enableTableInput: boolean;
    paymentMethod: PaymentMethod;
    paidAmount: string;
    appliedDiscount: number;
    total: number;
    surcharges: number;
    change: number;
    validationErrors: { customer?: string; table?: string; paidAmount?: string };
    validationMessage: string[] | null;
    onUpdateCustomer: (value: string) => void;
    onUpdateTable: (value: string) => void;
    onUpdateDisplayCode: (value: string) => void;
    onLoadOrder: () => void;
    loadingOrder: boolean;
    onUpdateQuantity: (cartItemId: string, delta: number) => void;
    onRemoveItem: (cartItemId: string) => void;
    onEditItem: (item: ExtendedCartItem) => void;
    onClearCart: () => void;
    onConfirmOrder: () => void;
    onOpenDiscount: () => void;
    onUpdatePaymentMethod: (method: PaymentMethod) => void;
    onUpdatePaidAmount: (value: string) => void;
    showDailyOrders: boolean;
    onToggleDailyOrders: () => void;
    cartScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function CartSidebar({
    cart,
    customer,
    table,
    displayCode,
    enableTableInput,
    paymentMethod,
    paidAmount,
    appliedDiscount,
    total,
    surcharges,
    change,
    validationErrors,
    validationMessage,
    onUpdateCustomer,
    onUpdateTable,
    onUpdateDisplayCode,
    onLoadOrder,
    loadingOrder,
    onUpdateQuantity,
    onRemoveItem,
    onEditItem,
    onClearCart,
    onConfirmOrder,
    onOpenDiscount,
    onUpdatePaymentMethod,
    onUpdatePaidAmount,
    showDailyOrders,
    onToggleDailyOrders,
    cartScrollRef
}: CartSidebarProps) {
    const [openClearDialog, setOpenClearDialog] = useState(false);

    const handleClearCart = () => {
        onClearCart();
        setOpenClearDialog(false);
        toast.success('Carrello svuotato');
    };

    return (
        <aside className="w-96 border-l bg-card flex flex-col">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-semibold select-none">Carrello</h2>

                <Button
                    variant={showDailyOrders ? 'default' : 'outline'}
                    onClick={onToggleDailyOrders}
                    className='select-none'
                >
                    Ordini Giornalieri
                </Button>
            </div>

            <OrderForm
                displayCode={displayCode}
                customer={customer}
                table={table}
                enableTableInput={enableTableInput}
                validationErrors={validationErrors}
                onUpdateDisplayCode={onUpdateDisplayCode}
                onUpdateCustomer={onUpdateCustomer}
                onUpdateTable={onUpdateTable}
                onLoadOrder={onLoadOrder}
                loadingOrder={loadingOrder}
            />

            {/* Cart Items */}
            <div className="flex-1 border-y overflow-hidden">
                <ScrollArea className="h-full" ref={cartScrollRef}>
                    <div className="p-4">
                        {cart.length === 0 ? (
                            <div>
                                <ShoppingBasket className="h-20 w-20 mx-auto mt-10 text-muted-foreground" />
                                <div className="flex items-center font-bold justify-center text-sm text-muted-foreground select-none">
                                    Carrello vuoto
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <CartItem
                                        key={item.cartItemId}
                                        item={item}
                                        onUpdateQuantity={(delta) => onUpdateQuantity(item.cartItemId, delta)}
                                        onRemove={() => onRemoveItem(item.cartItemId)}
                                        onEdit={() => onEditItem(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Footer - Total & Payment */}
            <PaymentSection
                total={total}
                surcharges={surcharges}
                discount={appliedDiscount}
                paymentMethod={paymentMethod}
                paidAmount={paidAmount}
                change={change}
                validationErrors={validationErrors}
                onUpdatePaymentMethod={onUpdatePaymentMethod}
                onUpdatePaidAmount={onUpdatePaidAmount}
            />

            {/* Actions row: empty cart (icon) + confirm order */}
            <div className="flex items-center gap-2 p-4 pt-0">
                {/* Empty cart icon */}
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setOpenClearDialog(true)}
                    aria-label="Svuota carrello"
                    title="Svuota carrello"
                    className="h-10 w-10 disabled:cursor-not-allowed"
                    disabled={cart.length === 0}
                >
                    <Trash2 className="h-4 w-4 text-white" />
                </Button>

                <AlertDialog open={openClearDialog} onOpenChange={setOpenClearDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Svuotare il carrello?</AlertDialogTitle>
                            <AlertDialogDescription>
                                L'azione non può essere annullata.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={handleClearCart}
                            >
                                Svuota
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <TooltipProvider>
                    <Tooltip open={cart.length === 0 || !customer || (enableTableInput && !table) ? undefined : false}>
                        <TooltipTrigger asChild>
                            <div className="flex-1">
                                <Button
                                    className="w-full bg-amber-500 text-lg font-semibold hover:bg-amber-600 select-none"
                                    size="lg"
                                    onClick={onConfirmOrder}
                                    disabled={cart.length === 0 || !customer || (enableTableInput && !table)}
                                >
                                    Crea Ordine
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {(cart.length === 0 || !customer || (enableTableInput && !table)) && validationMessage && (
                            <TooltipContent side="top" className="max-w-xs select-none">
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {validationMessage.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

                <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 disabled:cursor-not-allowed"
                    onClick={onOpenDiscount}
                    aria-label="Applica sconto"
                    title="Applica sconto"
                >
                    <Percent className="h-6 w-6" strokeWidth={2.5} />
                </Button>
            </div>
        </aside>
    );
}
