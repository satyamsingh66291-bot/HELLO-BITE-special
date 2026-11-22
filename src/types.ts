export type DishCategory = 
  | 'Fast Food'
  | 'North Indian'
  | 'Snacks'
  | 'Beverages'
  | 'Sweets'
  | 'Tiffin Special';

export type KitchenStatus = 'open' | 'busy' | 'closed';

export type UserRole = 'Customer' | 'Rider' | 'Restaurant';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  id: string;
  uid?: string;
  phoneNumber: string;
  countryCode?: string;
  phone?: string;
  name: string;
  email?: string;
  profileImage?: string;
  role: UserRole | 'Admin';
  group: 'Signed-In Users' | 'VIP Foodies' | 'Tiffin Subscribers' | 'Delivery Partners' | 'Restaurant Partners';
  tags: string[];
  isVerified?: boolean;
  accountStatus?: 'active' | 'pending' | 'suspended';
  city?: string;
  createdAt: number;
  registeredAt?: number;
  lastLoginAt: number;
  savedAddresses?: {
    address: string;
    landmark?: string;
    coordinates?: { latitude: number; longitude: number };
  }[];
  orderCount?: number;
  totalOrders?: number;
}

export interface RiderRecord {
  userId: string;
  personalDetails: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    city: string;
    profilePhotoUrl?: string;
  };
  vehicleDetails: {
    vehicleType: 'Bike' | 'Scooter' | 'Cab';
    vehicleNumber: string;
    drivingLicenceNumber: string;
  };
  documents: {
    drivingLicenceUrl?: string;
    drivingLicenceFileName?: string;
    vehicleRcUrl?: string;
    vehicleRcFileName?: string;
  };
  approvalStatus: ApprovalStatus;
  availability: boolean;
  earnings: {
    today: number;
    total: number;
    deliveriesCount: number;
    acceptanceRate: number;
  };
  createdAt: number;
  updatedAt?: number;
}

export interface RestaurantRecord {
  restaurantId: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  restaurantName: string;
  address: string;
  city: string;
  foodCategories: string[];
  fssaiNumber: string;
  documents: {
    fssaiCertificateUrl?: string;
    fssaiFileName?: string;
    kitchenPhotoUrl?: string;
    kitchenFileName?: string;
  };
  approvalStatus: ApprovalStatus;
  isOpen: boolean;
  rating: number;
  prepTime: string;
  createdAt: number;
  updatedAt?: number;
}

export interface RideBooking {
  id: string;
  rideNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  vehicleType: 'Bike Taxi' | 'Auto' | 'Mini Cab';
  pickup: string;
  drop: string;
  distanceKm: number;
  fare: number;
  status: 'Searching Rider' | 'Rider Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: number;
}

export interface DynamicDeliveryFee {
  baseFee: number;
  perKmRate: number;
  distanceKm: number;
  calculatedFee: number;
  nearestHubName: string;
  nearestDistrict: 'Gopalganj' | 'Siwan';
  isServiceable: boolean;
  estimatedMinutes: string;
  isFree?: boolean;
}

export interface ItemCustomization {
  portion?: 'Regular' | 'Half' | 'Full';
  portionDelta?: number;
  addons?: { id: string; name: string; price: number }[];
  instructions?: string;
}

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
  preparationTime: string;
  badge?: string;
  rating: number;
  ratingCount: number;
  isFavorite?: boolean;
  restaurantId?: string;
  restaurantName?: string;
}

export type TiffinPlanType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Full Day Combo';

export interface TiffinPlan {
  id: string;
  name: string;
  type: TiffinPlanType;
  description: string;
  mealsIncluded: string[];
  pricePerDay: number;
  priceWeekly: number;
  priceMonthly: number;
  image: string;
  caloriesApprox: string;
  tag?: string;
}

export interface DeliveryArea {
  id: string;
  name: string;
  charge: number;
  estimatedTime: string;
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
  customization?: ItemCustomization;
}

export type OrderStatus = 
  | 'Order Placed - Pay Cash on Delivery'
  | 'Pending' 
  | 'Accepted' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'UPI QR / Online' | 'Card on Delivery';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percentage' | 'free_delivery';
  discountValue: number;
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
  deliveryDistanceKm?: number;
  deliveryTip?: number;
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
  isNewAlert?: boolean;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  locationVerified?: boolean;
  deliveryDistrict?: 'Gopalganj' | 'Siwan';
  riderInfo?: {
    name: string;
    phone: string;
    bikeNumber: string;
    currentStep: number;
  };
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
  alertVolume: number;
  whatsappNumber: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  areas: DeliveryArea[];
  coupons: Coupon[];
  firebaseConfig?: FirebaseConfig;
  useFirebaseCloud: boolean;
  kitchenStatus?: KitchenStatus;
  kitchenStatusNote?: string;
  baseDeliveryFee?: number;
  perKmRate?: number;
  kitchenHubName?: string;
  kitchenHubLat?: number;
  kitchenHubLng?: number;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  bikeNumber: string;
  isOnline: boolean;
  hub: 'Gopalganj Central Kitchen' | 'Siwan Express Hub';
  todayDeliveriesCount: number;
  todayCashCollected: number;
  todayTips: number;
}
