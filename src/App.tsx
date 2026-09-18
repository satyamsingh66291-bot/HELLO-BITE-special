import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dish, 
  CartItem, 
  Order, 
  DeliveryArea, 
  AdminSettings, 
  OrderStatus, 
  DishCategory 
} from './types';
import { storeService } from './services/storeService';
import { audioAlert } from './utils/audioAlert';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { DishCard } from './components/DishCard';
import { DailyTiffinSection } from './components/DailyTiffinSection';
import { SpecialCartDrawer } from './components/SpecialCartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { CustomerOrderHistoryModal } from './components/CustomerOrderHistoryModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNavBar, AppNavTab } from './components/BottomNavBar';
import { AppMoreModal } from './components/AppMoreModal';
import { 
  Utensils, 
  Sparkles, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Heart,
  Filter,
  Flame
} from 'lucide-react';

export default function App() {
  // Store Data States
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(storeService.getSettings());
  const tiffinPlans = useMemo(() => storeService.getTiffinPlans(), []);

  // Customer Cart & Selection
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hellobite_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedArea, setSelectedArea] = useState<DeliveryArea>(() => {
    const s = storeService.getSettings();
    return s.areas[0] || { id: 'area_1', name: 'Local Area (0-3 km)', charge: 20, estimatedTime: '20-25 mins' };
  });

  // UI Filters
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Navigation
  const [activeNavTab, setActiveNavTab] = useState<AppNavTab>('menu');
  const [appMoreOpen, setAppMoreOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [customerOrderHistoryOpen, setCustomerOrderHistoryOpen] = useState(false);

  // Tips & Coupons State
  const [deliveryTip, setDeliveryTip] = useState<number>(10);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);

  // Active Order Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubDishes = storeService.subscribeDishes((d) => setDishes(d));
    const unsubOrders = storeService.subscribeOrders((o) => {
      setOrders(o);
      // Keep active customer order updated
      const active = storeService.getActiveCustomerOrder();
      if (active) setActiveOrder(active);
    });

    // Check saved customer active order
    const savedActive = storeService.getActiveCustomerOrder();
    if (savedActive) setActiveOrder(savedActive);

    return () => {
      unsubDishes();
      unsubOrders();
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
      const existing = prev.find((item) => item.dishId === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dishId === dish.id
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
      const existing = prev.find((item) => item.dishId === tiffinItem.dishId);
      if (existing) {
        return prev.map((item) =>
          item.dishId === tiffinItem.dishId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, tiffinItem];
    });
    setCartOpen(true);
  };

  // Cart total items count
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filter dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesCategory =
        activeCategory === 'All' ? true : dish.category === activeCategory;
      const matchesVeg = vegOnly ? dish.isVeg : true;
      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesVeg && matchesSearch;
    });
  }, [dishes, activeCategory, vegOnly, searchQuery]);

  // Categories list
  const categories = [
    'All',
    'Fast Food',
    'North Indian',
    'Snacks',
    'Beverages',
    'Sweets',
  ];

  // Admin Actions
  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setAdminLoginOpen(false);
    setIsAdminView(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminView(false);
    audioAlert.stopContinuousAlert();
  };

  const handleSaveDish = (dish: Dish) => {
    storeService.saveDish(dish);
  };

  const handleDeleteDish = (dishId: string) => {
    storeService.deleteDish(dishId);
  };

  const handleToggleDishStock = (dishId: string) => {
    storeService.toggleDishAvailability(dishId);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    storeService.updateOrderStatus(orderId, status);
  };

  const handleAcknowledgeAlert = (orderId?: string) => {
    storeService.acknowledgeOrderAlert(orderId);
  };

  const handleSaveSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    storeService.saveSettings(newSettings);
  };

  const handleResetDemoData = () => {
    storeService.resetDemoData();
    setSettings(storeService.getSettings());
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
    setOrderSuccessModalOpen(true);
  };

  const handleDismissActiveOrder = () => {
    setActiveOrder(null);
    setOrderSuccessModalOpen(false);
    storeService.clearActiveCustomerOrder();
  };

  const scrollToTiffin = () => {
    const el = document.getElementById('daily-tiffin-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* RENDER ADMIN VIEW IF AUTHENTICATED & TOGGLED */}
      {isAdminView && isAdminAuthenticated ? (
        <AdminDashboard
          onLogout={handleAdminLogout}
          onBackToStore={() => setIsAdminView(false)}
          dishes={dishes}
          orders={orders}
          settings={settings}
          onSaveDish={handleSaveDish}
          onDeleteDish={handleDeleteDish}
          onToggleDishStock={handleToggleDishStock}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onSaveSettings={handleSaveSettings}
          onResetDemoData={handleResetDemoData}
          onDeleteOrder={(orderId) => storeService.deleteOrder(orderId)}
          onClearAllOrders={() => storeService.clearAllOrders()}
        />
      ) : (
        /* ================= CUSTOMER FOOD DELIVERY VIEW ================= */
        <div className="flex flex-col min-h-screen">
          {/* Main Top Header Navbar */}
          <Navbar
            areas={settings.areas}
            selectedArea={selectedArea}
            onSelectArea={setSelectedArea}
            cartCount={cartCount}
            onOpenCart={() => setCartOpen(true)}
            onOpenAdmin={() => {
              if (isAdminAuthenticated) {
                setIsAdminView(true);
              } else {
                setAdminLoginOpen(true);
              }
            }}
            activeOrder={activeOrder}
            onOpenOrderTracker={() => setOrderSuccessModalOpen(true)}
            onDismissActiveOrder={handleDismissActiveOrder}
            onOpenOrderHistory={() => setCustomerOrderHistoryOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            helplineName={settings.contactPersonName}
            helplineNumber={settings.helplineNumber}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pb-32 sm:pb-24">
            {/* High-Converting Hero Banner */}
            <HeroBanner
              onScrollToTiffin={scrollToTiffin}
              onExploreDishes={scrollToMenu}
              helplineNumber={settings.helplineNumber}
              helplineName={settings.contactPersonName}
            />

            {/* Daily Tiffin Service Section (MANDATORY REQUIREMENT) */}
            <DailyTiffinSection
              plans={tiffinPlans}
              onAddTiffinToCart={handleAddTiffinToCart}
            />

            {/* Dynamic Menu Section */}
            <section id="menu-section" className="py-6">
              {/* Section Title & Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>Explore Our Sizzling Menu</span>
                    <Flame className="w-5 h-5 text-orange-600" />
                  </h2>
                  <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                    Fresh ingredients, authentic spices, and made fresh to order.
                  </p>
                </div>

                {/* Veg Toggle Switch */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs self-start md:self-auto">
                  <span className="text-xs font-bold text-stone-700">Veg Only</span>
                  <button
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
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

              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-orange-600 text-white shadow-sm scale-102'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              {filteredDishes.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 my-4">
                  <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-stone-800 text-base">No dishes found</h3>
                  <p className="text-stone-500 text-xs mt-1">
                    Try changing your category filter or search query.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setVegOnly(false);
                      setSearchQuery('');
                    }}
                    className="mt-4 bg-stone-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredDishes.map((dish) => {
                    const cartItem = cart.find((i) => i.dishId === dish.id);
                    const qty = cartItem ? cartItem.quantity : 0;

                    return (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        cartQuantity={qty}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateCartQuantity}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* Floating Mini Cart Pill sitting cleanly above Bottom Navigation Bar */}
          {cartCount > 0 && !cartOpen && (
            <aside 
              aria-label="Active cart summary"
              className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px)+8px)] inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-4 duration-200"
            >
              <button
                onClick={() => {
                  setActiveNavTab('cart');
                  setCartOpen(true);
                }}
                id="floating-cart-pill-btn"
                className="w-full bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-between shadow-xl shadow-orange-950/20 active:scale-98 border border-orange-400/30 backdrop-blur-md cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="bg-white text-orange-600 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                  <div className="text-left">
                    <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
                      <span>₹{cart.reduce((a, b) => a + b.price * b.quantity, 0)}</span>
                      <span className="text-[10px] text-orange-100 font-normal">| {cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="text-[10px] text-orange-100/90 font-medium leading-none">
                      Tap to review &amp; place order
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider transition-colors">
                  <span>View Cart</span>
                  <span className="text-sm">→</span>
                </div>
              </button>
            </aside>
          )}

          {/* Native App-Style Bottom Navigation Bar (Optimized for Median Web-to-App) */}
          <BottomNavBar
            activeTab={activeNavTab}
            onSelectTab={setActiveNavTab}
            cartCount={cartCount}
            cartTotal={cart.reduce((a, b) => a + b.price * b.quantity, 0)}
            activeOrder={activeOrder}
            onOpenCart={() => {
              setActiveNavTab('cart');
              setCartOpen(true);
            }}
            onOpenOrders={() => {
              setActiveNavTab('orders');
              if (activeOrder) {
                setOrderSuccessModalOpen(true);
              } else {
                setCustomerOrderHistoryOpen(true);
              }
            }}
            onOpenMore={() => {
              setActiveNavTab('more');
              setAppMoreOpen(true);
            }}
            onScrollToMenu={() => {
              setActiveNavTab('menu');
              scrollToMenu();
            }}
            onScrollToTiffin={() => {
              setActiveNavTab('tiffin');
              scrollToTiffin();
            }}
          />

          {/* Footer with Helpline Details */}
          <footer className="bg-stone-900 text-white mt-12 border-t border-stone-800 pb-20 sm:pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-lg">
                      HB
                    </div>
                    <span className="font-display font-extrabold text-xl">
                      Hello<span className="text-orange-500">Bite</span>
                    </span>
                  </div>
                  <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
                    Premium mobile-first food delivery and daily wholesome tiffin service. Delivered piping hot to your doorstep with guaranteed taste and safety.
                  </p>
                </div>

                <div>
                  <h4 className="font-display font-extrabold text-sm text-stone-200 uppercase tracking-wider mb-3">
                    24/7 Helpline &amp; Operations
                  </h4>
                  <div className="space-y-2 text-xs text-stone-400">
                    <p>
                      <strong>Contact Person:</strong> {settings.contactPersonName}
                    </p>
                    <p>
                      <strong>Helpline Number:</strong>{' '}
                      <a
                        href={`tel:${settings.helplineNumber}`}
                        className="text-orange-400 font-bold hover:underline"
                      >
                        {settings.helplineNumber}
                      </a>
                    </p>
                    <p>
                      <strong>Operating Hours:</strong> 7:00 AM – 11:30 PM (All 7 Days)
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-extrabold text-sm text-stone-200 uppercase tracking-wider mb-3">
                    Quick Access
                  </h4>
                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => setAdminLoginOpen(true)}
                      className="text-stone-400 hover:text-orange-400 block transition-colors"
                    >
                      Admin Portal &amp; Kitchen Login
                    </button>
                    <button
                      onClick={scrollToTiffin}
                      className="text-stone-400 hover:text-orange-400 block transition-colors"
                    >
                      Daily Tiffin Subscription Plans
                    </button>
                    <p className="text-stone-500 text-[11px] pt-2">
                      Optimized for Vercel SPA deployment with zero 404 routing errors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-800 text-center text-stone-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>© {new Date().getFullYear()} Hello Bite Express. All rights reserved.</span>
                <span>Crafted with love by Satyam Singh Kitchen &amp; Ops Team</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Special Cart Drawer */}
      <SpecialCartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        areas={settings.areas}
        selectedArea={selectedArea}
        onSelectArea={setSelectedArea}
        coupons={settings.coupons || []}
        deliveryTip={deliveryTip}
        onUpdateTip={setDeliveryTip}
        onProceedCheckout={(checkoutData) => {
          setDeliveryTip(checkoutData.tip);
          setAppliedDiscount(checkoutData.discount);
          setAppliedCouponCode(checkoutData.couponCode);
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cart}
        selectedArea={selectedArea}
        areas={settings.areas}
        onSelectArea={setSelectedArea}
        onOrderPlaced={handleOrderPlaced}
        deliveryTip={deliveryTip}
        discount={appliedDiscount}
        couponCode={appliedCouponCode}
        adminSettings={{
          helplineName: settings.contactPersonName,
          helplineNumber: settings.helplineNumber,
          whatsappNumber: settings.whatsappNumber,
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId,
        }}
      />

      {/* Order Success & Live Tracker Modal */}
      <OrderSuccessModal
        isOpen={orderSuccessModalOpen}
        order={activeOrder}
        onClose={() => setOrderSuccessModalOpen(false)}
        onDismissActiveOrder={handleDismissActiveOrder}
        helplineName={settings.contactPersonName}
        helplineNumber={settings.helplineNumber}
      />

      {/* Customer Order History Modal (User Request: customer order history hona chaiye) */}
      <CustomerOrderHistoryModal
        isOpen={customerOrderHistoryOpen}
        onClose={() => setCustomerOrderHistoryOpen(false)}
        orders={orders}
        onTrackOrder={(order) => {
          setActiveOrder(order);
          setCustomerOrderHistoryOpen(false);
          setOrderSuccessModalOpen(true);
        }}
        onReorder={(items) => {
          setCart(items);
          setCustomerOrderHistoryOpen(false);
          setCartOpen(true);
        }}
        onExploreMenu={() => {
          setCustomerOrderHistoryOpen(false);
          scrollToMenu();
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        validPassword={settings.adminPassword}
        helplineName={settings.contactPersonName}
        helplineNumber={settings.helplineNumber}
      />

      {/* App More / Support / Admin Sheet */}
      <AppMoreModal
        isOpen={appMoreOpen}
        onClose={() => {
          setAppMoreOpen(false);
          setActiveNavTab('menu');
        }}
        settings={settings}
        onOpenAdmin={() => {
          if (isAdminAuthenticated) {
            setIsAdminView(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenOrderHistory={() => setCustomerOrderHistoryOpen(true)}
        areas={settings.areas}
      />
    </div>
  );
}
