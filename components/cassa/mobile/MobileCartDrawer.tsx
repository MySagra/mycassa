'use client';

import { ExtendedCartItem, Ingredient, Category } from '@/lib/api-types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from '@/components/cassa/cart/CartItem';
import { ShoppingBasket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileCartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: ExtendedCartItem[];
    allIngredients: Ingredient[];
    categories: Category[];
    onUpdateQuantity: (cartItemId: string, delta: number) => void;
    onRemoveItem: (cartItemId: string) => void;
    onEditItem: (item: ExtendedCartItem) => void;
}

export function MobileCartDrawer({
    open,
    onOpenChange,
    cart,
    allIngredients,
    categories,
    onUpdateQuantity,
    onRemoveItem,
    onEditItem,
}: MobileCartDrawerProps) {
    const { t } = useTranslation();

    const grouped = cart.reduce<Record<number, { name: string; items: ExtendedCartItem[] }>>(
        (acc, item) => {
            const catId = item.food.categoryId;
            const catName =
                item.food.category?.name ??
                categories.find((c) => c.id === catId)?.name ??
                '—';
            if (!acc[catId]) acc[catId] = { name: catName, items: [] };
            acc[catId].items.push(item);
            return acc;
        },
        {}
    );

    const groups = Object.values(grouped);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh] flex flex-col">
                <DrawerHeader>
                    <DrawerTitle>{t('cartSidebar.title')}</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 overflow-y-auto px-4 pb-6">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center py-10">
                            <ShoppingBasket className="h-20 w-20 text-muted-foreground" />
                            <p className="text-sm font-bold text-muted-foreground mt-2">
                                {t('cartSidebar.emptyCart')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groups.map((group) => (
                                <div key={group.name}>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                                        {group.name}
                                    </p>
                                    <div className="space-y-2">
                                        {group.items.map((item) => (
                                            <CartItem
                                                key={item.cartItemId}
                                                item={item}
                                                allIngredients={allIngredients}
                                                onUpdateQuantity={(delta) => onUpdateQuantity(item.cartItemId, delta)}
                                                onRemove={() => onRemoveItem(item.cartItemId)}
                                                onEdit={() => onEditItem(item)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
}
