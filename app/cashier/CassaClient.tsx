'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { toast } from 'sonner';
import { getCategories, getOrderByOrderId, confirmOrder as confirmOrderAction, createOrder, getTodayOrders, getAllTodayOrders, getFoodById, searchDailyOrders, searchAllDailyOrders, getOrderByCode, getCashRegisters, getAllIngredients, getPrinterById, generalClosure, cancelOrder as cancelOrderAction } from '@/actions/cashier';
import { logout as logoutAction } from '@/actions/auth';
import { Category, Food, Ingredient, PaymentMethod, OrderDetailResponse, ExtendedCartItem } from '@/lib/api-types';
import { DailyOrder } from '@/lib/cassa/types';
import { calculateTotal, calculateTotalSurcharges, calculateChange } from '@/lib/cassa/calculations';
import { getOrderValidationMessage, orderSchema, paidAmountSchema } from '@/lib/cassa/validations';
import { mergeCartItems } from '@/lib/cassa/cart-utils';
import { EditItemDialog } from '@/components/cassa/dialogs/EditItemDialog';
import { MobileEditItemDrawer } from '@/components/cassa/mobile/MobileEditItemDrawer';
import { DiscountDialog } from '@/components/cassa/dialogs/DiscountDialog';
import { OrderDetailDialog } from '@/components/cassa/dialogs/OrderDetailDialog';
import { ConfigurationDialog } from '@/components/cassa/dialogs/ConfigurationDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DesktopCassaLayout, CassaLayoutProps } from '@/components/cassa/desktop/DesktopCassaLayout';
import { MobileCassaLayout } from '@/components/cassa/mobile/MobileCassaLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { z } from 'zod';

export default function CassaPage({ requiredTable }: { requiredTable: boolean }) {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();
    const { theme, setTheme } = useTheme();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const cartScrollRef = useRef<HTMLDivElement>(null);
    const sseConnectionRef = useRef(false);
    const lastEventRef = useRef<string | null>(null);
    const showAllOrdersRef = useRef<boolean>(false);
    const dailyOrdersRef = useRef<DailyOrder[]>([]);
    const printerCacheRef = useRef<Map<string, { name: string; ip?: string | null }>>(new Map());
    const wasAuthenticatedRef = useRef(isAuthenticated);
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
    const [foodSearchQuery, setFoodSearchQuery] = useState('');
    const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
    const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number>(0);
    const enableTableInput = requiredTable;
    const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
    const [loadingDailyOrders, setLoadingDailyOrders] = useState(false);
    const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderDetailResponse | null>(null);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
    const [cashRegisterName, setCashRegisterName] = useState<string>('');
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [loadingConfirmOrder, setLoadingConfirmOrder] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);

    // Clear localStorage and logout on auth errors
    const handleAuthError = async () => {
        localStorage.removeItem('mycassa_user');
        localStorage.removeItem('selectedCashRegister');
        await logoutAction();
        router.push('/login');
    };

    // Clear localStorage when session expires
    useEffect(() => {
        if (wasAuthenticatedRef.current && !isAuthenticated && !isLoading) {
            // Session was active but now expired
            localStorage.removeItem('mycassa_user');
            localStorage.removeItem('selectedCashRegister');
        }
        wasAuthenticatedRef.current = isAuthenticated;
    }, [isAuthenticated, isLoading]);

    // Keep ref in sync with state
    // Keep ref in sync with state
    useEffect(() => {
        showAllOrdersRef.current = showAllOrders;
        dailyOrdersRef.current = dailyOrders;
    }, [showAllOrders, dailyOrders]);



    // Load selected cash register name from localStorage
    useEffect(() => {
        const fetchCashRegisterName = async () => {
            const selectedId = localStorage.getItem('selectedCashRegister');
            if (selectedId) {
                try {
                    const result = await getCashRegisters();
                    if (result.success) {
                        const cashRegisters = result.data;
                        const selected = cashRegisters.find((cr: any) => cr.id === selectedId);
                        if (selected) {
                            setCashRegisterName(selected.name);
                        }
                    }
                } catch (error) {
                    console.error('Error loading cash register name:', error);
                }
            } else {
                // No cash register selected, show configuration dialog
                setShowConfigDialog(true);
            }
        };

        if (isAuthenticated) {
            fetchCashRegisterName();
        }
    }, [isAuthenticated]);

    // Handle cash register selection from configuration dialog
    const handleCashRegisterSelected = (cashRegisterId: string, cashRegisterName: string) => {
        setCashRegisterName(cashRegisterName);
    };

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
                const result = await getCategories();

                if (!result.success) {
                    if (!isMobile) toast.error(result.error || t('toast.categoriesLoadError'));
                    return;
                }

                const data = result.data;

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
                if (!isMobile) toast.error(t('toast.categoriesLoadError'));
            } finally {
                setLoadingCategories(false);
                setLoadingFoods(false);
            }
        };

        const fetchIngredients = async () => {
            try {
                const result = await getAllIngredients();
                if (result.success) {
                    setAllIngredients(result.data);
                }
            } catch (error) {
                console.error('Error loading ingredients:', error);
            }
        };

        if (isAuthenticated) {
            fetchCategories();
            fetchIngredients();
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
        if (!isAuthenticated) {
            console.log('[SSE] Not authenticated, skipping connection');
            return;
        }

        // Prevent multiple connections
        if (sseConnectionRef.current) {
            console.log('[SSE] Connection already exists, skipping');
            return;
        }

        console.log('[SSE] Initializing SSE connection...');
        sseConnectionRef.current = true;

        const abortController = new AbortController();

        const connectSSE = async () => {
            try {
                await fetchEventSource(`/api/events/cashier`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/event-stream',
                    },
                    signal: abortController.signal,

                    // Automatic retry configuration
                    openWhenHidden: true,

                    async onopen(response) {
                        if (response.ok) {
                            console.log('[SSE] Connessione stabilita con successo');

                            // Fetch initial daily orders when SSE connection is established or reopened
                            try {
                                const result = showAllOrdersRef.current ? await getAllTodayOrders() : await getTodayOrders();
                                if (result.success) {
                                    setDailyOrders(result.data);
                                    console.log('[SSE] Ordini caricati:', result.data.length);
                                } else {
                                    console.error('[SSE] Errore caricamento ordini iniziali:', result.error);
                                }
                            } catch (error: any) {
                                console.error('[SSE] Errore caricamento ordini iniziali:', error);
                            }
                        } else {
                            console.error(`[SSE] Errore di connessione: Status ${response.status}`);
                            throw new Error(`SSE connection failed with status ${response.status}`);
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
                                        newOrders[existingIndex] = { ...prevOrders[existingIndex], ...order };
                                        return newOrders;
                                    } else {
                                        isNew = true;
                                        return [order, ...prevOrders];
                                    }
                                });

                            } catch (error) {
                                console.error('[SSE] Errore parsando new-order:', error);
                            }
                        }
                        // Handle confirmed-order event
                        // Handle confirmed-order event
                        else if (event.event === 'confirmed-order') {
                            try {
                                const { id, displayCode } = JSON.parse(event.data);

                                // If showing all orders, update the order status instead of removing
                                if (showAllOrdersRef.current) {
                                    const orderExists = dailyOrdersRef.current.some(o => o.id === id);

                                    if (orderExists) {
                                        setDailyOrders((prevOrders) => {
                                            return prevOrders.map(o =>
                                                o.id === id ? { ...o, status: 'CONFIRMED' } : o
                                            );
                                        });
                                    } else {
                                        // If order doesn't exist, fetch and add it
                                        try {
                                            const result = await getOrderByOrderId(id);
                                            if (result.success) {
                                                const newOrder = result.data;
                                                const dailyOrder: DailyOrder = {
                                                    id: newOrder.id,
                                                    displayCode: newOrder.displayCode,
                                                    table: newOrder.table,
                                                    customer: newOrder.customer,
                                                    createdAt: newOrder.createdAt,
                                                    subTotal: newOrder.subTotal,
                                                    total: newOrder.total,
                                                    status: 'CONFIRMED'
                                                };
                                                setDailyOrders(prev => [dailyOrder, ...prev]);
                                            }
                                        } catch (error) {
                                            console.error('[SSE] Error fetching new confirmed order:', error);
                                        }
                                    }
                                } else {
                                    // Only remove from list if showing pending orders only
                                    setDailyOrders((prevOrders) => {
                                        return prevOrders.filter(o => o.id !== id);
                                    });
                                }
                            } catch (error) {
                                console.error('[SSE] Errore parsando confirmed-order:', error);
                            }
                        }
                        // Handle food-availability-changed event
                        else if (event.event === 'food-availability-changed') {
                            try {
                                const { id: foodId, available } = JSON.parse(event.data);

                                if (!available) {
                                    // Mark food as unavailable in state (keep it visible in grid)
                                    let foodName = '';
                                    setFoods((prevFoods) => prevFoods.map(f => {
                                        if (f.id === foodId) {
                                            foodName = f.name;
                                            return { ...f, available: false };
                                        }
                                        return f;
                                    }));
                                    // Update matching cart items
                                    setCart((prevCart) => prevCart.map(item =>
                                        item.food.id === foodId
                                            ? { ...item, food: { ...item.food, available: false } }
                                            : item
                                    ));
                                    if (foodName && !isMobile) toast.warning(t('toast.foodUnavailable', { foodName }));
                                } else {
                                    // Food is now available - fetch latest data and update state
                                    const fetchUpdatedFood = async () => {
                                        try {
                                            const result = await getFoodById(foodId);
                                            if (!result.success) {
                                                console.error('[SSE] Errore fetchando cibo:', result.error);
                                                return;
                                            }
                                            const updatedFood = result.data;
                                            let isNew = false;
                                            setFoods((prevFoods) => {
                                                const existingIndex = prevFoods.findIndex(f => f.id === foodId);
                                                if (existingIndex !== -1) {
                                                    const newFoods = [...prevFoods];
                                                    newFoods[existingIndex] = updatedFood;
                                                    return newFoods;
                                                }
                                                isNew = true;
                                                return [...prevFoods, updatedFood];
                                            });
                                            // Restore availability in cart items
                                            setCart((prevCart) => prevCart.map(item =>
                                                item.food.id === foodId
                                                    ? { ...item, food: { ...item.food, available: true } }
                                                    : item
                                            ));
                                            if (isNew && !isMobile) {
                                                toast.success(t('toast.foodAvailable', { foodName: updatedFood.name }));
                                            } else if (!isMobile) {
                                                toast.success(t('toast.foodAvailableAgain', { foodName: updatedFood.name }));
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
                        // Handle category-availability-changed event
                        else if (event.event === 'category-availability-changed') {
                            try {
                                const { id: categoryId, available } = JSON.parse(event.data);
                                let categoryName = '';

                                // Update all foods belonging to this category
                                setFoods((prevFoods) => prevFoods.map(f => {
                                    if (String(f.categoryId) === String(categoryId) || String(f.category?.id) === String(categoryId)) {
                                        if (!categoryName && f.category?.name) categoryName = f.category.name;
                                        return { ...f, available };
                                    }
                                    return f;
                                }));

                                // Update the category itself
                                setCategories((prevCategories) => prevCategories.map(cat => {
                                    if (String(cat.id) === String(categoryId)) {
                                        if (!categoryName) categoryName = cat.name;
                                        return { ...cat, available };
                                    }
                                    return cat;
                                }));

                                // Update cart items whose food belongs to this category
                                setCart((prevCart) => prevCart.map(item =>
                                    String(item.food.categoryId) === String(categoryId)
                                        ? { ...item, food: { ...item.food, available } }
                                        : item
                                ));

                                if (categoryName && !isMobile) {
                                    if (available) {
                                        toast.success(t('toast.categoryAvailable', { categoryName }));
                                    } else {
                                        toast.warning(t('toast.categoryUnavailable', { categoryName }));
                                    }
                                }
                            } catch (error) {
                                console.error('[SSE] Errore parsando category-availability-changed:', error);
                            }
                        }
                        // Handle printer-status-changed event
                        else if (event.event === 'printer-status-changed') {
                            try {
                                const { id: printerId, status } = JSON.parse(event.data);

                                const fetchAndNotify = async () => {
                                    let info = printerCacheRef.current.get(printerId);
                                    if (!info) {
                                        const result = await getPrinterById(printerId);
                                        if (result.success) {
                                            info = { name: result.data.name, ip: result.data.ip };
                                            printerCacheRef.current.set(printerId, info);
                                        }
                                    }
                                    const printerName = info?.name || `Stampante ${printerId}`;
                                    const ipLabel = info?.ip ? ` (${info.ip})` : '';
                                    const label = `${printerName}${ipLabel}`;

                                    if (!isMobile) {
                                        if (status === 'ONLINE') {
                                            toast.success(t('toast.printerOnline', { label }), { description: t('toast.printerOnlineDesc') });
                                        } else if (status === 'OFFLINE') {
                                            toast.warning(t('toast.printerOffline', { label }), { description: t('toast.printerOfflineDesc') });
                                        } else {
                                            toast.error(t('toast.printerError', { label }), { description: t('toast.printerErrorDesc', { status }) });
                                        }
                                    }
                                };
                                fetchAndNotify();
                            } catch (error) {
                                console.error('[SSE] Errore parsando printer-status-changed:', error);
                            }
                        }
                        // Handle order-status-update event
                        else if (event.event === 'order-status-update') {
                            try {
                                const { id, status } = JSON.parse(event.data);
                                setDailyOrders((prevOrders) => prevOrders.map(o =>
                                    o.id === id ? { ...o, status } : o
                                ));
                            } catch (error) {
                                console.error('[SSE] Errore parsando order-status-update:', error);
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
                                        newOrders[existingIndex] = { ...prevOrders[existingIndex], ...order };
                                        return newOrders;
                                    } else {
                                        isNew = true;
                                        return [order, ...prevOrders];
                                    }
                                });

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
                        const status = (err as any).status;
                        if (status === 401) {
                            console.error("[SSE] Errore 401 - Token scaduto");
                            if (!isMobile) toast.error(t('toast.authError401'));
                            handleAuthError();
                            return;
                        } else if (status === 403) {
                            console.error("[SSE] Errore 403 - Accesso vietato");
                            if (!isMobile) toast.error(t('toast.authError403'));
                            handleAuthError();
                            return;
                        }
                        sseConnectionRef.current = false;
                        // Throw error to trigger retry
                        throw err;
                    }
                });
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message === 'BodyStreamBuffer was aborted') {
                    console.log('[SSE] Connessione abortita intenzionalmente');
                    return;
                }
                console.error('[SSE] Errore connessione:', err);
                sseConnectionRef.current = false;
            }
        };

        connectSSE();

        return () => {
            console.log('[SSE] Cleanup: chiusura connessione');
            abortController.abort();
            sseConnectionRef.current = false;
        };
    }, [isAuthenticated]);

    // Load daily orders when the section is opened
    useEffect(() => {
        if (!isAuthenticated || !showDailyOrders) {
            return;
        }

        // Load initial orders
        const loadInitialOrders = async () => {
            setLoadingDailyOrders(true);
            try {
                const result = showAllOrders ? await getAllTodayOrders() : await getTodayOrders();
                if (result.success) {
                    setDailyOrders(result.data);
                } else {
                    if (!isMobile) toast.error(result.error || t('toast.orderLoadError'));
                }
            } catch (error: any) {
                console.error('[SSE] Errore caricamento ordini iniziali:', error);
                if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
            } finally {
                setLoadingDailyOrders(false);
            }
        };

        loadInitialOrders();
    }, [isAuthenticated, showDailyOrders, showAllOrders]);

    // Search daily orders based on query
    useEffect(() => {
        if (!isAuthenticated || (!showDailyOrders && !isMobile)) {
            return;
        }

        // If search query is empty, reload all today's orders
        if (!searchQuery.trim()) {
            const loadInitialOrders = async () => {
                try {
                    const result = showAllOrders ? await getAllTodayOrders() : await getTodayOrders();
                    if (result.success) {
                        setDailyOrders(result.data);
                    }
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
                const result = showAllOrders ? await searchAllDailyOrders(searchQuery) : await searchDailyOrders(searchQuery);
                if (result.success) {
                    setDailyOrders(result.data);
                } else {
                    if (!isMobile) toast.error(result.error || t('toast.orderLoadError'));
                }
            } catch (error: any) {
                console.error('Errore nella ricerca:', error);
                if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
            }
        };

        const debounceTimer = setTimeout(() => {
            searchOrders();
        }, 300); // Debounce 300ms

        return () => clearTimeout(debounceTimer);
    }, [isAuthenticated, showDailyOrders, isMobile, searchQuery, showAllOrders]);

    // Cart operations
    const addToCart = (food: Food) => {
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
    const handleSaveEditedItem = (quantity: number, notes: string, ingredientQuantities: Record<string, number>, extraIngredients: Record<string, number>) => {
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
                            ingredientQuantities,
                            extraIngredients: Object.keys(extraIngredients).length > 0 ? extraIngredients : undefined
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
            if (!isMobile) toast.error(t('toast.orderCodeRequired'));
            return;
        }

        setLoadingOrder(true);
        try {
            const result = await getOrderByCode(displayCode.toUpperCase());

            if (!result.success) {
                toast.error(result.error || t('toast.orderLoadError'));
                return;
            }

            const order = (result as any).data;

            // Check if order is pending
            if (order.status !== 'PENDING') {
                if (!isMobile) toast.error(t('toast.orderAlreadyConfirmed'));
                return;
            }

            // Set customer and table
            setCustomer(order.customer);
            setTable(order.table);

            // Build cart from order items
            const cartItems: ExtendedCartItem[] = [];
            order.categorizedItems.forEach((catItem: any) => {
                catItem.items.forEach((item: any) => {
                    const currentFood = foods.find((f: Food) => f.id === item.food.id);
                    const food: Food = {
                        id: item.food.id,
                        name: item.food.name,
                        description: item.food.description,
                        price: parseFloat(item.food.price),
                        categoryId: catItem.category.id,
                        available: currentFood !== undefined ? currentFood.available : item.food.available,
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

            if (!isMobile) toast.success(t('toast.orderLoaded', { displayCode: displayCode.toUpperCase() }));
        } catch (error: any) {
            console.error('Error loading order:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
        } finally {
            setLoadingOrder(false);
        }
    };

    // Load order to cart from daily orders
    const loadOrderToCart = async (order: DailyOrder) => {
        try {
            const result = await getOrderByOrderId(order.id);

            if (!result.success) {
                toast.error(result.error || t('toast.orderLoadError'));
                return;
            }

            const orderDetail = result.data;

            // Set customer and table
            setCustomer(orderDetail.customer);
            setTable(orderDetail.table);
            setDisplayCode(order.displayCode);

            // Build cart from order items
            const cartItems: ExtendedCartItem[] = [];
            orderDetail.categorizedItems.forEach((catItem: any) => {
                catItem.items.forEach((item: any) => {
                    const currentFood = foods.find((f: Food) => f.id === item.food.id);
                    const food: Food = {
                        id: item.food.id,
                        name: item.food.name,
                        description: item.food.description,
                        price: parseFloat(item.food.price),
                        categoryId: catItem.category.id,
                        available: currentFood !== undefined ? currentFood.available : item.food.available,
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

            if (!isMobile) toast.success(t('toast.orderLoadedToCart', { displayCode: order.displayCode }));
        } catch (error: any) {
            console.error('Error loading order to cart:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
        }
    };

    // View order detail
    const viewOrderDetail = async (orderId: string) => {
        setLoadingOrderDetail(true);
        try {
            const result = await getOrderByOrderId(orderId);
            if (result.success) {
                setViewingOrderDetail(result.data);
            } else {
                if (!isMobile) toast.error(result.error || t('toast.orderLoadError'));
            }
        } catch (error: any) {
            console.error('Error loading order detail:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            const result = await cancelOrderAction(orderId);
            if (result.success) {
                setDailyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
                toast.success(t('toast.orderCancelled'));
            } else {
                toast.error(result.error || t('toast.orderCancelError'));
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.message || t('toast.orderCancelError'));
        }
    };

    // Validate order and check for unavailable items before submitting
    const confirmOrder = async () => {
        // Validate cash register is selected
        const selectedCashRegister = localStorage.getItem('selectedCashRegister');
        if (!selectedCashRegister) {
            if (!isMobile) toast.error(t('toast.noCashRegisterSelected'));
            setShowConfigDialog(true);
            return;
        }

        // Validate customer
        const customerValidation = orderSchema.shape.customer.safeParse(customer);
        if (!customerValidation.success) {
            toast.error(customerValidation.error.issues[0].message);
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

        setValidationErrors({});

        if (cart.length === 0) {
            if (!isMobile) toast.error(t('toast.emptyCart'));
            return;
        }

        // Check for unavailable items in cart — ask for confirmation before proceeding
        const hasUnavailable = cart.some(item => item.food.available === false);
        if (hasUnavailable) {
            setShowUnavailableDialog(true);
            return;
        }

        await doConfirmOrder();
    };

    // The actual order submission — called after all validations pass
    const doConfirmOrder = async () => {
        setShowUnavailableDialog(false);
        setLoadingConfirmOrder(true);
        try {
            // Merge cart items with same foodId and notes
            const mergedOrderItems = mergeCartItems(cart, allIngredients);

            // If displayCode exists, load the order to confirm it
            if (displayCode.trim()) {
                const result = await getOrderByCode(displayCode.toUpperCase());

                if (!result.success) {
                    if (!isMobile) toast.error(result.error || t('toast.orderLoadError'));
                    return;
                }

                const orderResponse = (result as any).data;
                const orderId = orderResponse.id;
                const originalCustomerFromOrder = orderResponse.customer;

                const confirmResult = await confirmOrderAction({
                    orderId,
                    paymentMethod,
                    userId: user?.id || '',
                    cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                    discount: appliedDiscountAmount,
                    customer: customer !== originalCustomerFromOrder ? customer : undefined,
                    orderItems: mergedOrderItems,
                });

                if (!confirmResult.success) {
                    if (!isMobile) toast.error(confirmResult.error || t('toast.orderConfirmed'));
                    return;
                }

                // Update or remove the confirmed order from daily orders list
                if (showAllOrders) {
                    // Update the order status to CONFIRMED
                    setDailyOrders((prevOrders) =>
                        prevOrders.map(o =>
                            o.id === orderId ? { ...o, status: 'CONFIRMED' } : o
                        )
                    );
                } else {
                    // Remove the order from list if showing pending orders only
                    setDailyOrders((prevOrders) => prevOrders.filter(o => o.id !== orderId));
                }
            } else {
                // Create new order with confirmation details
                const createResult = await createOrder({
                    table: enableTableInput && table.trim() ? table : "NO_TABLE_PRESET",
                    customer,
                    orderItems: mergedOrderItems,
                    confirm: {
                        paymentMethod,
                        userId: user?.id || '',
                        cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                        discount: appliedDiscountAmount,
                    }
                });

                if (!createResult.success) {
                    if (!isMobile) toast.error(createResult.error || t('toast.orderCreated'));
                    return;
                }
            }

            if (!isMobile) {
                toast.success(t('toast.orderConfirmed'));
            }
            clearCart();
        } catch (error: any) {
            console.error('Error confirming order:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderConfirmed'));
        } finally {
            setLoadingConfirmOrder(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await logoutAction();
        localStorage.removeItem('mycassa_user');
        localStorage.removeItem('selectedCashRegister');
        router.push('/login');
        router.refresh();
    };

    const handleGeneralClosure = async () => {
        const cashRegisterId = localStorage.getItem('selectedCashRegister');
        if (!cashRegisterId) {
            if (!isMobile) toast.error(t('toast.cashierNotSelected'));
            return;
        }
        const result = await generalClosure(cashRegisterId);
        if (result.success) {
            if (!isMobile) toast.success(t('toast.generalClosureSuccess'));
        } else {
            if (!isMobile) toast.error(result.error || t('toast.generalClosureError'));
        }
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

    const layoutProps: CassaLayoutProps = {
        theme,
        onThemeToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        cashRegisterName,
        foodSearchQuery,
        onFoodSearchChange: setFoodSearchQuery,
        user: user ?? undefined,
        onLogout: handleLogout,
        onSettingsClick: () => router.push('/settings'),
        onGeneralClosure: handleGeneralClosure,
        categories,
        selectedCategoryId,
        onSelectCategory: setSelectedCategoryId,
        loadingCategories,
        foods,
        loadingFoods,
        onAddToCart: addToCart,
        cart,
        allIngredients,
        customer,
        table,
        displayCode,
        enableTableInput,
        tableInputDisabled: table === 'NO_TABLE_PRESET',
        paymentMethod,
        paidAmount,
        appliedDiscount: appliedDiscountAmount,
        total,
        surcharges,
        change,
        validationErrors,
        validationMessage,
        onUpdateCustomer: (value) => {
            setCustomer(value);
            setValidationErrors(prev => ({ ...prev, customer: undefined }));
        },
        onUpdateTable: (value) => {
            setTable(value);
            setValidationErrors(prev => ({ ...prev, table: undefined }));
        },
        onUpdateDisplayCode: setDisplayCode,
        onLoadOrder: loadOrderByCode,
        loadingOrder,
        onUpdateQuantity: updateQuantity,
        onRemoveItem: removeFromCart,
        onEditItem: setEditingItem,
        onClearCart: clearCart,
        onConfirmOrder: confirmOrder,
        loadingConfirmOrder,
        onOpenDiscount: () => setOpenDiscountDialog(true),
        onUpdatePaymentMethod: setPaymentMethod,
        onUpdatePaidAmount: (value) => {
            setPaidAmount(value);
            setValidationErrors(prev => ({ ...prev, paidAmount: undefined }));
        },
        showDailyOrders,
        onToggleDailyOrders: () => setShowDailyOrders(!showDailyOrders),
        cartScrollRef,
        dailyOrders,
        searchQuery,
        loadingDailyOrders,
        showAllOrders,
        onSearchChange: setSearchQuery,
        onViewDetail: viewOrderDetail,
        onLoadToCart: loadOrderToCart,
        onCancelOrder: handleCancelOrder,
        onToggleAllOrders: () => setShowAllOrders(!showAllOrders),
        viewingOrderDetail,
        loadingOrderDetail,
        onCloseOrderDetail: () => setViewingOrderDetail(null),
        editingItem,
        onSaveEditedItem: handleSaveEditedItem,
        onClearEditingItem: () => setEditingItem(null),
    };

    return (
        <>
            {isMobile
                ? <MobileCassaLayout {...layoutProps} />
                : <DesktopCassaLayout {...layoutProps} />
            }

            {!isMobile && (
                <EditItemDialog
                    item={editingItem}
                    open={editingItem !== null}
                    onClose={() => setEditingItem(null)}
                    onSave={handleSaveEditedItem}
                    allIngredients={allIngredients}
                />
            )}

            <DiscountDialog
                open={openDiscountDialog}
                currentDiscount={appliedDiscountAmount}
                orderTotal={calculateTotal(cart, 0)}
                onClose={() => setOpenDiscountDialog(false)}
                onApply={setAppliedDiscountAmount}
                onRemove={() => setAppliedDiscountAmount(0)}
            />

            {!isMobile && (
                <OrderDetailDialog
                    order={viewingOrderDetail}
                    open={viewingOrderDetail !== null}
                    loading={loadingOrderDetail}
                    onClose={() => setViewingOrderDetail(null)}
                />
            )}

            <ConfigurationDialog
                open={showConfigDialog}
                onOpenChange={setShowConfigDialog}
                onCashRegisterSelected={handleCashRegisterSelected}
            />

            <AlertDialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Prodotti non disponibili</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div>
                                <p className="mb-2">Il carrello contiene i seguenti prodotti non disponibili:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                                    {cart.filter(item => !item.food.available).map(item => (
                                        <li key={item.cartItemId}>{item.food.name}</li>
                                    ))}
                                </ul>
                                <p className="mt-3">Vuoi creare l&apos;ordine comunque?</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/80"
                            onClick={doConfirmOrder}
                        >
                            Crea ordine
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
