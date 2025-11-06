'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import apiClient from '@/lib/api-client';
import { Category, Food, CartItem, PaymentMethod, ConfirmOrderRequest, OrderDetailResponse } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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
    Download
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

export default function CassaPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const cartScrollRef = useRef<HTMLDivElement>(null);

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

        if (!table.trim()) {
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

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/v1/categories/available');

                // Sort categories by position before setting them
                const sortedCategories = response.data.sort((a: Category, b: Category) => a.position - b.position);
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
                const response = await apiClient.get('/v1/foods/available?include=ingredients');
                setFoods(response.data);
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
            return total + (price * item.quantity);
        }, 0);
        
    // Apply discount (fixed amount)
    const discountToApply = appliedDiscountAmount || 0;
    return Math.max(0, subtotal - discountToApply);
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
            const response = await apiClient.get<OrderDetailResponse>(`/v1/orders/${displayCode.toUpperCase()}`);
            const order = response.data;

            // Set customer and table
            setCustomer(order.customer);
            setTable(order.table);

            // Build cart from order items
            const cartItems: ExtendedCartItem[] = [];
            order.categorizedItems.forEach((catItem) => {
                catItem.items.forEach((item) => {
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
                        quantity: item.quantity
                    });
                });
            });

            setCart(cartItems);

            toast.success(`Ordine ${displayCode.toUpperCase()} caricato con successo`);
        } catch (error: any) {
            console.error('Error loading order:', error);
            toast.error(error.response?.data?.message || 'Impossibile caricare l\'ordine');
        } finally {
            setLoadingOrder(false);
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

    // Confirm order
    const confirmOrder = async () => {
        // Validate inputs with Zod
        const result = orderSchema.safeParse({ customer, table });

        if (!result.success) {
            const errors = result.error.issues.reduce((acc, issue) => {
                acc[issue.path[0] as 'customer' | 'table'] = issue.message;
                return acc;
            }, {} as { customer?: string; table?: string });

            setValidationErrors(errors);

            // Show first error
            const firstError = result.error.issues[0];
            toast.error(firstError.message);
            return;
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
            toast.error('Il carrello è vuoto');
            return;
        }

        try {
            let orderId: number | undefined;

            // If displayCode exists, load the order to confirm it
            if (displayCode.trim()) {
                const orderResponse = await apiClient.get<OrderDetailResponse>(`/v1/orders/${displayCode.toUpperCase()}`);
                orderId = parseInt(orderResponse.data.id);
            }

            const confirmRequest: ConfirmOrderRequest = {
                orderId: orderId!,
                paymentMethod,
                orderItems: cart.map((item) => ({
                    foodId: item.food.id,
                    quantity: item.quantity,
                    notes: item.notes,
                })),
            };

            await apiClient.post('/v1/confirm-order', confirmRequest);

            toast.success('L\'ordine è stato confermato con successo');

            clearCart();
        } catch (error: any) {
            console.error('Error confirming order:', error);
            toast.error(error.response?.data?.message || 'Impossibile confermare l\'ordine');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await logout();
        router.push('/login');
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
                            <Button variant="outline" size="icon" onClick={() => router.push('/impostazioni')}>
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
                        <div className="p-4">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Filter className="h-5 w-5" />
                                Categorie
                            </h2>
                        </div>

                        <ScrollArea className="h-[calc(100vh-8rem)]">
                            <div className="space-y-2.5 p-2">
                                <Button
                                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                                    className="w-full justify-start h-20"
                                    onClick={() => setSelectedCategoryId(null)}
                                >
                                    <div className='text-lg'>
                                        Tutte le categorie
                                    </div>
                                </Button>

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
                                        const itemTotal = (typeof item.food.price === 'number'
                                            ? item.food.price
                                            : parseFloat(item.food.price as unknown as string)) * item.quantity;

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
                            <Tooltip open={cart.length === 0 || !customer || !table ? undefined : false}>
                                <TooltipTrigger asChild>
                                    <div className="flex-1">
                                        <Button
                                            className="w-full bg-amber-500 text-lg font-semibold hover:bg-amber-600"
                                            size="lg"
                                            onClick={confirmOrder}
                                            disabled={cart.length === 0 || !customer || !table}
                                        >
                                            Crea Ordine
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {(cart.length === 0 || !customer || !table) && (
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
                            <div className="mt-1 space-y-2">
                                <Input
                                    id="searchQuery"
                                    placeholder="Cerca per codice, tavolo o cliente..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Button
                                    onClick={() => {
                                        // TODO: Implement fetch daily orders
                                        toast.info('Funzionalità in arrivo');
                                    }}
                                    className="w-full"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Recupera ordini di oggi
                                </Button>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {/* Placeholder content - qui andranno gli ordini */}
                            <div className="text-center text-muted-foreground py-8">
                                Nessun ordine trovato per oggi
                            </div>
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
                                    <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
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
        </div >
    );
}
