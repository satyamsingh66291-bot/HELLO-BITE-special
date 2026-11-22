import React, { useRef } from 'react';
import {
  ShoppingBag,
  MapPin,
  Search,
  Bell,
  User,
  Heart,
  ChevronDown,
  AlertCircle,
  X,
} from 'lucide-react';
import { Order, AppUser, KitchenStatus } from '../types';
import { HelloBiteLogo } from './auth/HelloBiteLogo';

interface NavbarProps {
  currentAddressLabel: string;
  onOpenLocationPicker: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  activeOrder: Order | null;
  onOpenOrderTracker: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoriteCount: number;
  onOpenFavorites: () => void;
  kitchenStatus?: KitchenStatus;
  kitchenStatusNote?: string;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAddressLabel,
  onOpenLocationPicker,
  cartCount,
  cartTotal,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onOpenOrders,
  activeOrder,
  onOpenOrderTracker,
  searchQuery,
  onSearchChange,
  favoriteCount,
  onOpenFavorites,
  kitchenStatus = 'open',
  kitchenStatusNote,
  onOpenAdmin,
}) => {
  const tapCountRef = useRef(0);
  const lastTapAtRef = useRef(0);

  // Silent 5-tap gesture on the Hello Bite emblem opens staff workspace login without exposing staff buttons in customer UI
  const handleBrandTap = () => {
    const now = Date.now();
    if (now - lastTapAtRef.current > 2500) {
      tapCountRef.current = 0;
    }
    lastTapAtRef.current = now;
    tapCountRef.current += 1;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      onOpenAdmin();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF8F0]/95 backdrop-blur-md border-b border-orange-100/90 shadow-[0_2px_14px_rgba(255,107,0,0.06)]">
      {/* Kitchen Status Alert Banner */}
      {kitchenStatus !== 'open' && (
        <div
          className={`px-3 py-1.5 text-xs text-center font-bold flex items-center justify-center gap-1.5 ${
            kitchenStatus === 'busy'
              ? 'bg-amber-500 text-stone-950'
              : 'bg-red-600 text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {kitchenStatusNote ||
              (kitchenStatus === 'busy'
                ? 'High order volume right now. Preparation time may be +15 mins.'
                : 'Kitchen is currently closed for orders.')}
          </span>
        </div>
      )}

      {/* Main App Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-5">
        {/* Left: Compact Brand Emblem (Mobile + Desktop) & Location Selector */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleBrandTap}
            className="flex sm:hidden items-center justify-center w-9 h-9 rounded-2xl bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white font-black text-xs shadow-sm shrink-0 select-none"
            aria-label="Hello Bite"
          >
            HB
          </button>

          <button
            type="button"
            onClick={handleBrandTap}
            className="hidden sm:flex items-center shrink-0 select-none text-left"
            aria-label="Hello Bite"
          >
            <HelloBiteLogo size="sm" />
          </button>

          {/* Location Pin + Active Address Selector */}
          <button
            onClick={onOpenLocationPicker}
            id="nav-location-selector-btn"
            className="flex items-center gap-2 bg-white hover:bg-orange-50/70 text-[#3D1C0A] px-2.5 sm:px-3 py-1.5 rounded-2xl border border-orange-200/80 shadow-2xs transition-all cursor-pointer min-w-0 max-w-[185px] sm:max-w-xs"
            title="Change delivery location"
          >
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 fill-orange-200" />
            </div>
            <div className="min-w-0 text-left">
              <span className="block text-[10px] font-bold text-[#7C4A22] leading-none">
                Your Location
              </span>
              <span className="flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#3D1C0A] truncate mt-0.5">
                <span className="truncate">
                  {currentAddressLabel || 'Detect GPS Location'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
              </span>
            </div>
          </button>
        </div>

        {/* Center: Live Search Bar (Desktop / Tablet) */}
        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for food, tiffins..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="nav-search-desktop"
            className="w-full bg-white text-[#3D1C0A] placeholder:text-stone-400 text-xs sm:text-sm font-medium pl-10 pr-8 py-2.5 rounded-2xl border border-orange-200/80 shadow-2xs focus:outline-none focus:border-[#FF6B00] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-stone-400 hover:text-[#3D1C0A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Notification Bell, Favorites, Gmail Account, Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeOrder && (
            <button
              onClick={onOpenOrderTracker}
              id="nav-active-tracker-btn"
              className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs font-extrabold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Track #{activeOrder.orderNumber}</span>
            </button>
          )}

          {/* Favorites Shortcut */}
          <button
            onClick={onOpenFavorites}
            id="nav-favorites-btn"
            className="relative p-2 rounded-xl bg-white border border-orange-100 text-[#7C4A22] hover:text-[#FF6B00] transition-colors cursor-pointer"
            title="Saved Favorites"
          >
            <Heart className="w-4 h-4" />
            {favoriteCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={activeOrder ? onOpenOrderTracker : onOpenOrders}
            id="nav-notifications-btn"
            className="relative p-2 rounded-xl bg-white border border-orange-100 text-[#3D1C0A] hover:text-[#FF6B00] transition-colors cursor-pointer"
            title={activeOrder ? 'Track active order' : 'Order notifications'}
          >
            <Bell className="w-4 h-4" />
            {activeOrder && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00]" />
            )}
          </button>

          {/* User Account / Gmail Firebase Sign-In */}
          <button
            onClick={onOpenAuth}
            id="nav-user-auth-btn"
            className="flex items-center gap-1.5 bg-white hover:bg-orange-50 text-[#3D1C0A] text-xs font-extrabold px-2 sm:px-3 py-1.5 rounded-2xl border border-orange-200/80 shadow-2xs transition-colors cursor-pointer"
          >
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-orange-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white flex items-center justify-center font-black text-xs">
                {currentUser ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
            )}
            <span className="hidden sm:inline truncate max-w-[96px]">
              {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
            </span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            id="nav-cart-btn"
            className="relative flex items-center gap-1.5 bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white px-3 sm:px-3.5 py-2 rounded-2xl font-black text-xs shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">
              {cartCount > 0 ? `₹${cartTotal}` : 'Cart'}
            </span>
            {cartCount > 0 && (
              <span
                id="nav-cart-badge-count"
                className="bg-[#3D1C0A] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden px-3 pb-2.5 pt-0.5">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for food, tiffins..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="nav-search-mobile"
            className="w-full bg-white text-[#3D1C0A] placeholder:text-stone-400 text-xs font-medium pl-10 pr-8 py-2.5 rounded-2xl border border-orange-200/80 shadow-2xs focus:outline-none focus:border-[#FF6B00]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-stone-400 hover:text-[#3D1C0A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
