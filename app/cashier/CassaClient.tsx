'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { toast } from 'sonner';
import { getStations, getAllIngredients, getOrderByOrderId, confirmOrder as confirmOrderAction, createOrder, getTodayOrders, getAllTodayOrders, getFoodById, searchDailyOrders, searchAllDailyOrders, getOrderByCode, getCashRegisters, getPrinterById, generalClosure, cancelOrder as cancelOrderAction } from '@/actions/cashier';
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
import { ApiError } from '@/lib/api-error';

/** Solleva ApiError se l'action ha restituito un fallimento. */
function throwIfActionError(result: { success: boolean; error?: string; status?: number; code?: string }) {
    if (!result.success) {
        throw new ApiError(result.status ?? 0, result.error, result.code);
    }
}

const ORDER_DRAFT_KEY = 'mycassa_order_draft';

export default function CassaPage({ requiredTable, requireCustomer }: { requiredTable: boolean; requireCustomer: boolean }) {
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
    const showDailyOrdersRef = useRef<boolean>(false);
    const isMobileRef = useRef<boolean>(isMobile);
    const sseConnectedRef = useRef<boolean>(false);
    const printerCacheRef = useRef<Map<string, { name: string; ip?: string | null }>>(new Map());
    const wasAuthenticatedRef = useRef(isAuthenticated);
    const [categories, setCategories] = useState<Category[]>([]);
    const [foods, setFoods] = useState<Food[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [cart, setCart] = useState<ExtendedCartItem[]>([]);
    const [displayCode, setDisplayCode] = useState('');
    const [customer, setCustomer] = useState('');
    const [table, setTable] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
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
    const [cashRegisterId, setCashRegisterId] = useState<string>('');
    const [cashRegisterInvalid, setCashRegisterInvalid] = useState(false);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [loadingConfirmOrder, setLoadingConfirmOrder] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
    const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);
    const [printerOfflineInfo, setPrinterOfflineInfo] = useState<{ label: string } | null>(null);
    const [printerErrorInfo, setPrinterErrorInfo] = useState<{ label: string; status: string } | null>(null);
    const [stationsMap, setStationsMap] = useState<Record<string, string>>({});

    // Restore order draft from sessionStorage on mount
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(ORDER_DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            if (draft.cart?.length) setCart(draft.cart);
            if (draft.customer) setCustomer(draft.customer);
            if (draft.table) setTable(draft.table);
            if (draft.displayCode) setDisplayCode(draft.displayCode);
            if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
            if (draft.paidAmount) setPaidAmount(draft.paidAmount);
            if (draft.appliedDiscountAmount) setAppliedDiscountAmount(draft.appliedDiscountAmount);
        } catch {}
    }, []);

    // Save order draft to sessionStorage on change
    useEffect(() => {
        try {
            sessionStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify({
                cart, customer, table, displayCode, paymentMethod, paidAmount, appliedDiscountAmount
            }));
        } catch {}
    }, [cart, customer, table, displayCode, paymentMethod, paidAmount, appliedDiscountAmount]);

    // Clear localStorage and logout on auth errors, redirecting to login with a reason code
    const handleAuthError = async (code?: string) => {
        localStorage.removeItem('mycassa_user');
        localStorage.removeItem('selectedCashRegister');
        await logoutAction();
        router.push(`/login?error=${encodeURIComponent(code ?? 'session_expired')}`);
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

    // Keep refs in sync with state
    useEffect(() => {
        showAllOrdersRef.current = showAllOrders;
        dailyOrdersRef.current = dailyOrders;
        showDailyOrdersRef.current = showDailyOrders;
        isMobileRef.current = isMobile;
    }, [showAllOrders, dailyOrders, showDailyOrders, isMobile]);



    // Load selected cash register name from localStorage
    useEffect(() => {
        const fetchCashRegisterName = async () => {
            const selectedId = localStorage.getItem('selectedCashRegister');
            if (selectedId) {
                try {
                    const result = await getCashRegisters();
                    throwIfActionError(result);
                    const cashRegisters = result.data;
                    const selected = cashRegisters.find((cr: any) => cr.id === selectedId);
                    if (selected) {
                        setCashRegisterId(selected.id);
                        setCashRegisterName(selected.name);
                        setCashRegisterInvalid(false);
                    } else {
                        setCashRegisterInvalid(true);
                        localStorage.removeItem('selectedCashRegister');
                        setShowConfigDialog(true);
                    }
                } catch (error: any) {
                    if (error instanceof ApiError && error.isAuthError) {
                        await handleAuthError(error.code);
                        return;
                    }
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
    const handleCashRegisterSelected = (id: string, name: string) => {
        setCashRegisterId(id);
        setCashRegisterName(name);
        setCashRegisterInvalid(false);
        localStorage.setItem('selectedCashRegister', id);
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Load stations with categories, foods and ingredients
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const [result, ingredientsResult] = await Promise.all([
                    getStations(),
                    getAllIngredients(),
                ]);
                throwIfActionError(result);
                if (!result.success) return;

                const { categories: fetchedCategories, stations } = result.data;

                // Extract all foods from categories
                const allFoods: Food[] = [];
                const stationIdToName: Record<string, string> = {};

                // Map stations to names
                stations.forEach((station: any) => {
                    stationIdToName[station.id] = station.name;
                });

                // Process categories with foods
                fetchedCategories.forEach((cat: any) => {
                    // Extract foods from category
                    if (cat.foods) {
                        cat.foods.forEach((food: any) => {
                            const foodWithCategory: Food = {
                                ...food,
                                category: cat
                            };
                            allFoods.push(foodWithCategory);
                        });
                    }
                });

                // Sort categories by position
                const sortedCategories = fetchedCategories.sort((a: Category, b: Category) => a.position - b.position);
                setCategories(sortedCategories);
                setFoods(allFoods);
                // Use all ingredients from dedicated endpoint (covers ingredients not yet assigned to any food)
                if (ingredientsResult.success) {
                    setAllIngredients(ingredientsResult.data);
                }
                setStationsMap(stationIdToName);
            } catch (error: any) {
                if (error instanceof ApiError && error.isAuthError) {
                    await handleAuthError(error.code);
                    return;
                }
                console.error('Error loading stations:', error);
                if (!isMobile) toast.error(t('toast.categoriesLoadError'));
            } finally {
                setLoadingCategories(false);
                setLoadingFoods(false);
            }
        };

        if (isAuthenticated) {
            fetchStations();
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

                            // On reconnection only: reload orders to catch missed events
                            // First connect is handled by the useEffect below
                            if (sseConnectedRef.current && (showDailyOrdersRef.current || isMobileRef.current)) {
                                try {
                                    const result = showAllOrdersRef.current ? await getAllTodayOrders() : await getTodayOrders();
                                    if (result.success) {
                                        setDailyOrders(result.data);
                                        console.log('[SSE] Ordini ricaricati dopo riconnessione:', result.data.length);
                                    } else {
                                        console.error('[SSE] Errore caricamento ordini dopo riconnessione:', result.error);
                                    }
                                } catch (error: any) {
                                    console.error('[SSE] Errore caricamento ordini dopo riconnessione:', error);
                                }
                            }
                            sseConnectedRef.current = true;
                        } else if (response.status === 401 || response.status === 403) {
                            abortController.abort();
                            await handleAuthError('session_expired');
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

                                setDailyOrders((prevOrders) => {
                                    const existingIndex = prevOrders.findIndex(o => o.id === order.id);

                                    if (existingIndex !== -1) {
                                        const newOrders = [...prevOrders];
                                        newOrders[existingIndex] = { ...prevOrders[existingIndex], ...order };
                                        return newOrders;
                                    } else {
                                        return [order, ...prevOrders];
                                    }
                                });


                            } catch (error) {
                                console.error('[SSE] Errore parsando new-order:', error);
                            }
                        }
                        // Handle confirmed-order event
                        else if (event.event === 'confirmed-order') {
                            try {
                                const { id } = JSON.parse(event.data);

                                if (showAllOrdersRef.current) {
                                    // Fetch full details only when showing all orders (need ticketNumber etc.)
                                    try {
                                        const result = await getOrderByOrderId(id);
                                        if (result.success) {
                                            const newOrder = result.data;
                                            const dailyOrder: DailyOrder = {
                                                id: newOrder.id,
                                                displayCode: newOrder.displayCode,
                                                ticketNumber: (newOrder as any).ticketNumber,
                                                table: newOrder.table,
                                                customer: newOrder.customer,
                                                createdAt: newOrder.createdAt,
                                                subTotal: newOrder.subTotal,
                                                total: newOrder.total,
                                                status: 'CONFIRMED'
                                            };
                                            const orderExists = dailyOrdersRef.current.some(o => o.id === id);
                                            if (orderExists) {
                                                setDailyOrders(prev => prev.map(o => o.id === id ? dailyOrder : o));
                                            } else {
                                                setDailyOrders(prev => [dailyOrder, ...prev]);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('[SSE] Error fetching confirmed order details:', error);
                                    }
                                } else {
                                    setDailyOrders(prev => prev.filter(o => o.id !== id));
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
                                            setPrinterOfflineInfo(null);
                                            toast.success(t('toast.printerOnline', { label }), { description: t('toast.printerOnlineDesc') });
                                        } else if (status === 'OFFLINE') {
                                            setPrinterOfflineInfo({ label });
                                        } else {
                                            setPrinterErrorInfo({ label, status });
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
            sseConnectedRef.current = false;
        };
    }, [isAuthenticated]);

    // Load or search daily orders
    useEffect(() => {
        if (!isAuthenticated || (!showDailyOrders && !isMobile)) {
            return;
        }

        if (!searchQuery.trim()) {
            const loadOrders = async () => {
                setLoadingDailyOrders(true);
                try {
                    const result = showAllOrders ? await getAllTodayOrders() : await getTodayOrders();
                    throwIfActionError(result);
                    if (result.success) setDailyOrders(result.data);
                } catch (error: any) {
                    if (error instanceof ApiError && error.isAuthError) {
                        await handleAuthError(error.code);
                        return;
                    }
                    console.error('Errore caricamento ordini:', error);
                    if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
                } finally {
                    setLoadingDailyOrders(false);
                }
            };

            loadOrders();
            return;
        }

        const searchOrders = async () => {
            try {
                const result = showAllOrders ? await searchAllDailyOrders(searchQuery) : await searchDailyOrders(searchQuery);
                throwIfActionError(result);
                if (result.success) setDailyOrders(result.data);
            } catch (error: any) {
                if (error instanceof ApiError && error.isAuthError) {
                    await handleAuthError(error.code);
                    return;
                }
                console.error('Errore nella ricerca:', error);
                if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
            }
        };

        const debounceTimer = setTimeout(searchOrders, 300);
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
        sessionStorage.removeItem(ORDER_DRAFT_KEY);
        setCart([]);
        setDisplayCode('');
        setCustomer('');
        setTable('');
        setPaidAmount('');
        setAppliedDiscountAmount(0);
        setPaymentMethod(null);
    };

    const resetAfterOrder = () => {
        sessionStorage.removeItem(ORDER_DRAFT_KEY);
        setCart([]);
        setDisplayCode('');
        setCustomer('');
        setTable('');
        setAppliedDiscountAmount(0);
        // paidAmount and paymentMethod not cleared here — CartSidebar timer clears them when it expires
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
            throwIfActionError(result);
            if (!result.success) return;

            const order = result.data;

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
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }
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
            throwIfActionError(result);
            if (!result.success) return;

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
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }
            console.error('Error loading order to cart:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
        }
    };

    // View order detail
    const viewOrderDetail = async (orderId: string) => {
        setLoadingOrderDetail(true);
        try {
            const result = await getOrderByOrderId(orderId);
            throwIfActionError(result);
            if (result.success) setViewingOrderDetail(result.data);
        } catch (error: any) {
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }
            console.error('Error loading order detail:', error);
            if (!isMobile) toast.error(error.message || t('toast.orderLoadError'));
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            const result = await cancelOrderAction(orderId);
            throwIfActionError(result);
            setDailyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
            toast.success(t('toast.orderCancelled'));
        } catch (error: any) {
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }
            console.error('Error cancelling order:', error);
            toast.error(error instanceof ApiError ? error.message : t('toast.orderCancelError'));
        }
    };

    // Validate order and check for unavailable items before submitting
    const confirmOrder = async () => {
        // Validate cash register is selected and still exists in the system
        const selectedCashRegister = localStorage.getItem('selectedCashRegister');
        if (!selectedCashRegister) {
            if (!isMobile) toast.error(t('toast.noCashRegisterSelected'));
            setShowConfigDialog(true);
            return;
        }

        // Validate payment method
        if (!paymentMethod) {
            toast.error('Seleziona un metodo di pagamento');
            return;
        }

        // Validate customer
        if (requireCustomer) {
            const defaultCustomerEnabled = localStorage.getItem('defaultCustomerEnabled') === 'true';
            const defaultCustomerValue = localStorage.getItem('defaultCustomerValue') ?? '';
            const customerToValidate = !customer.trim() && defaultCustomerEnabled && defaultCustomerValue.trim()
                ? defaultCustomerValue
                : customer;
            const customerValidation = orderSchema.shape.customer.safeParse(customerToValidate);
            if (!customerValidation.success) {
                toast.error(customerValidation.error.issues[0].message);
                return;
            }
        }

        // Validate table only if enabled
        if (enableTableInput) {
            const defaultTableEnabled = localStorage.getItem('defaultTableEnabled') === 'true';
            const defaultTableValue = localStorage.getItem('defaultTableValue') ?? '';
            const tableToValidate = !table.trim() && defaultTableEnabled && defaultTableValue.trim()
                ? defaultTableValue
                : table;
            const tableValidation = z.string().min(1, 'Il numero del tavolo è obbligatorio').safeParse(tableToValidate);
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
            const defaultCustomerEnabled = localStorage.getItem('defaultCustomerEnabled') === 'true';
            const defaultCustomerValue = localStorage.getItem('defaultCustomerValue') ?? '';
            const defaultTableEnabled = localStorage.getItem('defaultTableEnabled') === 'true';
            const defaultTableValue = localStorage.getItem('defaultTableValue') ?? '';

            const effectiveCustomer = !requireCustomer && !customer.trim()
                ? 'NO CUSTOMER'
                : (defaultCustomerEnabled && !customer.trim() && defaultCustomerValue.trim() ? defaultCustomerValue : customer);
            const effectiveTable = defaultTableEnabled && !table.trim() && defaultTableValue.trim()
                ? defaultTableValue
                : table;

            // Merge cart items with same foodId and notes
            const mergedOrderItems = mergeCartItems(cart, allIngredients);

            // If displayCode exists, load the order to confirm it
            if (displayCode.trim()) {
                const result = await getOrderByCode(displayCode.toUpperCase());
                throwIfActionError(result);
                if (!result.success) return;

                const orderResponse = result.data;
                const orderId = orderResponse.id;
                const originalCustomerFromOrder = orderResponse.customer;
                const originalTableFromOrder = orderResponse.table;

                const confirmResult = await confirmOrderAction({
                    orderId,
                    paymentMethod: paymentMethod!,
                    userId: user?.id || '',
                    cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                    discount: appliedDiscountAmount,
                    customer: effectiveCustomer !== originalCustomerFromOrder ? effectiveCustomer : undefined,
                    table: effectiveTable !== originalTableFromOrder ? effectiveTable : undefined,
                    orderItems: mergedOrderItems,
                });

                if (!confirmResult.success) {
                    throw new ApiError(confirmResult.status ?? 0, confirmResult.error, (confirmResult as any).code);
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
                    table: enableTableInput && effectiveTable.trim() ? effectiveTable : "NO_TABLE_PRESET",
                    customer: effectiveCustomer,
                    orderItems: mergedOrderItems,
                    confirm: {
                        paymentMethod: paymentMethod!,
                        userId: user?.id || '',
                        cashRegisterId: localStorage.getItem('selectedCashRegister') || '',
                        discount: appliedDiscountAmount,
                    }
                });

                if (!createResult.success) {
                    throw new ApiError(createResult.status ?? 0, createResult.error, (createResult as any).code);
                }
            }

            if (!isMobile) {
                toast.success(t('toast.orderConfirmed'));
            }
            if (isMobile) {
                clearCart();
            } else {
                resetAfterOrder();
            }
        } catch (error: any) {
            // Errore di autenticazione: pulisci sessione e vai al login con il codice errore
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }

            if (error instanceof ApiError && error.status === 400 && error.code === 'ForeignKeyConstraintViolation') {
                const selectedCashRegister = localStorage.getItem('selectedCashRegister');
                let handled = false;

                // Check cash register still exists
                try {
                    const registersResult = await getCashRegisters();
                    if (registersResult.success) {
                        const exists = registersResult.data.some((cr: any) => cr.id === selectedCashRegister);
                        if (!exists) {
                            setCashRegisterInvalid(true);
                            setCashRegisterName('');
                            localStorage.removeItem('selectedCashRegister');
                            if (!isMobile) toast.error(t('toast.noCashRegisterSelected'));
                            setShowConfigDialog(true);
                            handled = true;
                        }
                    }
                } catch {}

                // Cash register OK — check if any food in cart no longer exists
                if (!handled) {
                    const uniqueFoodIds = [...new Set(cart.map(item => item.food.id))];
                    try {
                        const foodResults = await Promise.all(uniqueFoodIds.map(id => getFoodById(id)));
                        const missingFoodIds = uniqueFoodIds.filter((_, i) => !foodResults[i].success);
                        if (missingFoodIds.length > 0) {
                            const missingNames = [...new Set(
                                cart
                                    .filter(item => missingFoodIds.includes(item.food.id))
                                    .map(item => item.food.name)
                            )];
                            if (!isMobile) toast.error(`Prodotti non più disponibili: ${missingNames.join(', ')}`);
                            handled = true;
                        }
                    } catch {}
                }

                if (handled) return;
            }

            console.error('Error confirming order:', error);
            const message = error instanceof ApiError ? error.message : t('toast.orderConfirmed');
            if (!isMobile) toast.error(message);
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
        try {
            const result = await generalClosure(cashRegisterId);
            throwIfActionError(result);
            if (!isMobile) toast.success(t('toast.generalClosureSuccess'));
        } catch (error: any) {
            if (error instanceof ApiError && error.isAuthError) {
                await handleAuthError(error.code);
                return;
            }
            if (!isMobile) toast.error(error instanceof ApiError ? error.message : t('toast.generalClosureError'));
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Caricamento...</div>
            </div>
        );
    }

    const total = calculateTotal(cart, appliedDiscountAmount, allIngredients);
    const surcharges = calculateTotalSurcharges(cart, allIngredients);
    const change = calculateChange(total, parseFloat(paidAmount) || 0);
    const _defCustEnabled = localStorage.getItem('defaultCustomerEnabled') === 'true';
    const _defCustValue = localStorage.getItem('defaultCustomerValue') ?? '';
    const _defTableEnabled = localStorage.getItem('defaultTableEnabled') === 'true';
    const _defTableValue = localStorage.getItem('defaultTableValue') ?? '';
    const _effectiveCustomer = _defCustEnabled && !customer.trim() && _defCustValue.trim() ? _defCustValue : customer;
    const _effectiveTable = _defTableEnabled && !table.trim() && _defTableValue.trim() ? _defTableValue : table;
    const baseValidation = getOrderValidationMessage(cart.length, _effectiveCustomer, _effectiveTable, enableTableInput, requireCustomer);
    const validationMessage = !paymentMethod
        ? [...(baseValidation ?? []), 'Seleziona un metodo di pagamento']
        : baseValidation;

    const layoutProps: CassaLayoutProps = {
        theme,
        onThemeToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        cashRegisterName,
        cashRegisterId,
        cashRegisterInvalid,
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
        requireCustomer,
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
                orderTotal={calculateTotal(cart, 0, allIngredients)}
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
                    stationsMap={stationsMap}
                />
            )}

            <ConfigurationDialog
                open={showConfigDialog}
                onOpenChange={setShowConfigDialog}
                onCashRegisterSelected={handleCashRegisterSelected}
            />

            <AlertDialog open={printerOfflineInfo !== null} onOpenChange={(open) => { if (!open) setPrinterOfflineInfo(null); }}>
                <AlertDialogContent className="border-destructive border-2 sm:max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                                    <rect x="6" y="14" width="12" height="8" rx="1" />
                                    <line x1="2" y1="2" x2="22" y2="22" className="text-destructive" />
                                </svg>
                            </div>
                            <AlertDialogTitle className="text-destructive text-xl">
                                {t('toast.printerOffline', { label: printerOfflineInfo?.label ?? '' })}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base font-medium pl-15">
                            {t('toast.printerOfflineDesc')}. {t('dialog.printerOfflineAction')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/80 w-full"
                            onClick={() => setPrinterOfflineInfo(null)}
                        >
                            {t('dialog.printerOfflineDismiss')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={printerErrorInfo !== null} onOpenChange={(open) => { if (!open) setPrinterErrorInfo(null); }}>
                <AlertDialogContent className="border-amber-500 border-2 sm:max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                                    <rect x="6" y="14" width="12" height="8" rx="1" />
                                    <path d="M12 17v.01" />
                                </svg>
                            </div>
                            <AlertDialogTitle className="text-amber-500 text-xl">
                                {t('toast.printerError', { label: printerErrorInfo?.label ?? '' })}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base font-medium pl-15">
                            {t('toast.printerErrorDesc', { status: printerErrorInfo?.status ?? '' })}. {t('dialog.printerErrorAction')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            className="bg-amber-500 text-white hover:bg-amber-500/80 w-full"
                            onClick={() => setPrinterErrorInfo(null)}
                        >
                            {t('dialog.printerOfflineDismiss')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
