'use client';

import React from 'react';
import { ExtendedCartItem, Category, Food, Ingredient, PaymentMethod, OrderDetailResponse } from '@/lib/api-types';
import { DailyOrder } from '@/lib/cassa/types';
import { CassaHeader } from '@/components/cassa/header/CassaHeader';
import { CategorySidebar } from '@/components/cassa/sidebar/CategorySidebar';
import { FoodGrid } from '@/components/cassa/food/FoodGrid';
import { CartSidebar } from '@/components/cassa/cart/CartSidebar';
import { DailyOrdersSidebar } from '@/components/cassa/daily-orders/DailyOrdersSidebar';

export interface CassaLayoutProps {
    // Header
    theme: string | undefined;
    onThemeToggle: () => void;
    cashRegisterName: string;
    cashRegisterId: string;
    cashRegisterInvalid?: boolean;
    foodSearchQuery: string;
    onFoodSearchChange: (value: string) => void;
    user: { username: string; role: string } | undefined;
    onLogout: () => void;
    onSettingsClick: () => void;
    onGeneralClosure: () => void;
    // Categories
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    loadingCategories: boolean;
    // Foods
    foods: Food[];
    loadingFoods: boolean;
    onAddToCart: (food: Food) => void;
    // Cart
    cart: ExtendedCartItem[];
    allIngredients: Ingredient[];
    customer: string;
    table: string;
    displayCode: string;
    enableTableInput: boolean;
    requireCustomer: boolean;
    tableInputDisabled: boolean;
    paymentMethod: PaymentMethod | null;
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
    onUpdatePaymentMethod: (method: PaymentMethod | null) => void;
    onUpdatePaidAmount: (value: string) => void;
    showDailyOrders: boolean;
    onToggleDailyOrders: () => void;
    cartScrollRef: React.RefObject<HTMLDivElement | null>;
    // Mobile edit item
    editingItem: ExtendedCartItem | null;
    onSaveEditedItem: (quantity: number, notes: string, ingredientQuantities: Record<string, number>, extraIngredients: Record<string, number>) => void;
    onClearEditingItem: () => void;
    // Daily orders
    dailyOrders: DailyOrder[];
    searchQuery: string;
    loadingDailyOrders: boolean;
    showAllOrders: boolean;
    onSearchChange: (value: string) => void;
    onViewDetail: (orderId: string) => void;
    onLoadToCart: (order: DailyOrder) => void;
    onCancelOrder: (orderId: string) => void;
    onToggleAllOrders: () => void;
    // Order detail (mobile uses its own drawer)
    viewingOrderDetail: OrderDetailResponse | null;
    loadingOrderDetail: boolean;
    onCloseOrderDetail: () => void;
}

export function DesktopCassaLayout({
    theme, onThemeToggle, cashRegisterName, cashRegisterId, cashRegisterInvalid, foodSearchQuery, onFoodSearchChange,
    user, onLogout, onSettingsClick, onGeneralClosure,
    categories, selectedCategoryId, onSelectCategory, loadingCategories,
    foods, loadingFoods, onAddToCart,
    cart, allIngredients, customer, table, displayCode, enableTableInput, requireCustomer, tableInputDisabled,
    paymentMethod, paidAmount, appliedDiscount, total, surcharges, change,
    validationErrors, validationMessage,
    onUpdateCustomer, onUpdateTable, onUpdateDisplayCode, onLoadOrder, loadingOrder,
    onUpdateQuantity, onRemoveItem, onEditItem, onClearCart, onConfirmOrder, loadingConfirmOrder,
    onOpenDiscount, onUpdatePaymentMethod, onUpdatePaidAmount,
    showDailyOrders, onToggleDailyOrders, cartScrollRef,
    dailyOrders, searchQuery, loadingDailyOrders, showAllOrders,
    onSearchChange, onViewDetail, onLoadToCart, onCancelOrder, onToggleAllOrders,
}: CassaLayoutProps) {
    return (
        <div className="flex h-screen pt-16 bg-background">
            <div className="flex-1 flex flex-col">
                <CassaHeader
                    onLogout={onLogout}
                    onSettingsClick={onSettingsClick}
                    theme={theme}
                    onThemeToggle={onThemeToggle}
                    cashRegisterName={cashRegisterName}
                    cashRegisterId={cashRegisterId}
                    cashRegisterInvalid={cashRegisterInvalid}
                    user={user}
                    onGeneralClosure={onGeneralClosure}
                />
                <div className="flex flex-1 overflow-hidden">
                    <CategorySidebar
                        categories={categories}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={onSelectCategory}
                        loading={loadingCategories}
                    />
                    <main className="flex-1 overflow-hidden">
                        <FoodGrid
                            foods={foods}
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            onAddToCart={onAddToCart}
                            loading={loadingFoods}
                            showDailyOrders={showDailyOrders}
                            foodSearchQuery={foodSearchQuery}
                            onFoodSearchChange={onFoodSearchChange}
                        />
                    </main>
                    <CartSidebar
                        cart={cart}
                        allIngredients={allIngredients}
                        customer={customer}
                        table={table}
                        displayCode={displayCode}
                        enableTableInput={enableTableInput}
                        requireCustomer={requireCustomer}
                        tableInputDisabled={tableInputDisabled}
                        paymentMethod={paymentMethod}
                        paidAmount={paidAmount}
                        appliedDiscount={appliedDiscount}
                        total={total}
                        surcharges={surcharges}
                        change={change}
                        validationErrors={validationErrors}
                        validationMessage={validationMessage}
                        onUpdateCustomer={onUpdateCustomer}
                        onUpdateTable={onUpdateTable}
                        onUpdateDisplayCode={onUpdateDisplayCode}
                        onLoadOrder={onLoadOrder}
                        loadingOrder={loadingOrder}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveItem={onRemoveItem}
                        onEditItem={onEditItem}
                        onClearCart={onClearCart}
                        onConfirmOrder={onConfirmOrder}
                        loadingConfirmOrder={loadingConfirmOrder}
                        onOpenDiscount={onOpenDiscount}
                        onUpdatePaymentMethod={onUpdatePaymentMethod}
                        onUpdatePaidAmount={onUpdatePaidAmount}
                        showDailyOrders={showDailyOrders}
                        onToggleDailyOrders={onToggleDailyOrders}
                        cartScrollRef={cartScrollRef}
                    />
                    {showDailyOrders && (
                        <DailyOrdersSidebar
                            orders={dailyOrders}
                            searchQuery={searchQuery}
                            loading={loadingDailyOrders}
                            showAllOrders={showAllOrders}
                            onSearchChange={onSearchChange}
                            onViewDetail={onViewDetail}
                            onLoadToCart={onLoadToCart}
                            onCancelOrder={onCancelOrder}
                            onToggleAllOrders={onToggleAllOrders}
                            onClose={onToggleDailyOrders}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
