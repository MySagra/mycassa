'use client';

import { useState, useEffect } from 'react';
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
import { ShoppingCart, Trash2, Percent } from 'lucide-react';
import { MobileCassaHeader } from './MobileCassaHeader';
import { OrderForm } from '@/components/cassa/cart/OrderForm';
import { PaymentSection } from '@/components/cassa/cart/PaymentSection';
import { MobileCartDrawer } from './MobileCartDrawer';
import { MobileEditItemDrawer } from './MobileEditItemDrawer';
import { CassaLayoutProps } from '@/components/cassa/desktop/DesktopCassaLayout';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function MobileCassaLayout({
    theme, onThemeToggle, cashRegisterName, foodSearchQuery, onFoodSearchChange,
    user, onLogout, onSettingsClick, onGeneralClosure,
    categories,
    cart, allIngredients, customer, table, displayCode, enableTableInput, tableInputDisabled,
    paymentMethod, paidAmount, appliedDiscount, total, surcharges, change,
    validationErrors, validationMessage,
    onUpdateCustomer, onUpdateTable, onUpdateDisplayCode, onLoadOrder, loadingOrder,
    onUpdateQuantity, onRemoveItem, onEditItem, onClearCart, onConfirmOrder, loadingConfirmOrder,
    onOpenDiscount, onUpdatePaymentMethod, onUpdatePaidAmount,
    editingItem, onSaveEditedItem, onClearEditingItem,
}: CassaLayoutProps) {
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [openClearDialog, setOpenClearDialog] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (editingItem !== null) setCartDrawerOpen(false);
    }, [editingItem]);

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
                user={user}
                onGeneralClosure={onGeneralClosure}
            />

            <div className="flex flex-col flex-1 overflow-hidden pt-16">
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

                <div className="px-4 py-2">
                    <Button
                        variant="outline"
                        className="w-full cursor-pointer"
                        size="lg"
                        onClick={() => setCartDrawerOpen(true)}
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {t('cartSidebar.title')}
                        {cart.length > 0 && (
                            <Badge className="ml-2 bg-amber-500 text-white hover:bg-amber-500">
                                {cart.length}
                            </Badge>
                        )}
                    </Button>
                </div>

                <div className="flex-1" />

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
                                        className="w-full text-lg font-semibold select-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                        size="lg"
                                        onClick={onConfirmOrder}
                                        disabled={
                                            cart.length === 0 ||
                                            !customer ||
                                            customer.length < 2 ||
                                            (enableTableInput && !table) ||
                                            loadingConfirmOrder
                                        }
                                    >
                                        {loadingConfirmOrder ? (
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
        </div>
    );
}
