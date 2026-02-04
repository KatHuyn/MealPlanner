// User models
export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  healthProfile?: HealthProfile;
}

// Health Profile
export interface HealthProfile {
  id: number;
  userId: number;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  allergies?: string;
  healthConditions?: string;
  dietaryPreferences?: string;
  goals?: string;
}

export interface HealthProfileRequest {
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  allergies?: string;
  healthConditions?: string;
  dietaryPreferences?: string;
  goals?: string;
}

// Product
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  quantityInStock: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  keywords?: string;
}

// Meal Plan
export interface MealPlan {
  id: number;
  userId: number;
  userRequest?: string;
  planDate: Date;
  createdAt: Date;
  meals: Meal[];
  totalPrice?: number;
  totalCost?: number; // Tổng tiền từ API
}

export interface Meal {
  id: number;
  mealPlanId: number;
  mealType: MealType;
  dishName: string;
  recipe?: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  ingredients: MealPlanIngredient[];
}

export enum MealType {
  Breakfast = 1,
  Lunch = 2,
  Dinner = 3,
  Snack = 4
}

export interface MealPlanIngredient {
  id: number;
  mealId: number;
  productId?: number;
  ingredientName: string;
  quantity: number;
  unit?: string;
  notes?: string;
  isMatched: boolean;
  product?: Product;
}

// AI Request/Response
export interface MealPlanRequest {
  userRequest: string;
  planDate?: Date;
}

export interface AIMealPlanResponse {
  mealPlan: MealPlan;
  totalPrice: number;
  unmatchedIngredients: string[];
  suggestedProducts: Product[];
}

export interface Order {
  id: number;
  userId: number;
  mealPlanId?: number;
  orderCode: string;
  status: OrderStatus | string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  discountAmount?: number;
  shippingFee?: number;
  finalAmount: number;
  shippingAddress?: string;
  receiverPhone?: string;
  receiverName?: string;
  notes?: string;
  orderDate: Date;
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  orderItems: OrderItem[];
  items?: OrderItem[]; // API returns 'items' instead of 'orderItems'
  paymentMethod?: string; // COD or BankTransfer
}

export enum OrderStatus {
  Pending = 0,
  Confirmed = 1,
  Processing = 2,
  Shipped = 3,
  Delivered = 4,
  Cancelled = 5
}

export enum PaymentStatus {
  Pending = 0,
  Paid = 1,
  Failed = 2,
  Refunded = 3
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceAtOrder: number;
  totalPrice: number;
  product?: Product;
}

export interface CreateOrderRequest {
  mealPlanId?: number;
  shippingAddress: string;
  receiverPhone: string;
  receiverName: string;
  notes?: string;
  paymentMethod?: string; // COD or BankTransfer
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

// Chat
export interface ChatMessage {
  id: number;
  userId: number;
  userMessage: string;
  aiResponse?: string;
  mealPlanId?: number;
  createdAt: Date;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Cart Item
export interface CartItem {
  product: Product;
  quantity: number;
}
