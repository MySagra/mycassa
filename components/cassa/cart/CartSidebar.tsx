import { ExtendedCartItem, Ingredient, PaymentMethod } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash2, Percent, ShoppingBasket } from 'lucide-react';
import { OrderForm } from './OrderForm';
import { PaymentSection } from './PaymentSection';
import { CartItem } from './CartItem';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CartSidebarProps {
    cart: ExtendedCartItem[];
    allIngredients: Ingredient[];
    customer: string;
    table: string;
    displayCode: string;
    enableTableInput: boolean;
    tableInputDisabled?: boolean;
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
    loadingConfirmOrder: boolean;
    onOpenDiscount: () => void;
    onUpdatePaymentMethod: (method: PaymentMethod) => void;
    onUpdatePaidAmount: (value: string) => void;
    showDailyOrders: boolean;
    onToggleDailyOrders: () => void;
    cartScrollRef: React.RefObject<HTMLDivElement | null>;
}

export function CartSidebar({
    cart,
    allIngredients,
    customer,
    table,
    displayCode,
    enableTableInput,
    tableInputDisabled,
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
    loadingConfirmOrder,
    onOpenDiscount,
    onUpdatePaymentMethod,
    onUpdatePaidAmount,
    showDailyOrders,
    onToggleDailyOrders,
    cartScrollRef
}: CartSidebarProps) {
    const [openClearDialog, setOpenClearDialog] = useState(false);
    const [previousTotal, setPreviousTotal] = useState<number | null>(null);
    const [previousTotalProgress, setPreviousTotalProgress] = useState(100);
    const [lastNonZeroTotal, setLastNonZeroTotal] = useState<number | null>(null);
    const [wasOrderJustConfirmed, setWasOrderJustConfirmed] = useState(false);
    const previousTotalTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { t } = useTranslation();

    const PREVIOUS_TOTAL_DURATION = 20000; // 20 secondi in ms

    const clearPreviousTotal = useCallback(() => {
        setPreviousTotal(null);
        setPreviousTotalProgress(100);
        setWasOrderJustConfirmed(false);
        if (previousTotalTimerRef.current) {
            clearInterval(previousTotalTimerRef.current);
            previousTotalTimerRef.current = null;
        }
    }, []);

    // Salva ultimo totale non-zero quando cart ha items
    useEffect(() => {
        if (cart.length > 0 && total > 0) {
            setLastNonZeroTotal(total);
        }
    }, [cart.length, total]);

    // Mostra previousTotal solo se ordine è stato appena confermato
    useEffect(() => {
        if (cart.length === 0 && lastNonZeroTotal !== null && previousTotal === null && wasOrderJustConfirmed) {
            setPreviousTotal(lastNonZeroTotal);
            setPreviousTotalProgress(100);

            if (previousTotalTimerRef.current) {
                clearInterval(previousTotalTimerRef.current);
            }

            const startTime = Date.now();
            previousTotalTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.max(0, 100 - (elapsed / PREVIOUS_TOTAL_DURATION) * 100);
                setPreviousTotalProgress(progress);

                if (progress <= 0) {
                    clearPreviousTotal();
                    return;
                }
            }, 50);
        }
    }, [cart.length, lastNonZeroTotal, previousTotal, wasOrderJustConfirmed, clearPreviousTotal]);

    // Rimuovi previousTotal se viene aggiunto cibo
    useEffect(() => {
        if (cart.length > 0 && previousTotal !== null) {
            clearPreviousTotal();
        }
    }, [cart.length, previousTotal, clearPreviousTotal]);

    const handleClearCart = () => {
        onClearCart();
        setOpenClearDialog(false);
        toast.success(t('cartSidebar.toastCleared'));
    };

    const handleRemoveItem = (cartItemId: string) => {
        clearPreviousTotal();
        onRemoveItem(cartItemId);
    };

    const handleConfirmOrder = () => {
        setWasOrderJustConfirmed(true);
        onConfirmOrder();
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (previousTotalTimerRef.current) {
                clearInterval(previousTotalTimerRef.current);
            }
        };
    }, []);

    return (
        <aside className="w-96 border-l bg-card flex flex-col">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-semibold select-none">{t('cartSidebar.title')}</h2>

                <Button
                    variant={showDailyOrders ? 'default' : 'outline'}
                    onClick={onToggleDailyOrders}
                    className='select-none cursor-pointer'
                >
                    {t('cartSidebar.dailyOrders')}
                </Button>
            </div>

            <OrderForm
                displayCode={displayCode}
                customer={customer}
                table={table}
                enableTableInput={enableTableInput}
                tableInputDisabled={tableInputDisabled}
                validationErrors={validationErrors}
                onUpdateDisplayCode={onUpdateDisplayCode}
                onUpdateCustomer={onUpdateCustomer}
                onUpdateTable={onUpdateTable}
                onLoadOrder={onLoadOrder}
                loadingOrder={loadingOrder}
            />

            {/* Cart Items */}
            <div className="flex-1 border-y overflow-hidden">
                <ScrollArea className="h-full bg-background/60" ref={cartScrollRef}>
                    <div className="p-4">
                        {cart.length === 0 ? (
                            <div>
                                <ShoppingBasket className="h-20 w-20 mx-auto mt-10 text-muted-foreground" />
                                <div className="flex items-center font-bold justify-center text-sm text-muted-foreground select-none">
                                    {t('cartSidebar.emptyCart')}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <CartItem
                                        key={item.cartItemId}
                                        item={item}
                                        allIngredients={allIngredients}
                                        onUpdateQuantity={(delta) => onUpdateQuantity(item.cartItemId, delta)}
                                        onRemove={() => handleRemoveItem(item.cartItemId)}
                                        onEdit={() => onEditItem(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Previous Total Progress Bar */}
            {previousTotal !== null && (
                <div className="w-full h-1 bg-muted overflow-hidden border-b">
                    <div
                        className="h-full bg-amber-500 transition-all ease-linear"
                        style={{ width: `${previousTotalProgress}%` }}
                    />
                </div>
            )}

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
                previousTotal={previousTotal}
                previousTotalProgress={previousTotalProgress}
            />

            {/* Actions row: empty cart (icon) + confirm order */}
            <div className="flex items-center gap-2 p-4 pt-0">
                {/* Empty cart icon */}
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setOpenClearDialog(true)}
                    aria-label={t('cartSidebar.clearCartHover')}
                    title={t('cartSidebar.clearCartHover')}
                    className="h-10 w-10 disabled:cursor-not-allowed cursor-pointer"
                    disabled={cart.length === 0}
                >
                    <Trash2 className="h-4 w-4 text-white" />
                </Button>

                <AlertDialog open={openClearDialog} onOpenChange={setOpenClearDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('cartSidebar.clearCartTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('cartSidebar.clearCartDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('cartSidebar.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/80"
                                onClick={handleClearCart}
                            >
                                {t('cartSidebar.clear')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex-1">
                                <Button
                                    className="w-full text-lg font-semibold select-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                    size="lg"
                                    onClick={handleConfirmOrder}
                                    disabled={cart.length === 0 || !customer || customer.length < 2 || (enableTableInput && !table) || loadingConfirmOrder}
                                >
                                    {loadingConfirmOrder ? (
                                        <>
                                            <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            {t('cartSidebar.creatingOrder')}
                                        </>
                                    ) : (
                                        t('cartSidebar.createOrder')
                                    )}
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {validationMessage && (
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
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 disabled:cursor-not-allowed cursor-pointer"
                    onClick={onOpenDiscount}
                    aria-label={t('cartSidebar.applyDiscount')}
                    title={t('cartSidebar.applyDiscount')}
                >
                    <Percent className="h-6 w-6" strokeWidth={2.5} />
                </Button>
            </div>
        </aside>
    );
}
