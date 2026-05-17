'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Trash2, Percent, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { MobileCassaHeader } from './MobileCassaHeader';
import { OrderForm } from '@/components/cassa/cart/OrderForm';
import { PaymentSection } from '@/components/cassa/cart/PaymentSection';
import { MobileCartDrawer } from './MobileCartDrawer';
import { MobileEditItemDrawer } from './MobileEditItemDrawer';
import { MobileFoodPickerDrawer } from './MobileFoodPickerDrawer';
import { MobileVerificaDrawer } from './MobileVerificaDrawer';
import { MobileOrderDetailDrawer } from './MobileOrderDetailDrawer';
import { MobileChangeCalculatorDrawer } from './MobileChangeCalculatorDrawer';
import { CassaLayoutProps } from '@/components/cassa/desktop/DesktopCassaLayout';
import { calculateIngredientSurcharge } from '@/lib/cassa/calculations';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function MobileCassaLayout({
    theme, onThemeToggle, cashRegisterName, cashRegisterId, cashRegisterInvalid, foodSearchQuery, onFoodSearchChange,
    user, onLogout, onSettingsClick, onGeneralClosure,
    categories, foods, onAddToCart,
    cart, allIngredients, customer, table, displayCode, enableTableInput, requireCustomer, tableInputDisabled,
    paymentMethod, paidAmount, appliedDiscount, total, surcharges, change,
    validationErrors, validationMessage,
    onUpdateCustomer, onUpdateTable, onUpdateDisplayCode, onLoadOrder, loadingOrder,
    onUpdateQuantity, onRemoveItem, onEditItem, onClearCart, onConfirmOrder, loadingConfirmOrder,
    onOpenDiscount, onUpdatePaymentMethod, onUpdatePaidAmount,
    editingItem, onSaveEditedItem, onClearEditingItem,
    dailyOrders, searchQuery, loadingDailyOrders, showAllOrders,
    onSearchChange, onViewDetail, onLoadToCart, onCancelOrder, onToggleAllOrders,
    viewingOrderDetail, loadingOrderDetail, onCloseOrderDetail,
}: CassaLayoutProps) {
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [foodPickerOpen, setFoodPickerOpen] = useState(false);
    const [openClearDialog, setOpenClearDialog] = useState(false);
    const [verificaOpen, setVerificaOpen] = useState(false);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const wasConfirmingRef = useRef(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (editingItem !== null) setCartDrawerOpen(false);
    }, [editingItem]);

    useEffect(() => {
        if (loadingConfirmOrder) {
            wasConfirmingRef.current = true;
        } else if (wasConfirmingRef.current) {
            wasConfirmingRef.current = false;
            if (cart.length === 0) {
                setOrderSuccess(true);
                const t = setTimeout(() => setOrderSuccess(false), 3000);
                return () => clearTimeout(t);
            }
        }
    }, [loadingConfirmOrder, cart.length]);

    const handleClearCart = () => {
        onClearCart();
        setOpenClearDialog(false);
        toast.success(t('cartSidebar.toastCleared'));
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <MobileCassaHeader
                onLogout={onLogout}
                onSettingsClick={onSettingsClick}
                theme={theme}
                onThemeToggle={onThemeToggle}
                cashRegisterName={cashRegisterName}
                cashRegisterId={cashRegisterId}
                cashRegisterInvalid={cashRegisterInvalid}
                user={user}
                onGeneralClosure={onGeneralClosure}
                onVerificaClick={() => setVerificaOpen(true)}
            />

            <div className="flex flex-col flex-1 overflow-hidden pt-16">
                <OrderForm
                    displayCode={displayCode}
                    customer={customer}
                    table={table}
                    enableTableInput={enableTableInput}
                    requireCustomer={requireCustomer}
                    tableInputDisabled={tableInputDisabled}
                    validationErrors={validationErrors}
                    onUpdateDisplayCode={onUpdateDisplayCode}
                    onUpdateCustomer={onUpdateCustomer}
                    onUpdateTable={onUpdateTable}
                    onLoadOrder={onLoadOrder}
                    loadingOrder={loadingOrder}
                />

                {/* Compact cart list */}
                {cart.length > 0 && (
                    <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
                        {(() => {
                            const grouped = cart.reduce<Record<number, { name: string; items: typeof cart }>>(
                                (acc, item) => {
                                    const catId = item.food.categoryId;
                                    const catName = item.food.category?.name ?? categories.find((c) => c.id === catId)?.name ?? '—';
                                    if (!acc[catId]) acc[catId] = { name: catName, items: [] };
                                    acc[catId].items.push(item);
                                    return acc;
                                }, {}
                            );
                            return (
                                <div className="space-y-3">
                                    {Object.values(grouped).map((group) => (
                                        <div key={group.name}>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-1">
                                                {group.name}
                                            </p>
                                            <div className="divide-y border rounded-lg">
                                                {group.items.map((item) => {
                                                    const price = typeof item.food.price === 'number'
                                                        ? item.food.price
                                                        : parseFloat(item.food.price as unknown as string);
                                                    const surcharge = calculateIngredientSurcharge(item, allIngredients);
                                                    const lineTotal = (price * item.quantity) + surcharge;

                                                    const mods: string[] = [];
                                                    item.food.ingredients?.forEach((ing) => {
                                                        const qty = item.ingredientQuantities?.[ing.id] ?? 1;
                                                        if (qty === 0) mods.push(`NO ${ing.name}`);
                                                        else if (qty > 1) mods.push(`${qty}× ${ing.name}`);
                                                    });
                                                    if (item.extraIngredients) {
                                                        Object.entries(item.extraIngredients).forEach(([id, qty]) => {
                                                            const name = allIngredients.find((i) => i.id === id)?.name ?? id;
                                                            mods.push(qty === 1 ? `+${name}` : `+${qty} ${name}`);
                                                        });
                                                    }
                                                    if (item.notes) mods.push(item.notes);

                                                    const unavailable = !item.food.available;
                                                    return (
                                                        <div
                                                            key={item.cartItemId}
                                                            className={`flex items-start justify-between px-3 py-2 gap-2${unavailable ? ' opacity-60' : ''}`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {item.quantity > 1 && (
                                                                        <span className="text-amber-500 font-bold mr-1">{item.quantity}×</span>
                                                                    )}
                                                                    {item.food.name}
                                                                    {unavailable && (
                                                                        <AlertTriangle className="inline ml-1.5 h-3.5 w-3.5 text-red-500 shrink-0" />
                                                                    )}
                                                                </p>
                                                                {mods.length > 0 && (
                                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                                        {mods.join(', ')}
                                                                    </p>
                                                                )}
                                                                {unavailable && (
                                                                    <p className="text-xs text-red-500 mt-0.5">{t('cartItem.unavailable')}</p>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-bold shrink-0 text-amber-500">
                                                                {lineTotal.toFixed(2)} €
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
                {cart.length === 0 && <div className="flex-1" />}

                {/* Cart + Add buttons */}
                <div className="px-4 py-2 flex gap-2 mb-1.5">
                    <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        size="lg"
                        onClick={() => setCartDrawerOpen(true)}
                    >
                        <Pencil className="h-5 w-5 mr-2" />
                        {t('mobile.layout.editCart')}
                        {cart.length > 0 && (
                            <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-500">
                                {cart.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        size="lg"
                        onClick={() => setFoodPickerOpen(true)}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        {t('mobile.layout.addProduct')}
                    </Button>
                </div>

                <div className="border-t" />

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
                    onOpenCalculator={() => setCalculatorOpen(true)}
                />

                <div className="flex items-center gap-2 p-4 pt-0">
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setOpenClearDialog(true)}
                        aria-label={t('cartSidebar.clearCartHover')}
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
                                        className={`w-full text-lg font-semibold select-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-colors ${orderSuccess ? 'bg-green-500 hover:bg-green-500' : ''}`}
                                        size="lg"
                                        onClick={onConfirmOrder}
                                        disabled={
                                            orderSuccess ||
                                            cart.length === 0 ||
                                            (requireCustomer && (!customer || customer.length < 2)) ||
                                            (enableTableInput && !table) ||
                                            loadingConfirmOrder
                                        }
                                    >
                                        {orderSuccess ? (
                                            <>
                                                <CheckCircle className="h-5 w-5 mr-2" />
                                                {t('mobile.orderConfirmed')}
                                            </>
                                        ) : loadingConfirmOrder ? (
                                            <>
                                                <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            </div>

            <MobileFoodPickerDrawer
                open={foodPickerOpen}
                onOpenChange={setFoodPickerOpen}
                foods={foods}
                categories={categories}
                onAddToCart={onAddToCart}
            />

            <MobileCartDrawer
                open={cartDrawerOpen}
                onOpenChange={setCartDrawerOpen}
                cart={cart}
                allIngredients={allIngredients}
                categories={categories}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onEditItem={onEditItem}
            />

            <MobileEditItemDrawer
                item={editingItem}
                open={editingItem !== null}
                onClose={() => {
                    onClearEditingItem();
                    setCartDrawerOpen(true);
                }}
                onSave={(q, n, iq, ei) => {
                    onSaveEditedItem(q, n, iq, ei);
                    setCartDrawerOpen(true);
                }}
                allIngredients={allIngredients}
            />

            <MobileVerificaDrawer
                open={verificaOpen}
                onOpenChange={setVerificaOpen}
                orders={dailyOrders}
                searchQuery={searchQuery}
                loading={loadingDailyOrders}
                showAllOrders={showAllOrders}
                onSearchChange={onSearchChange}
                onViewDetail={(orderId) => {
                    onViewDetail(orderId);
                }}
                onLoadToCart={onLoadToCart}
                onCancelOrder={onCancelOrder}
                onToggleAllOrders={onToggleAllOrders}
            />

            <MobileOrderDetailDrawer
                order={viewingOrderDetail}
                open={viewingOrderDetail !== null}
                loading={loadingOrderDetail}
                onClose={onCloseOrderDetail}
            />

            <MobileChangeCalculatorDrawer
                open={calculatorOpen}
                onOpenChange={setCalculatorOpen}
                total={total}
                onApply={onUpdatePaidAmount}
            />
        </div>
    );
}
