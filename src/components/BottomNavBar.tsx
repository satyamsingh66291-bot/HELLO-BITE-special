import React from 'react';
import {
  Home,
  Receipt,
  Car,
  Package,
  User,
} from 'lucide-react';
import { Order } from '../types';

export type AppNavTab = 'home' | 'orders' | 'ride' | 'tiffin' | 'profile';

interface BottomNavBarProps {
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  activeOrder: Order | null;
  onOpenOrders: () => void;
  onOpenRide: () => void;
  onOpenMore: () => void;
  onScrollToHome: () => void;
  onScrollToTiffin: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  activeOrder,
  onOpenOrders,
  onOpenRide,
  onOpenMore,
  onScrollToHome,
  onScrollToTiffin,
}) => {
  const handleTabClick = (tab: AppNavTab) => {
    onSelectTab(tab);
    if (tab === 'home') {
      onScrollToHome();
    } else if (tab === 'orders') {
      onOpenOrders();
    } else if (tab === 'ride') {
      onOpenRide();
    } else if (tab === 'tiffin') {
      onScrollToTiffin();
    } else if (tab === 'profile') {
      onOpenMore();
    }
  };

  return (
    <nav
      id="app-bottom-nav-bar"
      aria-label="App Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-orange-100 shadow-[0_-4px_20px_rgba(255,107,0,0.08)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around select-none">
        {/* TAB 1: HOME */}
        <button
          onClick={() => handleTabClick('home')}
          id="tab-btn-home"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-stone-500 hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-colors ${
              activeTab === 'home' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Home
          </span>
        </button>

        {/* TAB 2: ORDERS */}
        <button
          onClick={() => handleTabClick('orders')}
          id="tab-btn-orders"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-stone-500 hover:text-[#3D1C0A]'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                activeTab === 'orders' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            {activeOrder && (
              <span
                id="bottom-nav-live-order-dot"
                className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 rounded-full flex items-center gap-0.5 border border-white"
              >
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Orders
          </span>
        </button>

        {/* TAB 3: RIDE */}
        <button
          onClick={() => handleTabClick('ride')}
          id="tab-btn-ride"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 cursor-pointer ${
            activeTab === 'ride'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-stone-500 hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-colors ${
              activeTab === 'ride' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
            }`}
          >
            <Car className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Ride
          </span>
        </button>

        {/* TAB 4: TIFFIN */}
        <button
          onClick={() => handleTabClick('tiffin')}
          id="tab-btn-tiffin"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 cursor-pointer ${
            activeTab === 'tiffin'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-stone-500 hover:text-[#3D1C0A]'
          }`}
        >
          <div className="relative">
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                activeTab === 'tiffin' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Tiffin
          </span>
        </button>

        {/* TAB 5: PROFILE */}
        <button
          onClick={() => handleTabClick('profile')}
          id="tab-btn-profile"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-stone-500 hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-colors ${
              activeTab === 'profile' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
