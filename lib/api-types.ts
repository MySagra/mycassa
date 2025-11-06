// API Types based on Swagger documentation

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    username: string;
    role: string;
  };
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ErrorResponse {
  message: string;
}

export interface User {
  id: number;
  username: string;
  role: {
    id: number;
    name: string;
  };
}

// Category Types
export interface Category {
  id: number;
  name: string;
  available: boolean;
  position: number;
}

// Food Types
export interface Food {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  available: boolean;
  category?: {
    id: number;
    name: string;
    available: boolean;
    position: number;
  };
  ingredients?: Ingredient[];
}

export interface Ingredient {
  id: string;
  name: string;
}

// Order Types
export interface OrderItem {
  foodId: string;
  quantity: number;
  notes?: string;
}

export interface CartItem {
  food: Food;
  quantity: number;
  notes?: string;
}

export interface OrderRequest {
  table: number;
  customer: string;
  orderItems: OrderItem[];
}

export interface OrderResponse {
  id: string;
  displayCode: string;
  table: string;
  customer: string;
  subTotal: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderItems: boolean;
}

export interface OrderDetailResponse {
  id: string;
  displayCode: string;
  table: string;
  customer: string;
  subTotal: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  categorizedItems: CategorizedItems[];
}

export interface CategorizedItems {
  category: {
    id: number;
    name: string;
  };
  items: OrderItemDetailed[];
}

export interface OrderItemDetailed {
  id: string;
  quantity: number;
  food: FoodWithIngredients;
}

export interface FoodWithIngredients {
  id: string;
  name: string;
  description?: string;
  price: string;
  available: boolean;
  ingredients?: Ingredient[];
}

// Confirm Order Types
export interface ConfirmOrderRequest {
  orderId: number;
  paymentMethod: PaymentMethod;
  discount?: number;
  surcharge?: number;
  orderItems: OrderItem[];
}

export interface ConfirmedOrderResponse {
  id: number;
  orderId: number;
  ticketNumber: number | null;
  status: 'CONFIRMED' | 'COMPLETED' | 'PICKED_UP';
  paymentMethod: PaymentMethod;
  discount: number;
  surcharge: number;
  total: number;
  confirmedAt: string;
}

// Payment Methods
export type PaymentMethod = 'CASH' | 'CARD';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  CATEGORIES: {
    ALL: '/v1/categories',
    AVAILABLE: '/v1/categories/available',
    BY_ID: (id: number) => `/v1/categories/${id}`,
  },
  FOODS: {
    ALL: '/v1/foods',
    AVAILABLE: '/v1/foods/available',
    BY_CATEGORY: (id: number) => `/v1/foods/available/categories/${id}`,
    BY_ID: (id: string) => `/v1/foods/${id}`,
  },
  ORDERS: {
    CREATE: '/v1/orders',
    ALL: '/v1/orders',
    BY_CODE: (code: string) => `/v1/orders/${code}`,
    TODAY: '/v1/orders/day/today',
    CONFIRM: '/v1/confirm-order',
  },
  USERS: '/v1/users',
  ROLES: '/v1/roles',
  INGREDIENTS: '/v1/ingredients',
  STATS: {
    TOTAL_ORDERS: '/v1/stats/total-orders',
    FOODS_ORDERED: '/v1/stats/foods-ordered',
    REVENUE: '/v1/stats/revenue',
  },
} as const;
