import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Dish, 
  CartItem, 
  Order, 
  DeliveryArea, 
  AdminSettings, 
  OrderStatus, 
  DishCategory,
  AppUser,
  DynamicDeliveryFee,
  ItemCustomization,
  RestaurantRecord,
  UserRole
} from './types';
import { storeService } from './services/storeService';
import { subscribeFirebaseAuthState } from './services/firebase';
import { audioAlert } from './utils/audioAlert';
import { 
  calculateDynamicDeliveryPricing, 
  GeoCoordinates, 
  GOPALGANJ_COORDS,
  KitchenHubConfig
} from './utils/geoUtils';
import { Navbar } from './components/Navbar';
import { PromoCarousel } from './components/PromoCarousel';
import { DishCard } from './components/DishCard';
import { DailyTiffinSection } from './components/DailyTiffinSection';
import { SpecialCartDrawer } from './components/SpecialCartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { CustomerOrderHistoryModal } from './components/CustomerOrderHistoryModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RiderDashboard } from './components/RiderDashboard';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { BottomNavBar, AppNavTab } from './components/BottomNavBar';
import { AppMoreModal } from './components/AppMoreModal';
import { PolicyModal, PolicyTab } from './components/PolicyModal';
import { AuthFlowModal } from './components/auth/AuthFlowModal';
import { RideBookingModal } from './components/RideBookingModal';
import { ItemCustomizeModal } from './components/ItemCustomizeModal';
import { GPSLocationModal } from './components/GPSLocationModal';
import { StickyCartBar } from './components/StickyCartBar';
import roleRideImg from './assets/images/role_ride_car_1794635220244.jpg';
import roleFoodImg from './assets/images/role_food_bowl_1794635221244.jpg';
import roleRestaurantImg from './assets/images/role_restaurant_store_1794635222037.jpg';
import welcomeFeastImg from './assets/images/hellobite_welcome_feast_1794635220422.jpg';
import promoPizzaImg from './assets/images/promo_pizza_banner_1794636850745.jpg';
import biryaniThumbImg from './assets/images/biryani_category_thumb_1794636851361.jpg';
import { 
  Utensils, 
  Sparkles, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Heart,
  Filter,
  Flame,
  Search,
  Bike,
  Car,
  Store,
  Star,
  Check,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Mail,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Store Data States
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(storeService.getSettings());
  const tiffinPlans = useMemo(() => storeService.getTiffinPlans(), []);

  // WhatsApp Authenticated User
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => storeService.getCurrentUser());
  const [whatsAppAuthModalOpen, setWhatsAppAuthModalOpen] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => storeService.getFavorites());

  // Customer Cart & Selection
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hellobite_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // GPS Coordinates & Dynamic Per-KM Pricing State
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(() => {
    try {
      const saved = localStorage.getItem('hellobite_gps_coords');
      return saved ? JSON.parse(saved) : { latitude: 26.4687, longitude: 84.4442 };
    } catch {
      return { latitude: 26.4687, longitude: 84.4442 };
    }
  });

  const [userAddressLabel, setUserAddressLabel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hellobite_gps_address');
      return saved || 'Gopalganj Town · Main Market';
    } catch {
      return 'Gopalganj Town · Main Market';
    }
  });

  const [gpsLocationModalOpen, setGpsLocationModalOpen] = useState(false);
  const [autoDetectGpsOnOpen, setAutoDetectGpsOnOpen] = useState(false);

  const kitchenHub: KitchenHubConfig = useMemo(() => ({
    name: settings.kitchenHubName || GOPALGANJ_COORDS.name,
    lat: Number.isFinite(Number(settings.kitchenHubLat))
      ? Number(settings.kitchenHubLat)
      : GOPALGANJ_COORDS.lat,
    lng: Number.isFinite(Number(settings.kitchenHubLng))
      ? Number(settings.kitchenHubLng)
      : GOPALGANJ_COORDS.lng,
  }), [settings.kitchenHubName, settings.kitchenHubLat, settings.kitchenHubLng]);

  // Calculate dynamic delivery pricing for current user coordinates
  const dynamicPricing = useMemo(() => {
    const coords = userCoords || { latitude: kitchenHub.lat, longitude: kitchenHub.lng };
    return calculateDynamicDeliveryPricing(
      coords,
      settings.baseDeliveryFee ?? 20,
      settings.perKmRate ?? 8,
      kitchenHub
    );
  }, [userCoords, settings.baseDeliveryFee, settings.perKmRate, kitchenHub]);

  // UI Filters
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Navigation
  const [activeNavTab, setActiveNavTab] = useState<AppNavTab>('home');
  const [appMoreOpen, setAppMoreOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isRiderView, setIsRiderView] = useState(false);
  const [isRiderAuthenticated, setIsRiderAuthenticated] = useState(false);
  const [isRestaurantView, setIsRestaurantView] = useState(false);
  const [isKitchenAuthenticated, setIsKitchenAuthenticated] = useState(false);
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>(() => storeService.getRestaurants());
  const [loginMode, setLoginMode] = useState<'admin' | 'rider' | 'kitchen'>('admin');
  const [customerOrderHistoryOpen, setCustomerOrderHistoryOpen] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Customization Modal State
  const [customizingDish, setCustomizingDish] = useState<Dish | null>(null);
  const [itemCustomizeModalOpen, setItemCustomizeModalOpen] = useState(false);

  // Tips & Coupons State
  const [deliveryTip, setDeliveryTip] = useState<number>(10);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  // Active Order Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);

  // Reorder Toast Notice
  const [reorderToast, setReorderToast] = useState<string | null>(null);

  // Legal, Privacy & Terms Policy Modal
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('privacy');

  const handleOpenPolicy = (tab: PolicyTab = 'privacy') => {
    setPolicyTab(tab);
    setPolicyModalOpen(true);
  };

  // Section Refs for smooth scrolling
  const menuRef = useRef<HTMLDivElement | null>(null);
  const tiffinRef = useRef<HTMLDivElement | null>(null);

  const scrollToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTiffin = () => {
    tiffinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Subscribe to real-time changes & Firebase Gmail Auth session persistence
  useEffect(() => {
    const unsubDishes = storeService.subscribeDishes((d) => setDishes(d));
    const unsubOrders = storeService.subscribeOrders((o) => {
      setOrders(o);
      const active = storeService.getActiveCustomerOrder();
      if (active) setActiveOrder(active);
    });
    const unsubSettings = storeService.subscribeSettings((s) => setSettings(s));
    const unsubUsers = storeService.subscribeCurrentUser((u) => setCurrentUser(u));
    const unsubFavs = storeService.subscribeFavorites((f) => setFavorites(f));
    const unsubRestaurants = storeService.subscribeRestaurants((r) => setRestaurants(r));

    const unsubFirebaseAuth = subscribeFirebaseAuthState((fbUser) => {
      if (fbUser) {
        const cached = storeService.getCurrentUser();
        if (!cached || (cached.uid !== fbUser.uid && cached.id !== fbUser.uid && cached.email !== fbUser.email)) {
          storeService.saveUserProfile({
            uid: fbUser.uid,
            phoneNumber: fbUser.phoneNumber
              ? fbUser.phoneNumber.replace(/\D/g, '').slice(-10)
              : cached?.phoneNumber || '0000000000',
            name:
              fbUser.displayName ||
              cached?.name ||
              (fbUser.email ? fbUser.email.split('@')[0] : 'Hello Bite User'),
            email: fbUser.email || cached?.email,
            profileImage: fbUser.photoURL || cached?.profileImage,
            role: cached?.role && cached.role !== 'Admin' ? cached.role : 'Customer',
            city: cached?.city || 'Gopalganj',
          }).catch(() => {});
        }
      }
    });

    const savedActive = storeService.getActiveCustomerOrder();
    if (savedActive) setActiveOrder(savedActive);

    // Optional stealth URL entry for internal staff portal (?portal=staff)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'staff') {
        setLoginMode('admin');
        setAdminLoginOpen(true);
      }
    }

    const handleGmpQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleGmpQuota);

    return () => {
      unsubDishes();
      unsubOrders();
      unsubSettings();
      unsubUsers();
      unsubFavs();
      unsubRestaurants();
      unsubFirebaseAuth();
      window.removeEventListener('gmp-quota-exceeded', handleGmpQuota);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hellobite_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Handle Cart Operations
  const handleAddToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dishId === dish.id && !item.customization);
      if (existing) {
        return prev.map((item) =>
          item.dishId === dish.id && !item.customization
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          image: dish.image,
          isVeg: dish.isVeg,
        },
      ];
    });
  };

  const handleAddCustomizedItemToCart = (item: CartItem) => {
    setCart((prev) => [item, ...prev]);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 }
    });
  };

  const handleUpdateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.dishId !== dishId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.dishId === dishId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleAddTiffinToCart = (tiffinItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.dishId === tiffinItem.dishId && i.planDuration === tiffinItem.planDuration
      );
      if (existing) {
        return prev.map((i) =>
          i.dishId === tiffinItem.dishId && i.planDuration === tiffinItem.planDuration
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [tiffinItem, ...prev];
    });
    setCartOpen(true);
  };

  // Toggle Favorite
  const handleToggleFavorite = (dishId: string) => {
    storeService.toggleFavorite(dishId);
  };

  // 1-Tap Quick Reorder
  const handleReorder = (items: CartItem[]) => {
    setCart(items);
    setReorderToast(`Loaded ${items.length} items from past order! Ready for checkout.`);
    setTimeout(() => setReorderToast(null), 4000);
    setCartOpen(true);
  };

  // Apply Promo Coupon from Banner
  const handleApplyPromoCode = (code: string) => {
    setAppliedCouponCode(code);
    const subtotal = cart.reduce((a, b) => a + b.price * b.quantity, 0);
    const matched = settings.coupons?.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (matched) {
      let disc = 0;
      if (matched.discountType === 'flat') {
        disc = matched.discountValue;
      } else if (matched.discountType === 'percentage') {
        disc = Math.round((subtotal * matched.discountValue) / 100);
        if (matched.maxDiscount) disc = Math.min(disc, matched.maxDiscount);
      } else if (matched.discountType === 'free_delivery') {
        disc = dynamicPricing.calculatedFee;
      }
      setAppliedDiscount(disc);
    }
    setCartOpen(true);
  };

  // Categories Filter List
  const categories = [
    'All',
    'Pure Veg',
    'Favorites',
    'North Indian',
    'Fast Food',
    'Tiffin Special',
    'Snacks',
    'Beverages',
    'Sweets'
  ];

  // Filter Dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (vegOnly && !dish.isVeg) return false;
      if (activeCategory === 'Pure Veg' && !dish.isVeg) return false;
      if (activeCategory === 'Favorites' && !favorites.includes(dish.id)) return false;
      if (
        activeCategory !== 'All' && 
        activeCategory !== 'Pure Veg' && 
        activeCategory !== 'Favorites' && 
        dish.category !== activeCategory
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description.toLowerCase().includes(q);
        const matchCat = dish.category.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [dishes, vegOnly, activeCategory, favorites, searchQuery]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Open item customization modal
  const handleOpenCustomizer = (dish: Dish) => {
    setCustomizingDish(dish);
    setItemCustomizeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#3D1C0A] flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
      {/* Admin Panel View */}
      {isAdminView && isAdminAuthenticated ? (
        <AdminDashboard
          onLogout={() => {
            setIsAdminAuthenticated(false);
            setIsAdminView(false);
          }}
          onBackToStore={() => setIsAdminView(false)}
          onOpenRider={() => {
            setIsAdminView(false);
            setIsRiderAuthenticated(true);
            setIsRiderView(true);
          }}
          dishes={dishes}
          orders={orders}
          settings={settings}
          onSaveDish={(dish) => storeService.saveDish(dish)}
          onDeleteDish={(id) => storeService.deleteDish(id)}
          onToggleDishStock={(id) => storeService.toggleDishAvailability(id)}
          onUpdateOrderStatus={(id, st) => storeService.updateOrderStatus(id, st)}
          onAcknowledgeAlert={(id) => storeService.acknowledgeOrderAlert(id)}
          onSaveSettings={(s) => storeService.saveSettings(s)}
          onResetDemoData={() => storeService.resetDemoData()}
          onDeleteOrder={(id) => storeService.deleteOrder(id)}
          onClearAllOrders={() => storeService.clearAllOrders()}
        />
      ) : isRiderView && (isRiderAuthenticated || currentUser?.role === 'Rider') ? (
        <RiderDashboard
          orders={orders}
          currentUser={currentUser}
          onBackToStore={() => setIsRiderView(false)}
          onOpenAdmin={() => {
            setIsRiderView(false);
            setLoginMode('admin');
            setAdminLoginOpen(true);
          }}
          onLogout={() => {
            setIsRiderAuthenticated(false);
            setIsRiderView(false);
          }}
        />
      ) : isRestaurantView && (isKitchenAuthenticated || currentUser?.role === 'Restaurant') ? (
        <RestaurantDashboard
          currentUser={currentUser}
          dishes={dishes}
          orders={orders}
          onBackToStore={() => setIsRestaurantView(false)}
          onSaveDish={(dish) => storeService.saveDish(dish)}
          onDeleteDish={(id) => storeService.deleteDish(id)}
          onToggleDishStock={(id) => storeService.toggleDishAvailability(id)}
          onUpdateOrderStatus={(id, st) => storeService.updateOrderStatus(id, st)}
          onLogout={() => {
            storeService.logoutCurrentUser();
            setCurrentUser(null);
            setIsKitchenAuthenticated(false);
            setIsRestaurantView(false);
          }}
        />
      ) : (
        <>
          {/* Case A: Google Maps Platform Quota Exceeded Sticky Amber Banner */}
          {gmpQuotaExceeded && (
            <div
              role="alert"
              className="sticky top-0 z-50 bg-amber-100 border-b border-amber-300 text-amber-950 px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-xs"
            >
              <span>
                Google Maps API quota exceeded.{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-amber-950"
                >
                  Resolve Quota Error
                </a>
              </span>
              <button
                type="button"
                onClick={() => setGmpQuotaExceeded(false)}
                className="font-bold px-2 py-0.5 rounded-lg hover:bg-amber-200/70 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
          {/* Reorder Notification Toast */}
          {reorderToast && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-orange-500 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{reorderToast}</span>
            </div>
          )}

          {/* Clean Swiggy / Zomato Header (Free of Developer strings / Debug clutter) */}
          <Navbar
            currentAddressLabel={userAddressLabel}
            onOpenLocationPicker={() => setGpsLocationModalOpen(true)}
            cartCount={cartCount}
            cartTotal={cartSubtotal}
            onOpenCart={() => setCartOpen(true)}
            currentUser={currentUser}
            onOpenAuth={() => setWhatsAppAuthModalOpen(true)}
            onOpenOrders={() => setCustomerOrderHistoryOpen(true)}
            activeOrder={activeOrder}
            onOpenOrderTracker={() => setOrderSuccessModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            favoriteCount={favorites.length}
            onOpenFavorites={() => setActiveCategory('Favorites')}
            kitchenStatus={settings.kitchenStatus}
            kitchenStatusNote={settings.kitchenStatusNote}
            onOpenAdmin={() => {
              setLoginMode('admin');
              setAdminLoginOpen(true);
            }}
          />

          {/* Main App Container */}
          <main className="max-w-7xl mx-auto px-3 sm:px-6 w-full flex-1 pb-24 pt-2">
            {/* Welcome / Gmail Sign-In Strip when signed out */}
            {!currentUser && (
              <div className="mb-3 bg-white rounded-2xl p-3 border border-orange-200/80 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <strong className="font-display font-black text-xs sm:text-sm text-[#3D1C0A] block truncate">
                      Sign in with Gmail · Fast Ordering &amp; Live Maps
                    </strong>
                    <span className="text-[11px] text-[#7C4A22] block truncate">
                      Save your delivery pin &amp; track live orders
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsAppAuthModalOpen(true)}
                  id="home-gmail-get-started-btn"
                  className="bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-xs px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Role Partner Banner if signed in as Rider or Restaurant */}
            {(currentUser?.role === 'Rider' || currentUser?.role === 'Restaurant') && (
              <div className="mb-3 bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 text-xs">
                  {currentUser.role === 'Rider' ? (
                    <Bike className="w-5 h-5 shrink-0" />
                  ) : (
                    <Store className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <strong className="font-black block">
                      Signed in as {currentUser.role} Partner ({currentUser.name})
                    </strong>
                    <span className="text-[11px] text-orange-100">
                      Switch back to your live {currentUser.role} workspace anytime
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser.role === 'Rider') {
                      setIsRiderView(true);
                    } else {
                      setIsRestaurantView(true);
                    }
                  }}
                  className="bg-white text-[#FF6B00] font-black text-xs px-3.5 py-2 rounded-xl shrink-0 cursor-pointer shadow-xs"
                >
                  Open Dashboard →
                </button>
              </div>
            )}

            {/* Promotional Banner Carousel (Screen 4: Flat 50% OFF / FIRSTBITE / HELLOFREE) */}
            <PromoCarousel
              onApplyCoupon={handleApplyPromoCode}
              onExploreTiffin={scrollToTiffin}
              onExploreFood={scrollToMenu}
              appliedCouponCode={appliedCouponCode}
            />

            {/* Screen 4: Circular Food Category Strip (Pizza, Burger, Biryani, Thali, More) */}
            <section className="mt-4">
              <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-2xl mx-auto">
                {[
                  {
                    label: 'Pizza',
                    img: promoPizzaImg,
                    onClick: () => {
                      setActiveCategory('Fast Food');
                      setSearchQuery('Pizza');
                      scrollToMenu();
                    },
                  },
                  {
                    label: 'Burger',
                    img: welcomeFeastImg,
                    onClick: () => {
                      setActiveCategory('Fast Food');
                      setSearchQuery('Burger');
                      scrollToMenu();
                    },
                  },
                  {
                    label: 'Biryani',
                    img: biryaniThumbImg,
                    onClick: () => {
                      setActiveCategory('All');
                      setSearchQuery('Biryani');
                      scrollToMenu();
                    },
                  },
                  {
                    label: 'Thali',
                    img: roleFoodImg,
                    onClick: () => {
                      setActiveCategory('Tiffin Special');
                      setSearchQuery('');
                      scrollToTiffin();
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-white border-2 border-orange-100 group-hover:border-[#FF6B00] shadow-sm overflow-hidden transition-all">
                      <img
                        src={item.img}
                        alt={item.label}
                        className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#3D1C0A] group-hover:text-[#FF6B00]">
                      {item.label}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                    scrollToMenu();
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-orange-100 group-hover:border-[#FF6B00] shadow-sm flex items-center justify-center text-[#3D1C0A] group-hover:text-[#FF6B00] transition-all">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#3D1C0A] group-hover:text-[#FF6B00]">
                    More
                  </span>
                </button>
              </div>
            </section>

            {/* Ride at Your Fingertips Super-App Banner Card (Screen 4) */}
            <div className="mt-4 bg-linear-to-r from-white via-[#FFF8F0] to-[#FFEDD5] rounded-3xl p-4 sm:p-5 border border-orange-200/80 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <h3 className="font-display font-black text-lg sm:text-xl text-[#3D1C0A] leading-tight">
                  Ride at Your Fingertips
                </h3>
                <p className="text-xs text-[#7C4A22] max-w-md">
                  Book Bike Taxis, Autos &amp; Mini Cabs across Gopalganj &amp; Siwan in 3 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setRideModalOpen(true)}
                  id="home-book-ride-btn"
                  className="mt-1 bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Book Ride</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <img
                src={roleRideImg}
                alt="Hello Bite Ride Booking"
                className="w-28 h-20 sm:w-36 sm:h-24 rounded-2xl object-cover shrink-0 border border-orange-200 shadow-xs"
              />
            </div>

            {/* Screen 4: Top Restaurants Showcase (Local Gopalganj & Siwan Kitchens + Approved Partners) */}
            <section className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-black text-lg text-[#3D1C0A] flex items-center gap-2">
                  <span>Top Restaurants</span>
                </h2>
                <button
                  type="button"
                  onClick={scrollToMenu}
                  className="text-xs font-extrabold text-[#FF6B00] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>See All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {[
                  {
                    id: 'hub_gopalganj',
                    name: 'Gopalganj Central Kitchen',
                    time: '20-25 min',
                    rating: 4.8,
                    img: roleRestaurantImg,
                    categoryFilter: 'North Indian',
                  },
                  {
                    id: 'hub_siwan',
                    name: 'Siwan Express Pizza & Grill',
                    time: '25-30 min',
                    rating: 4.6,
                    img: promoPizzaImg,
                    categoryFilter: 'Fast Food',
                  },
                  {
                    id: 'hub_royal_biryani',
                    name: 'Royal Biryani & Tiffin House',
                    time: '20-30 min',
                    rating: 4.7,
                    img: biryaniThumbImg,
                    categoryFilter: 'Tiffin Special',
                  },
                  ...restaurants
                    .filter((r) => r.approvalStatus === 'approved')
                    .map((rest) => ({
                      id: rest.restaurantId,
                      name: rest.restaurantName,
                      time: rest.prepTime || '25-35 min',
                      rating: rest.rating || 4.8,
                      img: rest.documents?.kitchenPhotoUrl || roleFoodImg,
                      categoryFilter: rest.foodCategories[0] || 'All',
                    })),
                ].map((kitchen) => (
                  <button
                    key={kitchen.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory(
                        categories.includes(kitchen.categoryFilter)
                          ? kitchen.categoryFilter
                          : 'All'
                      );
                      scrollToMenu();
                    }}
                    className="min-w-[155px] sm:min-w-[190px] text-left bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-xs hover:border-[#FF6B00] transition-all shrink-0 cursor-pointer group"
                  >
                    <div className="h-24 w-full overflow-hidden relative">
                      <img
                        src={kitchen.img}
                        alt={kitchen.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-display font-black text-xs sm:text-sm text-[#3D1C0A] truncate">
                        {kitchen.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7C4A22] font-semibold mt-0.5">
                        <span>{kitchen.time}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 font-extrabold text-[#3D1C0A]">
                          {kitchen.rating}
                          <Star className="w-3 h-3 fill-[#FF6B00] text-[#FF6B00]" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Daily Tiffin Section (Insulated Hot Meals Service) */}
            <div ref={tiffinRef}>
              <DailyTiffinSection
                plans={tiffinPlans}
                onAddTiffinToCart={handleAddTiffinToCart}
              />
            </div>

            {/* Menu Header, Search Results & Filter Controls */}
            <section ref={menuRef} className="mt-8 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl sm:text-2xl text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Explore Gourmet Menu</span>
                    <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full">
                      {filteredDishes.length} Items
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Freshly cooked on-order with 100% pure butter &amp; hygiene in Gopalganj &amp; Siwan
                  </p>
                </div>

                {/* Veg Toggle Switch */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-2xl border border-stone-200/80 shadow-xs">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-stone-800">Pure Veg Only</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={vegOnly}
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      vegOnly ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        vegOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category Filter Pills (Swiggy / Zomato style) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
                {categories.map((cat) => {
                  const isSelected = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-102'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                      }`}
                    >
                      {cat === 'Favorites' ? `❤️ Favorites (${favorites.length})` : cat}
                    </button>
                  );
                })}
              </div>

              {/* Dishes Grid */}
              {filteredDishes.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 my-4 shadow-xs">
                  <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-3">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-stone-800 text-base">No dishes found</h3>
                  <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
                    No matching food items in &ldquo;{activeCategory}&rdquo;. Try clearing your search query or selecting another category.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setVegOnly(false);
                      setSearchQuery('');
                    }}
                    className="mt-4 bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredDishes.map((dish) => {
                    const cartItem = cart.find((i) => i.dishId === dish.id && !i.customization);
                    const qty = cartItem ? cartItem.quantity : 0;
                    const isFav = favorites.includes(dish.id);

                    return (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        cartQuantity={qty}
                        isFavorite={isFav}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateCartQuantity}
                        onOpenCustomizer={handleOpenCustomizer}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* Sticky Bottom Cart Bar (Swiggy / Zomato style) */}
          <StickyCartBar
            cartCount={cartCount}
            cartTotal={cartSubtotal}
            onOpenCart={() => setCartOpen(true)}
          />

          {/* App-Style Bottom Navigation Bar */}
          <BottomNavBar
            activeTab={activeNavTab}
            onSelectTab={setActiveNavTab}
            activeOrder={activeOrder}
            onOpenOrders={() => {
              if (activeOrder) {
                setOrderSuccessModalOpen(true);
              } else {
                setCustomerOrderHistoryOpen(true);
              }
            }}
            onOpenRide={() => setRideModalOpen(true)}
            onOpenMore={() => setAppMoreOpen(true)}
            onScrollToHome={() => {
              setActiveNavTab('home');
              scrollToHome();
            }}
            onScrollToTiffin={() => {
              setActiveNavTab('tiffin');
              scrollToTiffin();
            }}
          />
        </>
      )}

      {/* Cart Drawer */}
      <SpecialCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        currentAddressLabel={userAddressLabel}
        dynamicDeliveryCharge={dynamicPricing.calculatedFee}
        deliveryDistanceKm={dynamicPricing.distanceKm}
        baseDeliveryFee={settings.baseDeliveryFee ?? 20}
        perKmRate={settings.perKmRate ?? 8}
        onOpenLocationPicker={() => {
          setCartOpen(false);
          setGpsLocationModalOpen(true);
        }}
        coupons={settings.coupons}
        deliveryTip={deliveryTip}
        onUpdateTip={setDeliveryTip}
        appliedCouponCode={appliedCouponCode}
        onProceedCheckout={(data) => {
          setDeliveryTip(data.tip);
          setAppliedDiscount(data.discount);
          setAppliedCouponCode(data.couponCode);
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal (With Dynamic Per-KM GPS Pricing and COD) */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart}
        currentUser={currentUser}
        initialCoords={userCoords}
        initialAddressLabel={userAddressLabel}
        onOrderPlaced={(order) => {
          setCart([]);
          try {
            localStorage.removeItem('hellobite_cart');
          } catch {
            // ignore
          }
          setActiveOrder(order);
          setOrderSuccessModalOpen(true);
        }}
        deliveryTip={deliveryTip}
        discount={appliedDiscount}
        couponCode={appliedCouponCode}
        adminSettings={{
          helplineName: settings.contactPersonName,
          helplineNumber: settings.helplineNumber,
          whatsappNumber: settings.whatsappNumber,
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId,
          baseDeliveryFee: settings.baseDeliveryFee ?? 20,
          perKmRate: settings.perKmRate ?? 8,
          kitchenHub
        }}
        onOpenPolicy={handleOpenPolicy}
      />

      {/* GPS Location & Dynamic Per-KM Pricing Modal (Google Maps) */}
      <GPSLocationModal
        isOpen={gpsLocationModalOpen}
        onClose={() => {
          setGpsLocationModalOpen(false);
          setAutoDetectGpsOnOpen(false);
        }}
        currentCoords={userCoords}
        currentAddressLabel={userAddressLabel}
        baseDeliveryFee={settings.baseDeliveryFee ?? 20}
        perKmRate={settings.perKmRate ?? 8}
        kitchenHub={kitchenHub}
        autoDetectOnOpen={autoDetectGpsOnOpen}
        onLocationDetected={(coords, addressLabel) => {
          setUserCoords(coords);
          setUserAddressLabel(addressLabel);
          try {
            localStorage.setItem('hellobite_gps_coords', JSON.stringify(coords));
            localStorage.setItem('hellobite_gps_address', addressLabel);
          } catch {
            // ignore
          }
          if (currentUser) {
            storeService.updateUserLocation(currentUser.id || currentUser.phoneNumber, {
              address: addressLabel,
              coordinates: { latitude: coords.latitude, longitude: coords.longitude }
            });
          }
        }}
        onLocationConfirmed={(data) => {
          setUserCoords(data.coords);
          setUserAddressLabel(data.addressLabel);
          setAutoDetectGpsOnOpen(false);
          try {
            localStorage.setItem('hellobite_gps_coords', JSON.stringify(data.coords));
            localStorage.setItem('hellobite_gps_address', data.addressLabel);
          } catch {
            // ignore
          }
          if (currentUser) {
            storeService.updateUserLocation(currentUser.id || currentUser.phoneNumber, {
              address: data.addressLabel,
              landmark: data.landmark,
              coordinates: { latitude: data.coords.latitude, longitude: data.coords.longitude }
            });
          }
          setReorderToast(`Delivery location set: ${data.addressLabel}`);
          setTimeout(() => setReorderToast(null), 3500);
        }}
      />

      {/* Hello Bite Authentication & Profile Flow */}
      <AuthFlowModal
        isOpen={whatsAppAuthModalOpen}
        onClose={() => setWhatsAppAuthModalOpen(false)}
        currentUser={currentUser}
        onOpenInteractiveMap={() => setGpsLocationModalOpen(true)}
        onAuthComplete={({ user, coords, addressLabel, openPartnerPortal }) => {
          setCurrentUser(user);
          if (coords && addressLabel) {
            setUserCoords(coords);
            setUserAddressLabel(addressLabel);
            try {
              localStorage.setItem('hellobite_gps_coords', JSON.stringify(coords));
              localStorage.setItem('hellobite_gps_address', addressLabel);
            } catch {
              // ignore
            }
          }
          if (openPartnerPortal === 'Rider') {
            setIsRiderAuthenticated(true);
            setIsRiderView(true);
            setIsRestaurantView(false);
          } else if (openPartnerPortal === 'Restaurant') {
            setIsRestaurantView(true);
            setIsRiderView(false);
          }
        }}
        onOpenPartnerDashboard={(role: UserRole) => {
          if (role === 'Rider') {
            setIsRiderAuthenticated(true);
            setIsRiderView(true);
            setIsRestaurantView(false);
          } else if (role === 'Restaurant') {
            setIsRestaurantView(true);
            setIsRiderView(false);
          }
        }}
        onLogout={() => {
          storeService.logoutCurrentUser();
          setCurrentUser(null);
          setIsRiderView(false);
          setIsRestaurantView(false);
        }}
      />

      {/* Quick Ride Booking Super-App Modal */}
      <RideBookingModal
        isOpen={rideModalOpen}
        onClose={() => setRideModalOpen(false)}
        currentUser={currentUser}
        pickupLabel={userAddressLabel}
        onRequireAuth={() => setWhatsAppAuthModalOpen(true)}
      />

      {/* Item Customization & Modifier Modal */}
      <ItemCustomizeModal
        isOpen={itemCustomizeModalOpen}
        onClose={() => setItemCustomizeModalOpen(false)}
        dish={customizingDish}
        onAddToCart={handleAddCustomizedItemToCart}
      />

      {/* Live Order Tracking Modal */}
      <OrderSuccessModal
        isOpen={orderSuccessModalOpen}
        order={activeOrder}
        onClose={() => setOrderSuccessModalOpen(false)}
        onDismissActiveOrder={() => {
          storeService.clearActiveCustomerOrder();
          setActiveOrder(null);
        }}
        onReorder={handleReorder}
        helplineName={settings.contactPersonName}
        helplineNumber={settings.helplineNumber}
        whatsappNumber={settings.whatsappNumber}
        kitchenHub={kitchenHub}
      />

      {/* Past Orders History Modal */}
      <CustomerOrderHistoryModal
        isOpen={customerOrderHistoryOpen}
        onClose={() => setCustomerOrderHistoryOpen(false)}
        orders={orders}
        onTrackOrder={(ord) => {
          setActiveOrder(ord);
          setOrderSuccessModalOpen(true);
        }}
        onReorder={handleReorder}
        onExploreMenu={() => {
          setActiveNavTab('home');
          scrollToMenu();
        }}
      />

      {/* Hidden Staff Portal Login Modal (Opened via 5-tap logo gesture or ?portal=staff) */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        initialMode={loginMode}
        onLoginSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsAdminView(true);
          setIsRiderView(false);
          setIsRestaurantView(false);
          setAdminLoginOpen(false);
        }}
        onRiderLoginSuccess={() => {
          setIsRiderAuthenticated(true);
          setIsRiderView(true);
          setIsAdminView(false);
          setIsRestaurantView(false);
          setAdminLoginOpen(false);
        }}
        onKitchenLoginSuccess={() => {
          setIsKitchenAuthenticated(true);
          setIsRestaurantView(true);
          setIsAdminView(false);
          setIsRiderView(false);
          setAdminLoginOpen(false);
        }}
        validPassword={settings.adminPassword}
        helplineName={settings.contactPersonName}
        helplineNumber={settings.helplineNumber}
      />

      {/* Profile, Policies & Helpline Bottom Sheet */}
      <AppMoreModal
        isOpen={appMoreOpen}
        onClose={() => setAppMoreOpen(false)}
        settings={settings}
        currentUser={currentUser}
        currentAddressLabel={userAddressLabel}
        onOpenAuth={() => setWhatsAppAuthModalOpen(true)}
        onLogout={() => {
          storeService.logoutCurrentUser();
          setCurrentUser(null);
        }}
        onOpenOrderHistory={() => {
          setAppMoreOpen(false);
          setCustomerOrderHistoryOpen(true);
        }}
        onOpenLocationPicker={() => setGpsLocationModalOpen(true)}
        onOpenPolicy={handleOpenPolicy}
      />

      {/* Legal Policy Modal (Privacy Policy, Terms of Service, Refund Policy, Grievance Contact) */}
      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialTab={policyTab}
      />
    </div>
  );
}
