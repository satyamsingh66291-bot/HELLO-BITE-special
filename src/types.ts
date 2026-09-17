export type DishCategory = 
  | 'Fast Food'
  | 'North Indian'
  | 'Snacks'
  | 'Beverages'
  | 'Sweets'
  | 'Tiffin Special';

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: DishCategory;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: string; // e.g. "15-20 mins"
  badge?: string; // e.g. "Bestseller", "Chef's Special", "Must Try"
  rating: number; // e.g. 4.8
  ratingCount: number;
}

export type TiffinPlanType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Full Day Combo';

export interface TiffinPlan {
  id: string;
  name: string;
  type: TiffinPlanType;
  description: string;
  mealsIncluded: string[];
  pricePerDay: number;
  priceWeekly: number; // 7 days with discount
  priceMonthly: number; // 30 days with discount
  image: string;
  caloriesApprox: string;
  tag?: string;
}

export interface DeliveryArea {
  id: string;
  name: string;
  charge: number; // in INR
  estimatedTime: string; // e.g. "20-30 mins"
}

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isVeg: boolean;
  isTiffin?: boolean;
  planDuration?: 'Daily' | 'Weekly (7 Days)' | 'Monthly (30 Days)';
}

export type OrderStatus = 'Pending' | 'Accepted' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'UPI QR / Online' | 'Card on Delivery';

export interface Coupon {
  id: string;
  code: string; // e.g. "FIRSTBITE"
  description: string;
  discountType: 'flat' | 'percentage' | 'free_delivery';
  discountValue: number; // in INR or percentage
  minOrderValue: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  landmark?: string;
  areaId: string;
  areaName: string;
  deliveryCharge: number;
  deliveryTip?: number; // Delivery partner tip
  couponApplied?: {
    code: string;
    discount: number;
  };
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: number;
  customerNotes?: string;
  isNewAlert?: boolean; // trigger loud audio alert on admin dashboard
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AdminSettings {
  contactPersonName: string;
  helplineNumber: string;
  adminPassword: string;
  enableAudioAlert: boolean;
  alertVolume: number; // 0.1 to 1.0
  whatsappNumber: string; // for direct WhatsApp notification redirect
  telegramBotToken?: string;
  telegramChatId?: string;
  areas: DeliveryArea[];
  coupons: Coupon[];
  firebaseConfig?: FirebaseConfig;
  useFirebaseCloud: boolean;
}
