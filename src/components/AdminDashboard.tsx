import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  Volume2, 
  VolumeX, 
  UtensilsCrossed, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Bike, 
  XCircle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Edit3, 
  Trash2, 
  Flame, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Check,
  RotateCcw,
  Tag,
  HeartHandshake,
  TrendingUp,
  BarChart3,
  Users,
  MessageCircle,
  Share2,
  Store,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { Dish, Order, AdminSettings, DeliveryArea, OrderStatus, Coupon, AppUser, KitchenStatus, RiderRecord, RestaurantRecord } from '../types';
import { audioAlert } from '../utils/audioAlert';
import { DishModal } from './DishModal';
import { FirebaseGuideModal } from './FirebaseGuideModal';
import { CouponManager } from './CouponManager';
import { getWhatsAppOrderUrl } from '../utils/notifications';
import { storeService } from '../services/storeService';

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToStore: () => void;
  dishes: Dish[];
  orders: Order[];
  settings: AdminSettings;
  onSaveDish: (dish: Dish) => void;
  onDeleteDish: (dishId: string) => void;
  onToggleDishStock: (dishId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAcknowledgeAlert: (orderId?: string) => void;
  onSaveSettings: (settings: AdminSettings) => void;
  onResetDemoData: () => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearAllOrders?: () => void;
  onOpenRider?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onBackToStore,
  onOpenRider,
  dishes,
  orders,
  settings,
  onSaveDish,
  onDeleteDish,
  onToggleDishStock,
  onUpdateOrderStatus,
  onAcknowledgeAlert,
  onSaveSettings,
  onResetDemoData,
  onDeleteOrder,
  onClearAllOrders
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'coupons' | 'users' | 'partners' | 'settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [menuCategory, setMenuCategory] = useState<string>('All');
  const [userSearch, setUserSearch] = useState<string>('');
  const [users, setUsers] = useState<AppUser[]>(() => storeService.getUsers());
  const [riders, setRiders] = useState<RiderRecord[]>(() => storeService.getRiders());
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>(() => storeService.getRestaurants());

  // Modal States
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Settings Local State & Kitchen Status
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [kitchenStatus, setKitchenStatusState] = useState<KitchenStatus>(settings.kitchenStatus || 'open');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Sound States
  const [isAlerting, setIsAlerting] = useState(false);
  const [soundVolume, setSoundVolume] = useState(settings.alertVolume);

  // Subscribe to live users, riders & restaurants
  useEffect(() => {
    const unsubUsers = storeService.subscribeUsers((u) => setUsers(u));
    const unsubRiders = storeService.subscribeRiders((r) => setRiders(r));
    const unsubRestaurants = storeService.subscribeRestaurants((rest) => setRestaurants(rest));
    return () => {
      unsubUsers();
      unsubRiders();
      unsubRestaurants();
    };
  }, []);

  const handleSetKitchenStatus = (status: KitchenStatus) => {
    setKitchenStatusState(status);
    storeService.setKitchenStatus(status);
    setLocalSettings(prev => ({ ...prev, kitchenStatus: status }));
  };

  // Check if any order requires new order alert
  const pendingAlertOrders = orders.filter(
    o => o.isNewAlert && (o.status === 'Pending' || o.status === 'Order Placed - Pay Cash on Delivery')
  );

  useEffect(() => {
    if (pendingAlertOrders.length > 0 && settings.enableAudioAlert) {
      setIsAlerting(true);
      audioAlert.startContinuousAlert();
    } else {
      setIsAlerting(false);
      audioAlert.stopContinuousAlert();
    }

    return () => {
      audioAlert.stopContinuousAlert();
    };
  }, [pendingAlertOrders.length, settings.enableAudioAlert]);

  const handleStopAlert = () => {
    audioAlert.stopContinuousAlert();
    setIsAlerting(false);
    onAcknowledgeAlert();
  };

  const handleTestChime = () => {
    audioAlert.playChimeOnce(soundVolume);
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    audioAlert.setVolume(vol);
    setLocalSettings(prev => ({ ...prev, alertVolume: vol }));
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = 
      orderFilter === 'All' ? true :
      orderFilter === 'Active' ? ['Order Placed - Pay Cash on Delivery', 'Pending', 'Accepted', 'Out for Delivery'].includes(order.status) :
      orderFilter === 'Pending' ? ['Order Placed - Pay Cash on Delivery', 'Pending'].includes(order.status) :
      orderFilter === 'COD' ? order.status === 'Order Placed - Pay Cash on Delivery' || order.paymentMethod === 'Cash on Delivery' :
      order.status === orderFilter;

    const matchesSearch = 
      order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.phone.includes(orderSearch) ||
      order.orderNumber.includes(orderSearch);

    return matchesFilter && matchesSearch;
  });

  // Filter dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = menuCategory === 'All' || dish.category === menuCategory;
    const matchesSearch = 
      dish.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      dish.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* ⚠️ CONTINUOUS LOUD AUDIO ALERT WARNING BANNER (MANDATORY REQUIREMENT) */}
      {(isAlerting || pendingAlertOrders.length > 0) && (
        <div 
          id="admin-new-order-alert-banner"
          className="bg-red-600 text-white px-4 py-3 shadow-xl border-b-2 border-red-800 flex flex-wrap items-center justify-between gap-3 animate-warning-banner sticky top-0 z-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-chime-ring shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display font-black text-base sm:text-lg tracking-wide uppercase flex items-center gap-2">
                <span>⚠️ NEW ORDER RECEIVED!</span>
                <span className="bg-white text-red-700 text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  {pendingAlertOrders.length} New
                </span>
              </div>
              <p className="text-xs text-red-100">
                Loud chime alert sounding. Acknowledge and dispatch to kitchen immediately!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStopAlert}
              id="admin-stop-alert-btn"
              className="bg-white text-red-700 hover:bg-red-50 font-black px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <VolumeX className="w-4 h-4" />
              <span>Acknowledge &amp; Stop Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Admin Navbar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-md">
              HB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg sm:text-xl leading-tight">
                  Hello Bite Admin Panel
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ● Live Sync
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Helpline: <strong className="text-orange-400">{settings.helplineNumber}</strong> ({settings.contactPersonName})
              </p>
            </div>
          </div>

          {/* Kitchen Status Controls & Navigation Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Restaurant Kitchen Status Switcher */}
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl text-xs border border-stone-700">
              <span className="text-[10px] font-bold text-stone-400 px-1.5 uppercase hidden sm:inline">
                Kitchen:
              </span>
              <button
                type="button"
                onClick={() => handleSetKitchenStatus('open')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  kitchenStatus === 'open' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ● Open
              </button>
              <button
                type="button"
                onClick={() => handleSetKitchenStatus('busy')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  kitchenStatus === 'busy' 
                    ? 'bg-amber-500 text-stone-950 shadow-xs' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ● Busy
              </button>
              <button
                type="button"
                onClick={() => handleSetKitchenStatus('closed')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  kitchenStatus === 'closed' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ● Closed
              </button>
            </div>

            <button
              onClick={handleTestChime}
              title="Test loud chime alarm"
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-700 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Test Chime</span>
            </button>

            <button
              onClick={onBackToStore}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden md:inline">Customer Store</span>
            </button>

            {onOpenRider && (
              <button
                onClick={onOpenRider}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-750 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Switch to Delivery Partner (Rider) Dashboard"
              >
                <Bike className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Rider View</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="bg-red-950/70 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-800/50 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 sm:gap-4 overflow-x-auto border-t border-stone-800 pt-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Live Orders</span>
            {orders.filter(o => o.status === 'Pending' || o.status === 'Order Placed - Pay Cash on Delivery').length > 0 && (
              <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {orders.filter(o => o.status === 'Pending' || o.status === 'Order Placed - Pay Cash on Delivery').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'menu'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu &amp; Stock ({dishes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            id="admin-nav-users-tab"
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            id="admin-nav-partners-tab"
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'partners'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Partners &amp; Approvals ({riders.length + restaurants.length})</span>
            {(riders.filter(r => r.approvalStatus === 'pending').length + restaurants.filter(r => r.approvalStatus === 'pending').length) > 0 && (
              <span className="bg-amber-500 text-stone-950 text-[10px] px-1.5 rounded-full font-black">
                {riders.filter(r => r.approvalStatus === 'pending').length + restaurants.filter(r => r.approvalStatus === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            id="admin-nav-coupons-tab"
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'coupons'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Coupons &amp; Offers ({(settings.coupons || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings &amp; Firebase</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-6 flex-1">
        {/* ======================= TAB 1: LIVE ORDERS ======================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Real-time Sales Revenue Banner (User Requirement: Accurate Live Sales Calculation) */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-display font-extrabold text-lg text-stone-900">
                      Live Store Sales &amp; Revenue Overview
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Accurate real-time total computed directly from every order in the Firebase / local database (no dummy or hardcoded numbers).
                  </p>
                </div>

                {onClearAllOrders && orders.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all orders? This will permanently delete test orders.')) {
                        onClearAllOrders();
                      }
                    }}
                    className="text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 self-start md:self-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Orders History</span>
                  </button>
                )}
              </div>

              {/* 5-Column Accurate Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
                {/* 1. Total Gross Sales */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                    Total Kitna Bika Hai (Gross)
                  </div>
                  <div className="font-display font-black text-2xl text-emerald-600 mt-1">
                    ₹{orders.filter(o => o.status !== 'Cancelled').reduce((a, b) => a + b.total, 0)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Live from {orders.filter(o => o.status !== 'Cancelled').length} valid orders
                  </div>
                </div>

                {/* 2. Delivered Revenue */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                    Delivered &amp; Collected
                  </div>
                  <div className="font-display font-black text-2xl text-stone-900 mt-1">
                    ₹{orders.filter(o => o.status === 'Delivered').reduce((a, b) => a + b.total, 0)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {orders.filter(o => o.status === 'Delivered').length} orders completed
                  </div>
                </div>

                {/* 3. Delivery Partner Tips */}
                <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-200/80">
                  <div className="text-orange-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
                    <span>Rider Tips Collected</span>
                  </div>
                  <div className="font-display font-black text-2xl text-orange-700 mt-1">
                    ₹{orders.reduce((a, b) => a + (b.deliveryTip || 0), 0)}
                  </div>
                  <div className="text-[10px] text-orange-600/80 mt-0.5">
                    100% for Delivery Partners
                  </div>
                </div>

                {/* 4. Active & Pending Orders */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Kitchen Active</span>
                  </div>
                  <div className="font-display font-black text-2xl text-orange-600 mt-1">
                    {orders.filter(o => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Out for Delivery').length}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {orders.filter(o => o.status === 'Pending').length} awaiting accept
                  </div>
                </div>

                {/* 5. Dishes & Tiffins Sold */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 col-span-2 sm:col-span-1">
                  <div className="text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                    Total Items Sold
                  </div>
                  <div className="font-display font-black text-2xl text-stone-900 mt-1">
                    {orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Across all customer carts
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {['All', 'Pending', 'COD', 'Active', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      orderFilter === st
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search Orders */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, phone, ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-stone-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
                <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">No orders in this view</h3>
                <p className="text-stone-500 text-xs mt-1">
                  When customers place food or tiffin orders, they will appear here in real-time with an audible loud chime.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const whatsappLink = getWhatsAppOrderUrl(order, order.phone);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                        order.status === 'Pending'
                          ? 'border-orange-400 ring-2 ring-orange-200/60'
                          : 'border-stone-200'
                      }`}
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-display font-extrabold text-base sm:text-lg text-stone-900">
                            #{order.orderNumber}
                          </span>
                          <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            order.status === 'Order Placed - Pay Cash on Delivery' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black' :
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            order.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>

                          {/* GPS Location Verified Badge */}
                          {order.locationVerified && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>GPS Verified ({order.deliveryDistrict || 'Gopalganj/Siwan'})</span>
                            </span>
                          )}

                          {/* Delivery Partner Tip Highlight Badge */}
                          {Boolean(order.deliveryTip && order.deliveryTip > 0) && (
                            <span className="bg-orange-100 text-orange-900 border border-orange-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
                              <span>Rider Tip: ₹{order.deliveryTip}</span>
                            </span>
                          )}

                          {/* Coupon Applied Badge */}
                          {order.couponApplied && (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Tag className="w-3 h-3 text-emerald-600" />
                              <span>{order.couponApplied.code} (-₹{order.couponApplied.discount || order.discount})</span>
                            </span>
                          )}

                          <span className="text-xs text-stone-400">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Customer Quick Contact Tools */}
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${order.phone}`}
                            className="text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-orange-600" />
                            <span>Call {order.phone}</span>
                          </a>

                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>

                          {onDeleteOrder && (
                            <button
                              onClick={() => {
                                if (confirm(`Permanently delete order #${order.orderNumber}?`)) {
                                  onDeleteOrder(order.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                        {/* Column 1: Customer & Address */}
                        <div className="space-y-1">
                          <div className="font-bold text-stone-900 text-sm">{order.customerName}</div>
                          <div className="text-stone-600 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <span>{order.address} {order.landmark ? `(Near: ${order.landmark})` : ''}</span>
                          </div>
                          <div className="text-stone-500 font-medium">
                            Zone: <strong className="text-stone-800">{order.areaName}</strong> (Delivery Fee: ₹{order.deliveryCharge})
                          </div>
                          {order.customerNotes && (
                            <div className="text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                              <strong>Note:</strong> &quot;{order.customerNotes}&quot;
                            </div>
                          )}
                        </div>

                        {/* Column 2: Items Ordered */}
                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-1">
                          <div className="font-bold text-stone-700 text-[11px] uppercase tracking-wider mb-1">
                            Items ({order.items.reduce((a, b) => a + b.quantity, 0)}):
                          </div>
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-stone-800">
                              <span>{it.name} <strong className="text-orange-600">x{it.quantity}</strong></span>
                              <span className="font-semibold">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Column 3: Payment & Grand Total */}
                        <div className="space-y-1 md:text-right">
                          <div className="text-stone-500">Subtotal: ₹{order.subtotal} | Tax: ₹{order.tax}</div>
                          <div className="text-stone-500">Delivery Fee: ₹{order.deliveryCharge}</div>
                          {Boolean(order.deliveryTip && order.deliveryTip > 0) && (
                            <div className="text-orange-700 font-bold">
                              Delivery Partner Tip: +₹{order.deliveryTip}
                            </div>
                          )}
                          {Boolean(order.discount && order.discount > 0) && (
                            <div className="text-emerald-700 font-bold">
                              Coupon Discount: -₹{order.discount}
                            </div>
                          )}
                          <div className="text-base font-extrabold text-stone-900 pt-1 border-t border-stone-100">
                            Grand Total: <span className="text-orange-600 font-display">₹{order.total}</span>
                          </div>
                          <div className="inline-block bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-bold text-[11px]">
                            {order.paymentMethod}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Workflow Action Buttons */}
                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-stone-400">
                          Update status to sync with customer tracker in real-time:
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(order.status === 'Pending' || order.status === 'Order Placed - Pay Cash on Delivery') && (
                            <button
                              onClick={() => {
                                onUpdateOrderStatus(order.id, 'Accepted');
                                audioAlert.stopContinuousAlert();
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept &amp; Send to Kitchen</span>
                            </button>
                          )}

                          {order.status === 'Accepted' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Out for Delivery')}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Dispatch (Out for Delivery)</span>
                            </button>
                          )}

                          {order.status === 'Out for Delivery' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Delivered')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark as Delivered</span>
                            </button>
                          )}

                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Cancelled')}
                              className="bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: MENU MANAGEMENT ======================= */}
        {activeTab === 'menu' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header with Add Dish button */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-extrabold text-lg text-stone-900">
                  Dynamic Menu &amp; Real-time Stock Manager
                </h2>
                <p className="text-xs text-stone-500">
                  Toggle items in/out of stock instantly, edit prices, or introduce new recipes.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingDish(null);
                  setDishModalOpen(true);
                }}
                id="btn-admin-add-dish"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            {/* Category & Search Filter */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
                {['All', 'Fast Food', 'North Indian', 'Snacks', 'Beverages', 'Sweets'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      menuCategory === cat ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full bg-stone-50 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`bg-white rounded-2xl border p-3.5 shadow-2xs flex flex-col justify-between transition-all ${
                    !dish.isAvailable ? 'opacity-70 bg-stone-50/80 border-dashed' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded">
                          {dish.category}
                        </span>
                        <div className={`w-3 h-3 border ${dish.isVeg ? 'border-emerald-600' : 'border-red-600'} flex items-center justify-center`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                        </div>
                      </div>

                      <h3 className="font-bold text-stone-900 text-sm mt-1 truncate">
                        {dish.name}
                      </h3>
                      <div className="text-stone-900 font-extrabold text-sm mt-0.5">
                        ₹{dish.price}
                        {dish.originalPrice && (
                          <span className="text-stone-400 line-through text-xs font-normal ml-1">
                            ₹{dish.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="text-stone-400 text-[11px] mt-0.5">
                        Prep: {dish.preparationTime}
                      </div>
                    </div>
                  </div>

                  {/* Stock Toggle & Edit Actions */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleDishStock(dish.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          dish.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {dish.isAvailable ? '● In Stock' : '✕ Out of Stock'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDish(dish);
                          setDishModalOpen(true);
                        }}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit dish"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove "${dish.name}" from the menu?`)) {
                            onDeleteDish(dish.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: COUPONS & OFFERS MANAGER ======================= */}
        {activeTab === 'coupons' && (
          <div className="animate-in fade-in">
            <CouponManager
              coupons={localSettings.coupons || []}
              onUpdateCoupons={(updatedCoupons) => {
                const newSettings = { ...localSettings, coupons: updatedCoupons };
                setLocalSettings(newSettings);
                onSaveSettings(newSettings);
              }}
            />
          </div>
        )}

        {/* ======================= TAB: WHATSAPP CUSTOMERS GROUP ======================= */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Top Overview Card */}
            <div className="bg-linear-to-r from-emerald-950 via-stone-900 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Centralized Firestore Group
                    </span>
                    <span className="text-stone-400 text-xs">/users collection</span>
                  </div>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl mt-1.5 text-white">
                    Signed-In WhatsApp Foodies ({users.length})
                  </h3>
                  <p className="text-stone-300 text-xs mt-1 max-w-xl leading-relaxed">
                    Every user who verifies via WhatsApp OTP is automatically grouped here in Firestore. You can track customer activity, order frequency, and broadcast instant promo discounts directly to their WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <div className="text-xl font-black text-emerald-400">{users.length}</div>
                    <div className="text-[10px] text-stone-300 uppercase font-bold">Total Foodies</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <div className="text-xl font-black text-amber-400">
                      {users.reduce((acc, u) => acc + (u.orderCount || 0), 0)}
                    </div>
                    <div className="text-[10px] text-stone-300 uppercase font-bold">Total Orders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-xs text-stone-500 font-medium flex items-center gap-1 self-center">
                <span>Showing <strong>{
                  users.filter(u => 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.phoneNumber.includes(userSearch)
                  ).length
                }</strong> registered customers</span>
              </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {users.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200">
                  <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3">
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-base">No signed-in customers yet</h4>
                  <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
                    Customers who verify via WhatsApp OTP on checkout or the Sign In button will automatically appear here in real time.
                  </p>
                </div>
              ) : (
                users
                  .filter(u => 
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.phoneNumber.includes(userSearch)
                  )
                  .map((user) => {
                    const joinDate = new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    const promoMsg = encodeURIComponent(
                      `Hello ${user.name}! 🍔 Exclusive offer from Hello Bite: Enjoy flat ₹50 OFF on your favorite dishes today across Gopalganj & Siwan. Use code FIRSTBITE! Order now: ${window.location.origin}`
                    );

                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-base">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 text-sm leading-tight">{user.name}</h4>
                                <a 
                                  href={`tel:${user.phoneNumber}`}
                                  className="text-stone-500 text-xs hover:text-emerald-600 transition-colors"
                                >
                                  +91 {user.phoneNumber}
                                </a>
                              </div>
                            </div>

                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-200">
                              Verified
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-stone-100">
                            <div className="bg-stone-50 p-2 rounded-xl">
                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Customer Group</span>
                              <span className="font-semibold text-stone-800 text-[11px]">{user.group || 'Signed-In Users'}</span>
                            </div>
                            <div className="bg-stone-50 p-2 rounded-xl">
                              <span className="text-[10px] text-stone-400 font-bold uppercase block">Orders Placed</span>
                              <span className="font-semibold text-stone-800 text-[11px]">{user.orderCount || 0} Orders</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-stone-400 mt-2">
                            Joined: {joinDate}
                          </div>
                        </div>

                        {/* WhatsApp Broadcast Button */}
                        <div className="pt-2 border-t border-stone-100">
                          <a
                            href={`https://wa.me/91${user.phoneNumber}?text=${promoMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-emerald-800" />
                            <span>Broadcast Offer (WhatsApp)</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: PARTNERS & KYC APPROVALS ======================= */}
        {activeTab === 'partners' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Restaurants Approval Section */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-display font-extrabold text-base text-stone-900">
                      Restaurant Partner Applications ({restaurants.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Approve verified FSSAI kitchens to showcase them in the Hello Bite storefront.
                    </p>
                  </div>
                </div>
              </div>

              {restaurants.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  No restaurant partner registrations yet. Partners can register via Sign In → Restaurant Partner.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurants.map((rest) => (
                    <div
                      key={rest.restaurantId}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-stone-900">
                            {rest.restaurantName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              rest.approvalStatus === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rest.approvalStatus === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rest.approvalStatus}
                          </span>
                        </div>
                        <div className="text-stone-600">
                          Owner: <strong>{rest.ownerName}</strong> · {rest.ownerPhone}
                        </div>
                        <div className="text-stone-500">
                          {rest.address} ({rest.city})
                        </div>
                        <div className="text-stone-700 font-semibold">
                          FSSAI: <span className="font-mono">{rest.fssaiNumber}</span>
                        </div>
                        {rest.foodCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {rest.foodCategories.map((c) => (
                              <span
                                key={c}
                                className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() =>
                            storeService.updateRestaurantApproval(rest.restaurantId, 'approved')
                          }
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
                        >
                          ✓ Approve Kitchen
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            storeService.updateRestaurantApproval(rest.restaurantId, 'rejected')
                          }
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Riders Approval Section */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-display font-extrabold text-base text-stone-900">
                      Rider &amp; Delivery Partner KYC ({riders.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Verify Driving Licence &amp; Vehicle RC registrations from /riders collection.
                    </p>
                  </div>
                </div>
              </div>

              {riders.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  No rider KYC applications yet. Partners can register via Sign In → Rider &amp; Ride Partner.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riders.map((r) => (
                    <div
                      key={r.userId}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-stone-900">
                            {r.personalDetails.fullName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.approvalStatus === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.approvalStatus === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.approvalStatus}
                          </span>
                        </div>
                        <div className="text-stone-600">
                          Phone: <strong>{r.personalDetails.phoneNumber}</strong> · City: {r.personalDetails.city}
                        </div>
                        <div className="text-stone-700 font-semibold">
                          {r.vehicleDetails.vehicleType}: <span className="font-mono">{r.vehicleDetails.vehicleNumber}</span> · DL: <span className="font-mono">{r.vehicleDetails.drivingLicenceNumber}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => storeService.updateRiderApproval(r.userId, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
                        >
                          ✓ Approve Rider
                        </button>
                        <button
                          type="button"
                          onClick={() => storeService.updateRiderApproval(r.userId, 'rejected')}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 4: SETTINGS & FIREBASE ======================= */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            {/* MANDATORY HELPLINE DETAILS CARD */}
            <div className="bg-linear-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-orange-500/30 text-orange-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Official Support Contact
                  </span>
                  <h3 className="font-display font-extrabold text-xl sm:text-2xl mt-1.5">
                    Helpline &amp; Operations Desk
                  </h3>
                  <p className="text-stone-400 text-xs mt-1">
                    Customers and riders can reach this verified helpline 24/7.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-stone-300">Contact Person Name:</span>
                    <strong className="text-white font-extrabold text-sm tracking-wide">
                      {settings.contactPersonName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-stone-300">Helpline Number:</span>
                    <a
                      href={`tel:${settings.helplineNumber}`}
                      className="text-orange-400 font-extrabold text-base hover:underline"
                    >
                      {settings.helplineNumber}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Firestore Database Sync Card */}
            <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-3xl p-5 text-white shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <h4 className="font-display font-extrabold text-base text-emerald-200">
                    Live Cloud Firestore Database: Connected
                  </h4>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30 w-fit">
                  Project: {storeService.getFirebaseProjectId()}
                </span>
              </div>

              <p className="text-xs text-emerald-100/80 leading-relaxed">
                All food service listings, dishes, task &amp; booking requests, and customer orders are synced in real-time to Google Cloud Firestore. Any dish or price update you make here instantly reflects across all phones globally.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time Orders on Admin Phone</span>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Global Menu &amp; Price Sync</span>
                </div>
                <div className="bg-emerald-900/40 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Auto Real-time Revenue Tally</span>
                </div>
              </div>
            </div>

            {/* Master Guide Trigger Card */}
            <div className="bg-linear-to-r from-amber-500 to-orange-600 text-white p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-amber-100 text-xs uppercase">
                  <Flame className="w-4 h-4 text-white" />
                  <span>Deployment Master Guide</span>
                </div>
                <h4 className="font-display font-black text-lg text-white mt-1">
                  Firebase Realtime Database &amp; Vercel 404 Prevention
                </h4>
                <p className="text-xs text-amber-100">
                  Step-by-step documentation on deploying to Vercel, adding web configs, and Web Audio permissions.
                </p>
              </div>

              <button
                onClick={() => setGuideModalOpen(true)}
                className="bg-white text-stone-900 hover:bg-stone-100 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1"
              >
                <span>Open Master Guide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Alert Controls */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4">
              <h3 className="font-display font-extrabold text-base text-stone-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <span>Audio Alert Warning Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">
                    Alarm Master Volume ({Math.round(soundVolume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-orange-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestChime}
                    className="bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Loud Chime Alarm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Per-KM Delivery Pricing & Kitchen Hub Coordinates */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-extrabold text-base text-stone-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <span>Kitchen Hub GPS &amp; Per-KM Delivery Pricing</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Set your kitchen hub coordinates and per-kilometer delivery rate charged by distance on Google Maps.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const updated = {
                        ...localSettings,
                        kitchenHubLat: Math.round(pos.coords.latitude * 100000) / 100000,
                        kitchenHubLng: Math.round(pos.coords.longitude * 100000) / 100000,
                      };
                      setLocalSettings(updated);
                      onSaveSettings(updated);
                    });
                  }}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs px-3 py-2 rounded-xl border border-orange-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use My GPS as Kitchen Location</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kitchen Hub Name
                  </label>
                  <input
                    type="text"
                    value={localSettings.kitchenHubName ?? 'Gopalganj Central Kitchen'}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, kitchenHubName: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Base Delivery Fee (First 2 km, ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.baseDeliveryFee ?? 20}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, baseDeliveryFee: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Per-Kilometer Charge (After 2 km, ₹/km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.perKmRate ?? 8}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, perKmRate: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kitchen Latitude
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={localSettings.kitchenHubLat ?? 26.4687}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, kitchenHubLat: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kitchen Longitude
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={localSettings.kitchenHubLng ?? 84.4442}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, kitchenHubLng: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials & Notifications Form */}
            <form onSubmit={handleSaveSettingsSubmit} className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-4">
              <h3 className="font-display font-extrabold text-base text-stone-900">
                Admin Password &amp; Group Notification Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={localSettings.contactPersonName}
                    onChange={(e) => setLocalSettings({ ...localSettings, contactPersonName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Helpline Phone Number
                  </label>
                  <input
                    type="text"
                    value={localSettings.helplineNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, helplineNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Admin Access Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter admin password"
                    value={localSettings.adminPassword}
                    onChange={(e) => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    WhatsApp Redirect Number
                  </label>
                  <input
                    type="text"
                    value={localSettings.whatsappNumber}
                    onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Telegram Bot Token (Optional Webhook)
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890:AAH..."
                    value={localSettings.telegramBotToken || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, telegramBotToken: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Telegram Chat ID / Group ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="-1001234567890"
                    value={localSettings.telegramChatId || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, telegramChatId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset to initial sample menu, demo areas, and default password?')) {
                      onResetDemoData();
                    }
                  }}
                  className="text-stone-500 hover:text-red-600 text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save All Settings</span>
                </button>
              </div>

              {settingsSavedToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All settings updated and saved successfully!</span>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* Modals */}
      <DishModal
        isOpen={dishModalOpen}
        onClose={() => setDishModalOpen(false)}
        onSave={onSaveDish}
        dishToEdit={editingDish}
      />

      <FirebaseGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  );
};
