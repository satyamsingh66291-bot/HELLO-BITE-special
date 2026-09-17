import React from 'react';
import { ShoppingBag, Shield, PhoneCall, MapPin, Bike, Search, CheckCircle2, History, X } from 'lucide-react';
import { DeliveryArea, Order } from '../types';

interface NavbarProps {
  areas: DeliveryArea[];
  selectedArea: DeliveryArea;
  onSelectArea: (area: DeliveryArea) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  activeOrder: Order | null;
  onOpenOrderTracker: () => void;
  onDismissActiveOrder?: () => void;
  onOpenOrderHistory?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  helplineName: string;
  helplineNumber: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  areas,
  selectedArea,
  onSelectArea,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  activeOrder,
  onOpenOrderTracker,
  onDismissActiveOrder,
  onOpenOrderHistory,
  searchQuery,
  onSearchChange,
  helplineName,
  helplineNumber
}) => {
  const [showAreaDropdown, setShowAreaDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Helpline Micro-bar */}
      <div className="bg-stone-900 text-stone-200 px-3 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium tracking-wide">
          <PhoneCall className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>24/7 Helpline:</span>
          <a 
            href={`tel:${helplineNumber}`} 
            className="text-orange-400 font-bold hover:underline"
            id="nav-helpline-link"
          >
            {helplineNumber}
          </a>
          <span className="hidden sm:inline text-stone-400">({helplineName})</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {activeOrder && (
            <div className="flex items-center gap-1 bg-emerald-950/60 rounded-full border border-emerald-700/50 pr-1">
              <button
                onClick={onOpenOrderTracker}
                id="nav-live-order-badge"
                className="flex items-center gap-1 text-emerald-400 font-semibold px-2 py-0.5 hover:text-emerald-300 transition-colors cursor-pointer"
                title="View live order progress"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Track Order #{activeOrder.orderNumber}</span>
              </button>
              {onDismissActiveOrder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissActiveOrder();
                  }}
                  title="Dismiss live tracker"
                  className="text-stone-400 hover:text-white p-0.5 rounded-full hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {onOpenOrderHistory && (
            <button
              onClick={onOpenOrderHistory}
              id="nav-customer-history-btn"
              className="flex items-center gap-1 text-stone-300 hover:text-orange-400 font-medium transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">My Orders</span>
            </button>
          )}

          <button
            onClick={onOpenAdmin}
            id="nav-admin-portal-btn"
            className="flex items-center gap-1 text-stone-300 hover:text-white font-medium transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              HB
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-extrabold text-xl sm:text-2xl text-stone-900 tracking-tight">
                  Hello<span className="text-orange-600">Bite</span>
                </span>
                <span className="bg-orange-100 text-orange-700 font-bold text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Express
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Hot Gourmet & Daily Tiffin Service
              </p>
            </div>
          </a>
        </div>

        {/* Location Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setShowAreaDropdown(!showAreaDropdown)}
            id="nav-location-picker-btn"
            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-stone-300 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[160px] text-left">
              {selectedArea.name.split('(')[0]}
            </span>
            <span className="text-stone-500 text-[11px] font-normal">
              ₹{selectedArea.charge}
            </span>
          </button>

          {showAreaDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                <span>Choose Delivery Zone</span>
                <Bike className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="space-y-1 mt-1">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => {
                      onSelectArea(area);
                      setShowAreaDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedArea.id === area.id
                        ? 'bg-orange-50 text-orange-900 font-bold'
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{area.name}</div>
                      <div className="text-[10px] text-stone-500">ETA: {area.estimatedTime}</div>
                    </div>
                    <div className="text-right font-bold text-orange-600 shrink-0">
                      ₹{area.charge}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Input (Desktop & Tablet) */}
        <div className="relative hidden md:flex items-center flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search pizza, thali, burger, sweets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="nav-search-input"
            className="w-full bg-stone-100 text-stone-900 text-xs sm:text-sm pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
        </div>

        {/* Special Cart & Order History Button */}
        <div className="flex items-center gap-2">
          {onOpenOrderHistory && (
            <button
              onClick={onOpenOrderHistory}
              id="nav-main-order-history-btn"
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-2.5 sm:px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border border-stone-200 transition-all cursor-pointer"
              title="View your past food orders"
            >
              <History className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">My Orders</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            id="nav-cart-btn"
            className="relative flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Special Cart</span>
            {cartCount > 0 && (
              <span 
                id="nav-cart-count-badge"
                className="bg-stone-950 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -mr-1"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className="md:hidden px-3 pb-2">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search fast food, thali, biryani, tiffin..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="nav-search-input-mobile"
            className="w-full bg-stone-100 text-stone-900 text-xs pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>
      </div>
    </header>
  );
};
