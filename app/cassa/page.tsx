'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { toast } from 'sonner';
import { getCategories, getOrderByOrderId, confirmOrder as confirmOrderAction, createOrder, getTodayOrders, getFoodById, searchDailyOrders, getOrderByCode } from '@/actions/cassa';
import { logout as logoutAction } from '@/actions/auth';
import { Category, Food, PaymentMethod, OrderDetailResponse, ExtendedCartItem } from '@/lib/api-types';
import { DailyOrder } from '@/lib/cassa/types';
import { calculateTotal, calculateTotalSurcharges, calculateChange, calculateIngredientSurcharge } from '@/lib/cassa/calculations';
import { getOrderValidationMessage, orderSchema, paidAmountSchema } from '@/lib/cassa/validations';
import { mergeCartItems } from '@/lib/cassa/cart-utils';
import { CassaHeader } from '@/components/cassa/header/CassaHeader';
import { CategorySidebar } from '@/components/cassa/sidebar/CategorySidebar';
import { FoodGrid } from '@/components/cassa/food/FoodGrid';
import { CartSidebar } from '@/components/cassa/cart/CartSidebar';
import { DailyOrdersSidebar } from '@/components/cassa/daily-orders/DailyOrdersSidebar';
import { EditItemDialog } from '@/components/cassa/dialogs/EditItemDialog';
import { DiscountDialog } from '@/components/cassa/dialogs/DiscountDialog';
import { OrderDetailDialog } from '@/components/cassa/dialogs/OrderDetailDialog';
import { z } from 'zod';

export default function CassaPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const cartScrollRef = useRef<HTMLDivElement>(null);
    const sseConnectionRef = useRef(false);
    const lastEventRef = useRef<string | null>(null);
    const isAuthenticated = status === 'authenticated';
    const isLoading = status === 'loading';
    const [categories, setCategories] = useState<Category[]>([]);
    const [foods, setFoods] = useState<Food[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [cart, setCart] = useState<ExtendedCartItem[]>([]);
    const [displayCode, setDisplayCode] = useState('');
    const [customer, setCustomer] = useState('');
    const [table, setTable] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [showDailyOrders, setShowDailyOrders] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingFoods, setLoadingFoods] = useState(true);
    const [editingItem, setEditingItem] = useState<ExtendedCartItem | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ customer?: string; table?: string; paidAmount?: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
    const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number>(0);
    const [enableTableInput, setEnableTableInput] = useState(true);
    const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
    const [loadingDailyOrders, setLoadingDailyOrders] = useState(false);
    const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderDetailResponse | null>(null);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

    // Load enableTableInput from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('enableTableInput');
        if (saved !== null) {
            setEnableTableInput(JSON.parse(saved));
        }
    }, []);

    // Save user ID to localStorage when session is available
    useEffect(() => {
        if (session?.user?.id) {
            localStorage.setItem('userId', session.user.id);
        }
    }, [session]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Load categories and foods
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();

                // Sort categories by position before setting them
                const sortedCategories = data.sort((a: Category, b: Category) => a.position - b.position);
                setCategories(sortedCategories);

                // Extract all foods from categories for the foods state
                const allFoods: Food[] = [];
                sortedCategories.forEach((cat: Category) => {
                    if (cat.foods) {
                        const foodsWithCategory = cat.foods.map(f => ({
                            ...f,
                            category: cat
                        }));
                        allFoods.push(...foodsWithCategory);
                    }
                });
                setFoods(allFoods);
            } catch (error) {
                console.error('Error loading categories:', error);
                toast.error('Impossibile caricare le categorie');
            } finally {
                setLoadingCategories(false);
                setLoadingFoods(false);
            }
        };

        if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthenticated]);

    // Auto-scroll cart to bottom when items are added
    useEffect(() => {
        if (cartScrollRef.current && cart.length > 0) {
            const scrollElement = cartScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [cart]);

    // SSE connection - Always connected when authenticated
    useEffect(() => {
        if (!session?.accessToken) {
            return;
        }

        // Prevent multiple connections
        if (sseConnectionRef.current) {
            return;
        }
        sseConnectionRef.current = true;

        const abortController = new AbortController();

        const connectSSE = async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                await fetchEventSource(`${apiUrl}/events/cashier`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Accept': 'text/event-stream',
                    },
                    signal: abortController.signal,

                    async onopen(response) {
                        if (response.ok) {
                            console.log('[SSE] Connessione stabilita');
                        } else {
                            console.error(`[SSE] Errore di connessione: Status ${response.status}`);
                            abortController.abort();
                        }
                    },

                    async onmessage(event) {
                        if (!event.data) {
                            return;
                        }

                        // Prevent duplicate events
                        const eventKey = `${event.event}-${event.data}`;
                        if (lastEventRef.current === eventKey) {
                            return;
                        }
                        lastEventRef.current = eventKey;

                        // Handle new-order event
                        if (event.event === 'new-order') {
                            try {
                                const order: DailyOrder = JSON.parse(event.data);
                                let isNew = false;

                                setDailyOrders((prevOrders) => {
                                    const existingIndex = prevOrders.findIndex(o => o.id === order.id);

                                    if (existingIndex !== -1) {
                                        const newOrders = [...prevOrders];
                                        newOrders[existingIndex] = order;
                                        return newOrders;
                                    } else {
                                        isNew = true;
                                        return [order, ...prevOrders];
                                    }
                                });

                                if (isNew) {
                                    toast.success(`Nuovo ordine: ${order.displayCode}`);
                                }
                            } catch (error) {
                                console.error('[SSE] Errore parsando new-order:', error);
                            }
                        }
                        // Handle confirmed-order event
                        else if (event.event === 'confirmed-order') {
                            try {
                                const { orderId, displayCode } = JSON.parse(event.data);
                                setDailyOrders((prevOrders) => {
                                    return prevOrders.filter(o => o.id !== orderId);
                                });

                                toast.info(`Ordine confermato ${displayCode}`);
                            } catch (error) {
                                console.error('[SSE] Errore parsando confirmed-order:', error);
                            }
                        }
                        // Handle food-availability-changed event
                        else if (event.event === 'food-availability-changed') {
                            try {
                                const { id: foodId, available } = JSON.parse(event.data);
                                let shouldShowToast = false;

                                if (!available) {
                                    // Food is no longer available - remove it from the foods list
                                    setFoods((prevFoods) => {
                                        const filteredFoods = prevFoods.filter(f => f.id !== foodId);
                                        if (filteredFoods.length < prevFoods.length) {
                                            shouldShowToast = true;
                                        }
                                        return filteredFoods;
                                    });

                                    if (shouldShowToast) {
                                        toast.info('Cibo non disponibile');
                                    }
                                } else {
                                    // Food is now available - fetch it and add to the foods list
                                    const fetchUpdatedFood = async () => {
                                        try {
                                            const updatedFood = await getFoodById(foodId);
                                            let isNew = false;

                                            setFoods((prevFoods) => {
                                                const existingIndex = prevFoods.findIndex(f => f.id === foodId);

                                                if (existingIndex !== -1) {
                                                    // Update existing food
                                                    const newFoods = [...prevFoods];
                                                    newFoods[existingIndex] = updatedFood;
                                                    return newFoods;
                                                } else {
                                                    // Add new food
                                                    isNew = true;
                                                    return [...prevFoods, updatedFood];
                                                }
                                            });

                                            if (isNew) {
                                                toast.success(`Nuovo cibo disponibile: ${updatedFood.name}`);
                                            }
                                        } catch (error) {
                                            console.error('[SSE] Errore fetchando cibo:', error);
                                        }
                                    };

                                    fetchUpdatedFood();
                                }
                            } catch (error) {
                                console.error('[SSE] Errore parsando food-availability-changed:', error);
                            }
                        }
                        // Handle default/legacy message event
                        else {
                            try {
                                const order: DailyOrder = JSON.parse(event.data);
                                let isNew = false;

                                setDailyOrders((prevOrders) => {
                                    const existingIndex = prevOrders.findIndex(o => o.id === order.id);

                                    if (existingIndex !== -1) {
                                        const newOrders = [...prevOrders];
                                        newOrders[existingIndex] = order;
                                        return newOrders;
                                    } else {
                                        isNew = true;
                                        return [order, ...prevOrders];
                                    }
                                });

                                if (isNew) {
                                    toast.success(`Nuovo ordine: ${order.displayCode}`);
                                }
                            } catch (error) {
                                console.error('[SSE] Errore parsando messaggio:', error);
                            }
                        }
                    },

                    onclose() {
                        console.log('[SSE] Connessione chiusa');
                        sseConnectionRef.current = false;
                    },

                    onerror(err) {
                        console.error('[SSE] Errore di rete:', err);
                        if ((err as any).status === 401) {
                            console.error("[SSE] Errore 401 - Token scaduto");
                            throw err;
                        }
                        sseConnectionRef.current = false;
                    }
                });
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message === 'BodyStreamBuffer was aborted') {
                    console.log('[SSE] Connessione interrotta volontariamente');
                    return;
                }
                console.error('[SSE] Errore connessione:', err);
            }
        };

        connectSSE();

        return () => {
            console.log('[SSE] Cleanup');
            abortController.abort();
            sseConnectionRef.current = false;
        };
    }, [session?.accessToken]);

    // Load daily orders when the section is opened
    useEffect(() => {
        if (!session?.accessToken || !showDailyOrders) {
            return;
        }

        // Load initial orders
        const loadInitialOrders = async () => {
            setLoadingDailyOrders(true);
            try {
                const orders = await getTodayOrders();
                setDailyOrders(orders);
            } catch (error: any) {
                console.error('[SSE] Errore caricamento ordini iniziali:', error);
                toast.error(error.message || 'Impossibile caricare gli ordini di oggi');
            } finally {
                setLoadingDailyOrders(false);
            }
        };

        loadInitialOrders();
    }, [session?.accessToken, showDailyOrders]);

    // Search daily orders based on query
    useEffect(() => {
        if (!session?.accessToken || !showDailyOrders) {
            return;
        }

        // If search query is empty, reload all today's orders
        if (!searchQuery.trim()) {
            const loadInitialOrders = async () => {
                try {
                    const orders = await getTodayOrders();
                    setDailyOrders(orders);
                } catch (error: any) {
                    console.error('Errore caricamento ordini:', error);
                }
            };

            loadInitialOrders();
            return;
        }

        // Search with query
        const searchOrders = async () => {
            try {
                const results = await searchDailyOrders(searchQuery);
                setDailyOrders(results);
            } catch (error: any) {
                console.error('Errore nella ricerca:', error);
                toast.error(error.message || 'Errore nella ricerca degli ordini');
            }
        };

        const debounceTimer = setTimeout(() => {
            searchOrders();
        }, 300); // Debounce 300ms

        return () => clearTimeout(debounceTimer);
    }, [session?.accessToken, showDailyOrders, searchQuery]);

    // Cart operations
    const addToCart = (food: Food) => {
        if (!food.available) {
            toast.error(`${food.name} non è disponibile`);
            return;
        }

        setCart((prev) => {
            const existingItem = prev.find((item) =>
                item.food.id === food.id &&
                !item.notes &&
                (!item.ingredientQuantities || Object.keys(item.ingredientQuantities).length === 0)
            );
            if (existingItem) {
                return prev.map((item) =>
                    item.cartItemId === existingItem.cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                cartItemId: `${food.id}-${Date.now()}-${Math.random()}`,
                food,
                quantity: 1
            }];
        });
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (cartItemId: string) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const clearCart = () => {
        setCart([]);
        setDisplayCode('');
        setCustomer('');
        setTable('');
        setPaidAmount('');
        setAppliedDiscountAmount(0);
    };

    // Edit item
    const handleSaveEditedItem = (quantity: number, notes: string, ingredientQuantities: Record<string, number>) => {
        if (!editingItem) return;

        setCart((prev) => {
            const newCart: ExtendedCartItem[] = [];

            prev.forEach((item) => {
                if (item.cartItemId === editingItem.cartItemId) {
                    // If edit quantity is less than total, split into separate cards
                    const remainingQty = item.quantity - quantity;

                    if (remainingQty > 0) {
                        // Keep the unmodified portion with the original cartItemId
                        newCart.push({
                            ...item,
                            quantity: remainingQty
                        });
                    }

                    // Add the modified portion as a NEW separate card with new ID
                    if (quantity > 0) {
                        newCart.push({
                            cartItemId: `${item.food.id}-${Date.now()}-${Math.random()}`,
                            food: item.food,
                            quantity,
                            notes,
                            ingredientQuantities
                        });
                    }
                } else {
                    newCart.push(item);
                }
            });

            return newCart;
        });

        setEditingItem(null);
    };

    // Load order by display code
    const loadOrderByCode = async () => {
        if (!displayCode.trim()) {
            toast.error('Inserisci un codice ordine');
            return;
        }

        setLoadingOrder(true);
        try {
            const order = await getOrderByCode(displayCode.toUpperCase());

            // Set customer and table
            setCustomer(order.customer);
            setTable(order.table);

            // Build cart from order items
            const cartItems: ExtendedCartItem[] = [];
            order.categorizedItems.forEach((catItem: any) => {
                catItem.items.forEach((item: any) => {
                    const food: Food = {
                        id: item.food.id,
                        name: item.food.name,
                        description: item.food.description,
                        price: parseFloat(item.food.price),
                        categoryId: catItem.category.id,
                        available: item.food.available,
                        category: {
                            id: catItem.category.id,
                            name: catItem.category.name,
                            available: true,
                            position: 0,
                        },
                        ingredients: item.food.ingredients,
                    };
                    cartItems.push({
                        cartItemId: `${food.id}-${Date.now()}-${Math.random()}`,
                        food,
                        quantity: item.quantity,
                        notes: item.notes || undefined
                    });
                });
            });

            setCart(cartItems);

            toast.success(`Ordine ${displayCode.toUpperCase()} caricato con successo`);
        } catch (error: any) {
            console.error('Error loading order:', error);
            toast.error(error.message || 'Impossibile caricare l\'ordine');
        } finally {
            setLoadingOrder(false);
        }
    };

    // Load order to cart from daily orders
    const loadOrderToCart = async (order: DailyOrder) => {
        try {
            const orderDetail = await getOrderByOrderId(order.id);

            // Set customer and table
            setCustomer(orderDetail.customer);
            setTable(orderDetail.table);
            setDisplayCode(order.displayCode);

            // Build cart from order items
            const cartItems: ExtendedCartItem[] = [];
            orderDetail.categorizedItems.forEach((catItem: any) => {
                catItem.items.forEach((item: any) => {
                    const food: Food = {
                        id: item.food.id,
                        name: item.food.name,
                        description: item.food.description,
                        price: parseFloat(item.food.price),
                        categoryId: catItem.category.id,
                        available: item.food.available,
                        category: {
                            id: catItem.category.id,
                            name: catItem.category.name,
                            available: true,
                            position: 0,
                        },
                        ingredients: item.food.ingredients,
                    };
                    cartItems.push({
                        cartItemId: `${food.id}-${Date.now()}-${Math.random()}`,
                        food,
                        quantity: item.quantity,
                        notes: item.notes || undefined
                    });
                });
            });

            setCart(cartItems);

            toast.success(`Ordine ${order.displayCode} caricato nel carrello`);
        } catch (error: any) {
            console.error('Error loading order to cart:', error);
            toast.error(error.message || 'Impossibile caricare l\'ordine nel carrello');
        }
    };

    // View order detail
    const viewOrderDetail = async (orderId: number) => {
        setLoadingOrderDetail(true);
        try {
            const order = await getOrderByOrderId(orderId);
            setViewingOrderDetail(order);
        } catch (error: any) {
            console.error('Error loading order detail:', error);
            toast.error(error.message || 'Impossibile caricare i dettagli dell\'ordine');
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    // Confirm order
    const confirmOrder = async () => {
        // Validate customer
        const customerValidation = orderSchema.shape.customer.safeParse(customer);

        if (!customerValidation.success) {
            const error = customerValidation.error.issues[0].message;
            setValidationErrors({ customer: error });
            toast.error(error);
            return;
        }

        // Validate table only if enabled
        if (enableTableInput) {
            const tableValidation = z.string().min(1, 'Il numero del tavolo è obbligatorio').safeParse(table);

            if (!tableValidation.success) {
                const error = tableValidation.error.issues[0].message;
                setValidationErrors({ table: error });
                toast.error(error);
                return;
            }
        }

        // Validate paidAmount if payment method is CASH and paidAmount is provided
        if (paymentMethod === 'CASH' && paidAmount.trim()) {
            const paidResult = paidAmountSchema.safeParse(paidAmount);
            if (!paidResult.success) {
                setValidationErrors(prev => ({ ...prev, paidAmount: paidResult.error.issues[0].message }));
                toast.error(paidResult.error.issues[0].message);
                return;
            }
        }

        // Clear validation errors if all is good
        setValidationErrors({});

        if (cart.length === 0) {
            toast.error('Il carrello è vuoto');
            return;
        }

        try {
            // Merge cart items with same foodId and notes
            const mergedOrderItems = mergeCartItems(cart);

            // Calculate total surcharge from all items
            const totalSurcharge = cart.reduce((sum, item) => sum + calculateIngredientSurcharge(item), 0);

            // If displayCode exists, load the order to confirm it
            if (displayCode.trim()) {
                const orderResponse = await getOrderByCode(displayCode.toUpperCase());
                const orderId = parseInt(orderResponse.id);

                await confirmOrderAction({
                    orderId,
                    paymentMethod,
                    userId: localStorage.getItem('userId') || '',
                    cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                    discount: appliedDiscountAmount,
                    surcharge: totalSurcharge,
                    orderItems: mergedOrderItems,
                });
            } else {
                // Create new order with confirmation details
                await createOrder({
                    table: enableTableInput && table.trim() ? table : "no table",
                    customer,
                    orderItems: mergedOrderItems,
                    confirm: {
                        paymentMethod,
                        userId: localStorage.getItem('userId') || '',
                        cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                        discount: appliedDiscountAmount,
                        surcharge: totalSurcharge
                    }
                });
            }

            clearCart();
        } catch (error: any) {
            console.error('Error confirming order:', error);
            toast.error(error.message || 'Impossibile confermare l\'ordine');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await logoutAction();
        router.push('/login');
        router.refresh();
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Caricamento...</div>
            </div>
        );
    }

    const total = calculateTotal(cart, appliedDiscountAmount);
    const surcharges = calculateTotalSurcharges(cart);
    const change = calculateChange(total, parseFloat(paidAmount) || 0);
    const validationMessage = getOrderValidationMessage(cart.length, customer, table, enableTableInput);

    return (
        <div className="flex h-screen bg-background">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <CassaHeader
                    onLogout={handleLogout}
                    onSettingsClick={() => router.push('/settings')}
                    theme={theme}
                    onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                />

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Categories */}
                    <CategorySidebar
                        categories={categories}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                        loading={loadingCategories}
                    />

                    {/* Center - Food Grid */}
                    <main className="flex-1 overflow-hidden">
                        <FoodGrid
                            foods={foods}
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            onAddToCart={addToCart}
                            loading={loadingFoods}
                        />
                    </main>

                    {/* Right Sidebar - Cart */}
                    <CartSidebar
                        cart={cart}
                        customer={customer}
                        table={table}
                        displayCode={displayCode}
                        enableTableInput={enableTableInput}
                        paymentMethod={paymentMethod}
                        paidAmount={paidAmount}
                        appliedDiscount={appliedDiscountAmount}
                        total={total}
                        surcharges={surcharges}
                        change={change}
                        validationErrors={validationErrors}
                        validationMessage={validationMessage}
                        onUpdateCustomer={(value) => {
                            setCustomer(value);
                            setValidationErrors(prev => ({ ...prev, customer: undefined }));
                        }}
                        onUpdateTable={(value) => {
                            setTable(value);
                            setValidationErrors(prev => ({ ...prev, table: undefined }));
                        }}
                        onUpdateDisplayCode={setDisplayCode}
                        onLoadOrder={loadOrderByCode}
                        loadingOrder={loadingOrder}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onEditItem={setEditingItem}
                        onClearCart={clearCart}
                        onConfirmOrder={confirmOrder}
                        onOpenDiscount={() => setOpenDiscountDialog(true)}
                        onUpdatePaymentMethod={setPaymentMethod}
                        onUpdatePaidAmount={(value) => {
                            setPaidAmount(value);
                            setValidationErrors(prev => ({ ...prev, paidAmount: undefined }));
                        }}
                        showDailyOrders={showDailyOrders}
                        onToggleDailyOrders={() => setShowDailyOrders(!showDailyOrders)}
                        cartScrollRef={cartScrollRef}
                    />

                    {/* Daily Orders Sidebar - Sliding Panel */}
                    {showDailyOrders && (
                        <DailyOrdersSidebar
                            orders={dailyOrders}
                            searchQuery={searchQuery}
                            loading={loadingDailyOrders}
                            onSearchChange={setSearchQuery}
                            onViewDetail={viewOrderDetail}
                            onLoadToCart={loadOrderToCart}
                        />
                    )}
                </div>
            </div>

            {/* Edit Item Dialog */}
            <EditItemDialog
                item={editingItem}
                open={editingItem !== null}
                onClose={() => setEditingItem(null)}
                onSave={handleSaveEditedItem}
            />

            {/* Discount Dialog */}
            <DiscountDialog
                open={openDiscountDialog}
                currentDiscount={appliedDiscountAmount}
                onClose={() => setOpenDiscountDialog(false)}
                onApply={setAppliedDiscountAmount}
                onRemove={() => setAppliedDiscountAmount(0)}
            />

            {/* Order Detail Dialog */}
            <OrderDetailDialog
                order={viewingOrderDetail}
                open={viewingOrderDetail !== null}
                loading={loadingOrderDetail}
                onClose={() => setViewingOrderDetail(null)}
            />
        </div>
    );
}
