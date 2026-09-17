import { Dish, TiffinPlan, DeliveryArea, AdminSettings, Coupon } from '../types';

export const INITIAL_AREAS: DeliveryArea[] = [
  { id: 'area_1', name: 'Local Area (0-3 km)', charge: 20, estimatedTime: '20-25 mins' },
  { id: 'area_2', name: 'Near Suburbs (3-7 km)', charge: 40, estimatedTime: '30-40 mins' },
  { id: 'area_3', name: 'City Outskirts (7-12 km)', charge: 60, estimatedTime: '45-55 mins' },
  { id: 'area_4', name: 'Highway Hub / Extended (12+ km)', charge: 80, estimatedTime: '55-65 mins' }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon_1',
    code: 'FIRSTBITE',
    description: 'Flat ₹50 OFF on orders above ₹199',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 199,
    isActive: true
  },
  {
    id: 'coupon_2',
    code: 'HELLOFREE',
    description: 'Free delivery on orders above ₹149',
    discountType: 'free_delivery',
    discountValue: 0,
    minOrderValue: 149,
    isActive: true
  },
  {
    id: 'coupon_3',
    code: 'BITE100',
    description: 'Flat ₹100 OFF on orders above ₹399',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 399,
    isActive: true
  },
  {
    id: 'coupon_4',
    code: 'SPECIAL15',
    description: '15% OFF up to ₹80 on orders above ₹250',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 250,
    maxDiscount: 80,
    isActive: true
  }
];

export const INITIAL_SETTINGS: AdminSettings = {
  contactPersonName: 'SATYAM SINGH',
  helplineNumber: '7091472879',
  adminPassword: '9771264784',
  enableAudioAlert: true,
  alertVolume: 0.85,
  whatsappNumber: '917091472879',
  telegramBotToken: '',
  telegramChatId: '',
  areas: INITIAL_AREAS,
  coupons: INITIAL_COUPONS,
  useFirebaseCloud: false
};

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'dish_1',
    name: 'Butter Paneer Masala & Lachha Paratha Combo',
    description: 'Cottage cheese cubes simmered in rich creamy tomato and butter gravy served with 2 crispy layered lachha parathas and mint chutney.',
    price: 249,
    originalPrice: 299,
    category: 'North Indian',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '20-25 mins',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: 384
  },
  {
    id: 'dish_2',
    name: 'Dal Makhani Special Bowl with Jeera Rice',
    description: 'Slow-cooked black lentils overnight in churned butter and fresh cream, served hot with aromatic cumin spiced basmati rice.',
    price: 199,
    originalPrice: 249,
    category: 'North Indian',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '15-20 mins',
    badge: 'Chef Choice',
    rating: 4.8,
    ratingCount: 290
  },
  {
    id: 'dish_3',
    name: 'Crispy Cheese Burst Veg Burger',
    description: 'Crisp golden veggie patty topped with molten cheddar cheese burst, caramelized onions, crisp lettuce and secret tangy bite sauce.',
    price: 149,
    originalPrice: 179,
    category: 'Fast Food',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '15 mins',
    badge: 'Popular',
    rating: 4.7,
    ratingCount: 520
  },
  {
    id: 'dish_4',
    name: 'Paneer Tikka Loaded Pizza (10-inch)',
    description: 'Handcrafted sourdough base topped with char-grilled spicy paneer cubes, capsicum, red paprika, and 100% real mozzarella cheese.',
    price: 329,
    originalPrice: 399,
    category: 'Fast Food',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '25 mins',
    badge: 'Must Try',
    rating: 4.9,
    ratingCount: 412
  },
  {
    id: 'dish_5',
    name: 'Peri-Peri French Fries Bucket',
    description: 'Jumbo cut crisp potato fries generously tossed in fiery African peri-peri herb blend with creamy cheesy garlic dip.',
    price: 119,
    originalPrice: 139,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '10-12 mins',
    badge: 'Crunchy',
    rating: 4.6,
    ratingCount: 680
  },
  {
    id: 'dish_6',
    name: 'Mumbai Pav Bhaji with Extra Buttered Pav',
    description: 'Thick spicy mash of vegetables prepared on a flat griddle topped with a big dollop of Amul butter, served with soft toasted pavs.',
    price: 169,
    originalPrice: 199,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '15 mins',
    badge: 'Street Hit',
    rating: 4.8,
    ratingCount: 310
  },
  {
    id: 'dish_7',
    name: 'Royal Kesariya Thandai & Cold Coffee Frappe',
    description: 'Choice of aromatic saffron-almond enriched chilled Thandai or creamy blended espresso cold coffee with chocolate drizzle.',
    price: 99,
    originalPrice: 129,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '5-10 mins',
    badge: 'Refreshing',
    rating: 4.9,
    ratingCount: 245
  },
  {
    id: 'dish_8',
    name: 'Hot Gulab Jamun with Rabri (2 Pcs)',
    description: 'Traditional khoya dumplings dipped in saffron cardamom rose sugar syrup, served warm over chilled dense malai rabri.',
    price: 129,
    originalPrice: 159,
    category: 'Sweets',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '5 mins',
    badge: 'Sweet Tooth',
    rating: 5.0,
    ratingCount: 430
  },
  {
    id: 'dish_9',
    name: 'Spicy Veg Hakka Noodles & Manchurian Combo',
    description: 'Wok-tossed thin noodles with crunchy julienne veggies, garlic, green chilies paired with veg Manchurian balls in rich soya gravy.',
    price: 219,
    originalPrice: 269,
    category: 'Fast Food',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    isVeg: true,
    isAvailable: true,
    preparationTime: '20 mins',
    badge: 'Hot Pick',
    rating: 4.7,
    ratingCount: 360
  }
];

export const INITIAL_TIFFIN_PLANS: TiffinPlan[] = [
  {
    id: 'tiffin_breakfast',
    name: 'Healthy Morning Breakfast Tiffin',
    type: 'Breakfast',
    description: 'Wholesome hot Indian breakfast prepared fresh every dawn with minimal oil and homemade flavors.',
    mealsIncluded: ['2 Stuffed Aloo/Paneer Paratha or Poha/Idli Sambar', 'Fresh Curd / Chutney', 'Boiled Sprouts Salad', 'Hot Tea / Milk Sachet'],
    pricePerDay: 89,
    priceWeekly: 580, // save ₹43
    priceMonthly: 2350, // save ₹320
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    caloriesApprox: '450-520 kcal',
    tag: 'Energizing Start'
  },
  {
    id: 'tiffin_lunch',
    name: 'Executive North Indian Lunch Thali',
    type: 'Lunch',
    description: 'Complete home-style nourishing lunch packed in insulated 4-container hot stainless tiffin.',
    mealsIncluded: ['Paneer / Seasonal Green Sabzi', 'Special Dal Tadka / Makhani', '4 Fresh Phulkas (with Ghee)', 'Steamed Basmati Rice', 'Fresh Salad, Pickle & Papad'],
    pricePerDay: 139,
    priceWeekly: 899,
    priceMonthly: 3650,
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    caloriesApprox: '680-750 kcal',
    tag: 'Bestseller Tiffin'
  },
  {
    id: 'tiffin_dinner',
    name: 'Light & Comforting Dinner Tiffin',
    type: 'Dinner',
    description: 'Easy-to-digest soothing home-cooked dinner for peaceful sleep and high nutrition.',
    mealsIncluded: ['Homestyle Yellow Moong Dal', 'Aloo Gobi / Bhindi Do Pyaza', '4 Soft Phulkas', 'Jeera Rice / Khichdi Option', 'Raita & Roasted Papad'],
    pricePerDay: 129,
    priceWeekly: 840,
    priceMonthly: 3390,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    caloriesApprox: '580-640 kcal',
    tag: 'Homestyle Comfort'
  },
  {
    id: 'tiffin_fullday',
    name: 'Full Day Student & Working Pro Combo',
    type: 'Full Day Combo',
    description: 'All 3 meals delivered straight to your room or office doorstep at exact meal times.',
    mealsIncluded: ['Hot Breakfast (8:00 AM)', 'Executive Lunch (1:00 PM)', 'Comfort Dinner (8:30 PM)', 'Special Sunday Sweet treat included!'],
    pricePerDay: 320,
    priceWeekly: 2090,
    priceMonthly: 8400,
    image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
    caloriesApprox: '1800-2000 kcal / day',
    tag: 'Maximum Savings'
  }
];
