'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getCategories, getFoods, getOrderByCode, confirmOrder as confirmOrderAction, createOrder, getTodayOrders, getFoodById, searchDailyOrders } from '@/actions/cassa';
import { logout as logoutAction } from '@/actions/auth';
import { Category, Food, CartItem, PaymentMethod, OrderDetailResponse } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Filter,
    Settings,
    Moon,
    Sun,
    LogOut,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    Search,
    CreditCard,
    Banknote,
    Pencil,
    X,
    Percent,
    Eye,
    FileText
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ButtonGroup } from '@/components/ui/button-group';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { z } from 'zod';

// Validation schema
const orderSchema = z.object({
    customer: z.string().min(2, 'Il nome del cliente deve contenere almeno 2 caratteri'),
    table: z.string().min(1, 'Il numero del tavolo è obbligatorio'),
});

const paidAmountSchema = z.string()
    .regex(/^[0-9]+([.,][0-9]{0,2})?$/, 'Importo non valido (solo numeri, max 2 decimali)')
    .transform((val) => parseFloat(val.replace(',', '.')))
    .refine((val) => val >= 0, 'L\'importo deve essere maggiore o uguale a 0')
    .refine((val) => val <= 9999.99, 'L\'importo massimo è 9999.99');

const discountAmountSchema = z.string()
    .regex(/^[0-9]+([.,][0-9]{0,2})?$/, 'Importo sconto non valido (solo numeri, max 2 decimali)')
    .transform((val) => parseFloat(val.replace(',', '.')))
    .refine((val) => val >= 0, 'Lo sconto deve essere maggiore o uguale a 0')
    .refine((val) => val <= 9999.99, 'L\'importo massimo è 9999.99');

// Extended CartItem to include ingredient quantities and unique ID
interface ExtendedCartItem extends CartItem {
    cartItemId: string; // Unique identifier for each cart item
    ingredientQuantities?: Record<string, number>; // ingredientId -> quantity
}

// Daily Order type
interface DailyOrder {
    id: number;
    displayCode: string;
    table: string;
    customer: string;
    createdAt: string;
    subTotal: string;
}

export default function CassaPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const cartScrollRef = useRef<HTMLDivElement>(null);
    const sseConnectionRef = useRef(false);
    const lastEventRef = useRef<string | null>(null);

    const isAuthenticated = status === 'authenticated';
    const isLoading = status === 'loading';

    // State
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
    const [openClearDialog, setOpenClearDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<ExtendedCartItem | null>(null);
    const [editQuantity, setEditQuantity] = useState(1);
    const [editNotes, setEditNotes] = useState('');
    const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>({});
    const [validationErrors, setValidationErrors] = useState<{ customer?: string; table?: string; paidAmount?: string; discount?: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number>(0);
    const [enableTableInput, setEnableTableInput] = useState(true);
    const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
    const [loadingDailyOrders, setLoadingDailyOrders] = useState(false);
    const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderDetailResponse | null>(null);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

    // Get validation message for order button
    const getOrderValidationMessage = () => {
        const errors: string[] = [];

        if (cart.length === 0) {
            errors.push('Il carrello è vuoto');
        }

        if (!customer.trim()) {
            errors.push('Inserisci il nome del cliente');
        } else {
            const result = orderSchema.shape.customer.safeParse(customer);
            if (!result.success) {
                errors.push(result.error.issues[0].message);
            }
        }

        if (enableTableInput && !table.trim()) {
            errors.push('Inserisci il numero del tavolo');
        }

        if (errors.length === 0) return null;

        return (
            <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
            </ul>
        );
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Load table input setting
    useEffect(() => {
        const loadTableInputSetting = async () => {
            try {
                const response = await fetch('/api/settings?key=enableTableInput');
                if (response.ok) {
                    const data = await response.json();
                    setEnableTableInput(data.enableTableInput ?? true);
                }
            } catch (error) {
                console.error('Error loading table input setting:', error);
            }
        };

        if (isAuthenticated) {
            loadTableInputSetting();
        }
    }, [isAuthenticated]);

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();

                // Sort categories by position before setting them
                const sortedCategories = data.sort((a: Category, b: Category) => a.position - b.position);
                setCategories(sortedCategories);
            } catch (error) {
                console.error('Error loading categories:', error);
                toast.error('Impossibile caricare le categorie');
            } finally {
                setLoadingCategories(false);
            }
        };

        if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthenticated]);

    // Load foods
    useEffect(() => {
        const fetchFoods = async () => {
            try {
                const data = await getFoods();
                setFoods(data);
            } catch (error) {
                console.error('Error loading foods:', error);
                toast.error('Impossibile caricare i cibi');
            } finally {
                setLoadingFoods(false);
            }
        };

        if (isAuthenticated) {
            fetchFoods();
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

    // SSE connection - Always connected when authenticated (for food availability and order updates)
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
                            const { orderId, ticketNumber } = JSON.parse(event.data);

                            setDailyOrders((prevOrders) => {
                                return prevOrders.filter(o => o.id !== orderId);
                            });

                            toast.info(`Ordine confermato (Ticket: ${ticketNumber})`);
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
            console.log('[SSE] Sezione ordini chiusa o accessToken non disponibile');
            return;
        }

        console.log('[SSE] Sezione ordini aperta. Caricamento ordini iniziali...');

        // Load initial orders
        const loadInitialOrders = async () => {
            setLoadingDailyOrders(true);
            try {
                const orders = await getTodayOrders();
                setDailyOrders(orders);
                console.log(`[SSE] Caricati ${orders.length} ordini iniziali`);
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

    // Filter foods by category
    const filteredFoods = selectedCategoryId
        ? foods.filter((food) => food.categoryId === selectedCategoryId)
        : foods;

    // Group foods by category and sort categories by position
    const foodsByCategory = filteredFoods.reduce((acc, food) => {
        const categoryName = food.category?.name || 'Altro';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(food);
        return acc;
    }, {} as Record<string, Food[]>);

    // Sort foods within each category alphabetically
    const sortedFoodsByCategory = Object.keys(foodsByCategory)
        .sort((a, b) => {
            const categoryA = categories.find((cat) => cat.name === a);
            const categoryB = categories.find((cat) => cat.name === b);
            return (categoryA?.position || 0) - (categoryB?.position || 0);
        })
        .reduce((acc, key) => {
            acc[key] = foodsByCategory[key].sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));
            return acc;
        }, {} as Record<string, Food[]>);

    // Calculate total
    const calculateTotal = () => {
        const subtotal = cart.reduce((total, item) => {
            const price = typeof item.food.price === 'number'
                ? item.food.price
                : parseFloat(item.food.price as unknown as string);
            const itemTotal = price * item.quantity;
            const surcharge = calculateIngredientSurcharge(item);
            return total + itemTotal + surcharge;
        }, 0);

        // Apply discount (fixed amount)
        const discountToApply = appliedDiscountAmount || 0;
        return Math.max(0, subtotal - discountToApply);
    };

    // Calculate total surcharges
    const calculateTotalSurcharges = () => {
        return cart.reduce((total, item) => {
            return total + calculateIngredientSurcharge(item);
        }, 0);
    };

    // Calculate change
    const calculateChange = () => {
        const total = calculateTotal();
        const paid = parseFloat(paidAmount) || 0;
        return paid - total;
    };

    // Add food to cart
    const addToCart = (food: Food) => {
        setCart((prev) => {
            const existingItem = prev.find((item) =>
                item.food.id === food.id &&
                !item.notes &&
                !item.ingredientQuantities
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

    // Update quantity
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

    // Remove from cart
    const removeFromCart = (cartItemId: string) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    // Open edit dialog
    const openEditDialog = (item: ExtendedCartItem) => {
        setEditingItem(item);
        setEditQuantity(1); // Start with 1 as default
        setEditNotes(item.notes || '');
        // Initialize ingredient quantities: default to 1 for all ingredients
        const initialQuantities: Record<string, number> = {};
        item.food.ingredients?.forEach((ingredient) => {
            initialQuantities[ingredient.id] = item.ingredientQuantities?.[ingredient.id] ?? 1;
        });
        setIngredientQuantities(initialQuantities);
    };

    // Update ingredient quantity
    const updateIngredientQuantity = (ingredientId: string, delta: number) => {
        setIngredientQuantities((prev) => {
            const currentQty = prev[ingredientId] ?? 1;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [ingredientId]: newQty };
        });
    };

    // Save edited item
    const saveEditedItem = () => {
        if (!editingItem) return;

        setCart((prev) => {
            const newCart: ExtendedCartItem[] = [];

            prev.forEach((item) => {
                if (item.cartItemId === editingItem.cartItemId) {
                    // If edit quantity is less than total, split into separate cards
                    const remainingQty = item.quantity - editQuantity;

                    if (remainingQty > 0) {
                        // Keep the unmodified portion with the original cartItemId
                        newCart.push({
                            ...item,
                            quantity: remainingQty
                        });
                    }

                    // Add the modified portion as a NEW separate card with new ID
                    if (editQuantity > 0) {
                        newCart.push({
                            cartItemId: `${item.food.id}-${Date.now()}-${Math.random()}`,
                            food: item.food,
                            quantity: editQuantity,
                            notes: editNotes,
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
        setEditQuantity(1);
        setEditNotes('');
        setIngredientQuantities({});
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setDisplayCode('');
        setCustomer('');
        setTable('');
        setPaidAmount('');
        setAppliedDiscountAmount(0);
        setDiscountAmount('');
    };

    // Load order by display code
    const loadOrderByCode = async () => {
        if (!displayCode.trim()) {
            toast.error('Inserisci un codice ordine');
            return;
        }

        setLoadingOrder(true);
        try {
            const order = await getOrderByCode(displayCode);

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

    // Load today's orders
    const loadTodayOrders = async () => {
        setLoadingDailyOrders(true);
        try {
            const orders = await getTodayOrders();
            setDailyOrders(orders);
            toast.success(`Caricati ${orders.length} ordini di oggi`);
        } catch (error: any) {
            console.error('Error loading today orders:', error);
            toast.error(error.message || 'Impossibile caricare gli ordini di oggi');
        } finally {
            setLoadingDailyOrders(false);
        }
    };

    // View order detail
    const viewOrderDetail = async (displayCode: string) => {
        setLoadingOrderDetail(true);
        try {
            const order = await getOrderByCode(displayCode);
            setViewingOrderDetail(order);
        } catch (error: any) {
            console.error('Error loading order detail:', error);
            toast.error(error.message || 'Impossibile caricare i dettagli dell\'ordine');
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    // Load order to cart from daily orders
    const loadOrderToCart = async (order: DailyOrder) => {
        try {
            const orderDetail = await getOrderByCode(order.displayCode);

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

    // Apply discount
    const applyDiscount = () => {
        if (!discountAmount.trim()) {
            setAppliedDiscountAmount(0);
            setOpenDiscountDialog(false);
            setDiscountAmount('');
            return;
        }

        const result = discountAmountSchema.safeParse(discountAmount);

        if (!result.success) {
            setValidationErrors(prev => ({ ...prev, discount: result.error.issues[0].message }));
            toast.error(result.error.issues[0].message);
            return;
        }

        setValidationErrors(prev => ({ ...prev, discount: undefined }));
        setAppliedDiscountAmount(result.data);
        setOpenDiscountDialog(false);
        toast.success(`Sconto di ${result.data.toFixed(2)} € applicato`);
    };

    // Generate notes from ingredient modifications
    const generateIngredientNotes = (item: ExtendedCartItem): string => {
        if (!item.ingredientQuantities || !item.food.ingredients) {
            return '';
        }

        const notes: string[] = [];

        item.food.ingredients.forEach((ingredient) => {
            const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;

            if (qty === 0) {
                // Ingredient removed
                notes.push(`No ${ingredient.name}`);
            } else if (qty > 1) {
                // Multiple ingredients
                notes.push(`${ingredient.name} x${qty}`);
            }
            // qty === 1 is standard, no note needed
        });

        return notes.join(', ');
    };

    // Calculate extra ingredient surcharge
    const calculateIngredientSurcharge = (item: ExtendedCartItem): number => {
        if (!item.ingredientQuantities || !item.food.ingredients) {
            return 0;
        }

        let surcharge = 0;

        item.food.ingredients.forEach((ingredient) => {
            const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;

            if (qty > 1) {
                // Add 0.5 for each extra piece
                surcharge += (qty - 1) * 0.5;
            }
        });

        return surcharge * item.quantity; // Multiply by item quantity
    };

    // Merge cart items with same foodId and notes
    const mergeCartItems = (items: ExtendedCartItem[]) => {
        const mergedMap = new Map<string, {
            foodId: string;
            quantity: number;
            notes?: string;
        }>();

        items.forEach((item) => {
            const ingredientNotes = generateIngredientNotes(item);
            const customNotes = item.notes || '';

            // Concatenate custom notes with ingredient notes
            let finalNotes = '';
            if (customNotes && ingredientNotes) {
                finalNotes = `${customNotes}, ${ingredientNotes}`;
            } else if (customNotes) {
                finalNotes = customNotes;
            } else if (ingredientNotes) {
                finalNotes = ingredientNotes;
            }

            // Create unique key: foodId + notes (or empty string if no notes)
            const key = `${item.food.id}|${finalNotes}`;

            if (mergedMap.has(key)) {
                // Merge quantities
                const existing = mergedMap.get(key)!;
                existing.quantity += item.quantity;
            } else {
                // Add new entry
                mergedMap.set(key, {
                    foodId: item.food.id,
                    quantity: item.quantity,
                    ...(finalNotes && { notes: finalNotes }),
                });
            }
        });

        return Array.from(mergedMap.values());
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

            // If displayCode exists, load the order to confirm it
            if (displayCode.trim()) {
                const orderResponse = await getOrderByCode(displayCode.toUpperCase());
                const orderId = parseInt(orderResponse.id);

                await confirmOrderAction({
                    orderId,
                    paymentMethod,
                    discount: appliedDiscountAmount,
                    orderItems: mergedOrderItems,
                });
            } else {
                // Create new order with notes
                const createOrderResponse = await createOrder({
                    table: enableTableInput && table.trim() ? table : "no table",
                    customer,
                    orderItems: mergedOrderItems,
                });

                // Get the created order ID
                const createdOrderId = parseInt(createOrderResponse.id);

                // Calculate total surcharge from all items
                const totalSurcharge = cart.reduce((sum, item) => sum + calculateIngredientSurcharge(item), 0);

                // Confirm the created order with discount and surcharge
                await confirmOrderAction({
                    orderId: createdOrderId,
                    paymentMethod,
                    discount: appliedDiscountAmount,
                    surcharge: totalSurcharge,
                    orderItems: mergedOrderItems,
                });
            }

            toast.success('L\'ordine è stato confermato con successo');

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

    return (
        <div className="flex h-screen bg-background">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="border-b bg-card">
                    <div className="flex h-16 items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">MyCassa</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => router.push('/settings')}>
                                <Settings className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut className="h-5 w-5" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Categories */}
                    <aside className="w-64 border-r bg-card">
                        <div className="p-2">
                            <Button
                                variant={selectedCategoryId === null ? 'default' : 'outline'}
                                className="w-full justify-start h-20"
                                onClick={() => setSelectedCategoryId(null)}
                            >
                                <div className='text-lg'>
                                    Tutte le categorie
                                </div>
                            </Button>
                        </div>

                        <ScrollArea className="h-[calc(100vh-8rem)]">
                            <div className="space-y-2.5 p-2">
                                {loadingCategories ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Caricamento...
                                    </div>
                                ) : (
                                    categories.map((category) => (
                                        <Button
                                            key={category.id}
                                            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                                            className="w-full justify-start"
                                            onClick={() => setSelectedCategoryId(category.id)}
                                        >
                                            {category.name}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* Center - Food Grid */}
                    <main className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-8 p-6">
                                {loadingFoods ? (
                                    <div className="flex h-64 items-center justify-center">
                                        <div className="text-muted-foreground">Caricamento cibi...</div>
                                    </div>
                                ) : (
                                    Object.entries(sortedFoodsByCategory).map(([categoryName, categoryFoods]) => (
                                        <div key={categoryName}>
                                            <div className="mb-4 flex items-center">
                                                <h3 className="border-b-2 border-amber-500 pb-2 text-xl font-semibold uppercase tracking-wide">
                                                    {categoryName}
                                                </h3>
                                            </div>

                                            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                                                {categoryFoods.map((food) => (
                                                    <Card
                                                        key={food.id}
                                                        className="cursor-pointer transition-all hover:scale-105 hover:border-amber-500 hover:shadow-lg"
                                                        onClick={() => addToCart(food)}
                                                    >
                                                        <CardContent className="flex flex-col items-center justify-center h-10">
                                                            <h4 className="mb-2 text-center font-medium text-sm">
                                                                {food.name}
                                                            </h4>
                                                            <p className="text-lg font-bold text-amber-500">
                                                                {typeof food.price === 'number'
                                                                    ? `${food.price.toFixed(2)} €`
                                                                    : `${parseFloat(food.price as unknown as string).toFixed(2)} €`}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {!loadingFoods && filteredFoods.length === 0 && (
                                    <div className="py-12 text-center text-muted-foreground">
                                        Nessun cibo disponibile in questa categoria
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </main>
                </div>
            </div>

            {/* Right Sidebar - Cart (Full Height) */}
            <aside className="w-96 border-l flex flex-col bg-card h-screen">
                <div className="flex place-content-between p-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <ShoppingCart className="h-5 w-5" />
                        Carrello
                    </h2>

                    <Button
                        variant={showDailyOrders ? 'default' : 'outline'}
                        onClick={() => setShowDailyOrders(!showDailyOrders)}
                    >
                        Ordini Giornalieri
                    </Button>

                </div>

                <div className="space-y-4 p-4">
                    {/* Load Order */}
                    <div>
                        <Label htmlFor="displayCode" className='mb-2'>Carica Ordine</Label>
                        <div className="mt-1 flex gap-2">
                            <Input
                                autoComplete='off'
                                id="displayCode"
                                placeholder="CODICE ORDINE (ES. ABC)"
                                value={displayCode}
                                onChange={(e) => setDisplayCode(e.target.value.toUpperCase())}
                                maxLength={3}
                            />
                            <Button onClick={loadOrderByCode} disabled={loadingOrder}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <Label htmlFor="customer" className='mb-2'>Cliente *</Label>
                            <Input
                                autoComplete='off'
                                id="customer"
                                placeholder="Es. Mario Rossi"
                                value={customer}
                                onChange={(e) => {
                                    setCustomer(e.target.value);
                                    setValidationErrors(prev => ({ ...prev, customer: undefined }));
                                }}
                                className={validationErrors.customer ? 'border-red-500' : ''}
                            />
                            {validationErrors.customer && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.customer}</p>
                            )}
                        </div>

                        {/* Table */}
                        {enableTableInput && (
                            <div>
                                <Label htmlFor="table" className='mb-2'>Tavolo *</Label>
                                <Input
                                    autoComplete='off'
                                    id="table"
                                    placeholder="Es. 12 o Tavolo A5"
                                    value={table}
                                    onChange={(e) => {
                                        setTable(e.target.value);
                                        setValidationErrors(prev => ({ ...prev, table: undefined }));
                                    }}
                                    className={validationErrors.table ? 'border-red-500' : ''}
                                />
                                {validationErrors.table && (
                                    <p className="text-xs text-red-500 mt-1">{validationErrors.table}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 border-y overflow-hidden">
                    <ScrollArea className="h-full" ref={cartScrollRef}>
                        <div className="p-4">
                            {cart.length === 0 ? (
                                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                    Carrello vuoto
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item) => {
                                        const itemPrice = (typeof item.food.price === 'number'
                                            ? item.food.price
                                            : parseFloat(item.food.price as unknown as string));
                                        const itemSurcharge = calculateIngredientSurcharge(item);
                                        const itemTotal = (itemPrice * item.quantity) + itemSurcharge;

                                        return (
                                            <div key={item.cartItemId} className="bg-card border rounded-lg p-3">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm">{item.food.name}</h4>
                                                        {item.ingredientQuantities && item.food.ingredients && (
                                                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                                                {item.food.ingredients
                                                                    .map((ing) => {
                                                                        const qty = item.ingredientQuantities?.[ing.id] ?? 1;
                                                                        if (qty === 0) {
                                                                            return `NO ${ing.name}`;
                                                                        } else if (qty > 1) {
                                                                            return `${qty}x ${ing.name}`;
                                                                        }
                                                                        return null;
                                                                    })
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </p>
                                                        )}
                                                        {item.notes && (
                                                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => openEditDialog(item)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => removeFromCart(item.cartItemId)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(item.cartItemId, -1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(item.cartItemId, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-right">
                                                        {itemSurcharge > 0 && (
                                                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                                                (+{(itemSurcharge / item.quantity).toFixed(2)}€)
                                                            </p>
                                                        )}
                                                        <p className="text-lg font-bold">{itemTotal.toFixed(2)} €</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer - Total & Payment */}
                <div className="space-y-4 p-4">
                    {/* Total */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold">TOTALE:</span>
                            <span className="text-2xl font-bold text-amber-500">
                                {calculateTotal().toFixed(2)} €
                            </span>
                        </div>
                        {calculateTotalSurcharges() > 0 && (
                            <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-500">
                                <span>Sovrapprezzi totali:</span>
                                <span className="font-semibold">
                                    +{calculateTotalSurcharges().toFixed(2)} €
                                </span>
                            </div>
                        )}
                        {appliedDiscountAmount > 0 && (
                            <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-500">
                                <span>Sconto applicato:</span>
                                <span className="font-semibold">
                                    -{appliedDiscountAmount.toFixed(2)} €
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <Label>Metodo Pagamento *</Label>
                        <ButtonGroup className="mt-2 w-full">
                            <Button
                                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setPaymentMethod('CASH')}
                            >
                                <Banknote className="mr-2 h-4 w-4" />
                                Contanti
                            </Button>
                            <Button
                                variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setPaymentMethod('CARD')}
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                POS
                            </Button>
                        </ButtonGroup>
                    </div>

                    {/* Cash Payment Details */}
                    {paymentMethod === 'CASH' && (
                        <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                            <div className="grid grid-cols-2 gap-4 item">
                                <div>
                                    <Label htmlFor="paidAmount" className='text-base'>Pagato dal cliente</Label>
                                    <div className="relative mt-3">
                                        <Input
                                            id="paidAmount"
                                            type="text"
                                            placeholder="0.00"
                                            value={paidAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Allow only numbers, dot, and comma
                                                if (value === '' || /^[0-9.,]*$/.test(value)) {
                                                    // Check if it matches the pattern for valid amount
                                                    if (value === '' || /^[0-9]{0,4}([.,][0-9]{0,2})?$/.test(value)) {
                                                        setPaidAmount(value);
                                                        setValidationErrors(prev => ({ ...prev, paidAmount: undefined }));
                                                    }
                                                }
                                            }}
                                            className={`text-right pr-8 ${validationErrors.paidAmount ? 'border-red-500' : ''}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            €
                                        </span>
                                    </div>
                                    {validationErrors.paidAmount && (
                                        <p className="text-xs text-red-500 mt-1">{validationErrors.paidAmount}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                    <span className="text-base font-medium">Resto</span>
                                    <div className='w-full h-full flex place-content-end items-center'>
                                        <span className={`text-2xl font-bold ${calculateChange() >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                            {calculateChange().toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions row: empty cart (icon) + confirm order */}
                    <div className="flex items-center gap-2">
                        {/* Empty cart icon: always visible, disabled when cart is empty */}
                        <>
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
                                            onClick={() => {
                                                clearCart();
                                                setOpenClearDialog(false);
                                                toast.success('Carrello svuotato');
                                            }}
                                        >
                                            Svuota
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>

                        <TooltipProvider>
                            <Tooltip open={cart.length === 0 || !customer || (enableTableInput && !table) ? undefined : false}>
                                <TooltipTrigger asChild>
                                    <div className="flex-1">
                                        <Button
                                            className="w-full bg-amber-500 text-lg font-semibold hover:bg-amber-600"
                                            size="lg"
                                            onClick={confirmOrder}
                                            disabled={cart.length === 0 || !customer || (enableTableInput && !table)}
                                        >
                                            Crea Ordine
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {(cart.length === 0 || !customer || (enableTableInput && !table)) && (
                                    <TooltipContent side="top" className="max-w-xs">
                                        <div className="text-sm">{getOrderValidationMessage()}</div>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 disabled:cursor-not-allowed"
                            onClick={() => setOpenDiscountDialog(true)}
                            disabled={cart.length === 0}
                            aria-label="Applica sconto"
                            title="Applica sconto"
                        >
                            <Percent className="h-4 w-4 text-white" />
                        </Button>

                    </div>
                </div>
            </aside>

            {/* Daily Orders Sidebar - Sliding Panel */}
            {showDailyOrders && (
                <aside className="w-96 border-l flex flex-col bg-card h-screen animate-in">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold mb-4">Ordini Giornalieri</h2>

                        {/* Search Section */}
                        <div>
                            <Label htmlFor="searchQuery" className="mb-2">Cerca Ordine</Label>
                            <div className="mt-1">
                                <Input
                                    autoComplete='off'
                                    id="searchQuery"
                                    placeholder="Cerca per codice, tavolo o cliente..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 h-full overflow-y-auto">
                        <div className="p-4 space-y-3">
                            {dailyOrders.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    {loadingDailyOrders ? 'Caricamento ordini...' : 'Nessun ordine trovato per oggi'}
                                </div>
                            ) : (
                                dailyOrders
                                    .filter((order) => {
                                        if (!searchQuery.trim()) return true;
                                        const query = searchQuery.toLowerCase();
                                        return (
                                            order.displayCode.toLowerCase().includes(query) ||
                                            order.table.toLowerCase().includes(query) ||
                                            order.customer.toLowerCase().includes(query)
                                        );
                                    })
                                    .map((order) => (
                                        <Card key={order.id} className="border hover:border-amber-500 transition-colors">
                                            <CardContent className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-lg text-amber-600">
                                                                {order.displayCode}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                Tavolo {order.table}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium">{order.customer}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(order.createdAt).toLocaleString('it-IT', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-amber-600">
                                                            {parseFloat(order.subTotal).toFixed(2)} €
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => viewOrderDetail(order.displayCode)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Visualizza
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="flex-1 bg-amber-500 hover:bg-amber-600"
                                                        onClick={() => loadOrderToCart(order)}
                                                    >
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        Carica
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                            )}
                        </div>
                    </ScrollArea>
                </aside>
            )}

            {/* Edit Item Dialog */}
            <Dialog open={editingItem !== null
            } onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Modifica Prodotto</DialogTitle>
                        <DialogDescription>
                            <span className="text-sm text-muted-foreground">
                                {editingItem?.food.name}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <Label>Quantità con questa modifica</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={editQuantity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 1;
                                            setEditQuantity(Math.min(editingItem.quantity, Math.max(1, value)));
                                        }}
                                        className="text-center w-20"
                                        min="1"
                                        max={editingItem.quantity}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setEditQuantity(Math.min(editingItem.quantity, editQuantity + 1))}
                                        disabled={editQuantity >= editingItem.quantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Indica quante unità devono avere questa personalizzazione (max: {editingItem.quantity})
                                </p>
                            </div>

                            {/* Ingredients */}
                            {editingItem.food.ingredients && editingItem.food.ingredients.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Ingredienti</Label>
                                    <div className="space-y-3 max-h-75 overflow-y-auto border rounded-md p-3">
                                        {editingItem.food.ingredients.map((ingredient) => {
                                            const qty = ingredientQuantities[ingredient.id] ?? 1;
                                            return (
                                                <div key={ingredient.id} className="flex items-center justify-between">
                                                    <label className="text-sm font-medium">
                                                        {ingredient.name}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateIngredientQuantity(ingredient.id, -1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-medium">{qty}</span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateIngredientQuantity(ingredient.id, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Imposta la quantità degli ingredienti (0 = nessuno)
                                    </p>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Nota</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Aggiungi una nota per questo prodotto..."
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                        >
                            Annulla
                        </Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={saveEditedItem}
                        >
                            Salva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Discount Dialog */}
            <Dialog open={openDiscountDialog} onOpenChange={setOpenDiscountDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Applica Sconto</DialogTitle>
                        <DialogDescription>
                            Inserisci l'importo dello sconto da applicare al totale dell'ordine
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="discountAmount">Sconto (€)</Label>
                            <div className="relative">
                                <Input
                                    autoComplete='off'
                                    id="discountAmount"
                                    type="text"
                                    placeholder="0.00"
                                    value={discountAmount}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow only numbers, dot, and comma
                                        if (value === '' || /^[0-9.,]*$/.test(value)) {
                                            // Check if it matches the pattern for valid amount
                                            if (value === '' || /^[0-9]{0,4}([.,][0-9]{0,2})?$/.test(value)) {
                                                setDiscountAmount(value);
                                                setValidationErrors(prev => ({ ...prev, discount: undefined }));
                                            }
                                        }
                                    }}
                                    className={`text-right pr-8 ${validationErrors.discount ? 'border-red-500' : ''}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    €
                                </span>
                            </div>
                            {validationErrors.discount && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.discount}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Sconto massimo: 9999.99 €
                            </p>
                        </div>

                        {appliedDiscountAmount > 0 && (
                            <div className="rounded-lg border bg-muted/50 p-3">
                                <p className="text-sm text-muted-foreground mb-1">Sconto attualmente applicato:</p>
                                <p className="text-lg font-semibold text-amber-600">{appliedDiscountAmount.toFixed(2)} €</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setOpenDiscountDialog(false);
                                setDiscountAmount('');
                                setValidationErrors(prev => ({ ...prev, discount: undefined }));
                            }}
                        >
                            Annulla
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setAppliedDiscountAmount(0);
                                setDiscountAmount('');
                                setOpenDiscountDialog(false);
                                toast.success('Sconto rimosso');
                            }}
                        >
                            Rimuovi Sconto
                        </Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={applyDiscount}
                        >
                            Applica
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Order Detail Dialog */}
            <Dialog open={viewingOrderDetail !== null} onOpenChange={(open) => !open && setViewingOrderDetail(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Dettaglio Ordine {viewingOrderDetail?.displayCode}
                        </DialogTitle>
                        <DialogDescription>
                            Visualizza i dettagli completi dell'ordine
                        </DialogDescription>
                    </DialogHeader>
                    {loadingOrderDetail ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">Caricamento...</div>
                        </div>
                    ) : viewingOrderDetail ? (
                        <div className="space-y-4">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-medium">{viewingOrderDetail.customer}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tavolo</p>
                                    <p className="font-medium">{viewingOrderDetail.table}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Codice</p>
                                    <p className="font-mono font-bold text-amber-600">{viewingOrderDetail.displayCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Data</p>
                                    <p className="text-sm">
                                        {new Date(viewingOrderDetail.createdAt).toLocaleString('it-IT', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2">
                                <h4 className="font-semibold">Prodotti</h4>
                                <ScrollArea className='overflow-y-auto max-h-[500px]'>
                                    <div className="space-y-3">
                                        {viewingOrderDetail.categorizedItems.map((catItem: any, catIndex: number) => (
                                            <div key={catIndex}>
                                                <h5 className="text-sm font-semibold text-amber-600 mb-2">
                                                    {catItem.category.name}
                                                </h5>
                                                <div className="space-y-2">
                                                    {catItem.items.map((item: any, itemIndex: number) => (
                                                        <div key={itemIndex} className="flex items-start justify-between p-2 bg-muted/20 rounded">
                                                            <div className="flex-1">
                                                                <p className="font-medium">{item.food.name}</p>
                                                                {item.notes && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Note: {item.notes}
                                                                    </p>
                                                                )}
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    Quantità: {item.quantity} × {parseFloat(item.food.price).toFixed(2)} €
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold">
                                                                    {(item.quantity * parseFloat(item.food.price)).toFixed(2)} €
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <span className="text-lg font-semibold">Totale</span>
                                <span className="text-2xl font-bold text-amber-600">
                                    {parseFloat(viewingOrderDetail.subTotal).toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setViewingOrderDetail(null)}
                        >
                            Chiudi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
