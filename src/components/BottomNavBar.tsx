import React from 'react';
import {
  Home,
  Receipt,
  Package,
  User,
} from 'lucide-react';
import { Order } from '../types';

export type AppNavTab = 'home' | 'orders' | 'tiffin' | 'profile';

interface BottomNavBarProps {
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  activeOrder: Order | null;
  onOpenOrders: () => void;
  onOpenMore: () => void;
  onScrollToHome: () => void;
  onScrollToTiffin: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  activeOrder,
  onOpenOrders,
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
      <div className="max-w-2xl mx-auto px-2 py-1 grid grid-cols-4 gap-1 select-none">
        {/* TAB 1: HOME */}
        <button
          type="button"
          onClick={() => handleTabClick('home')}
          id="tab-btn-home"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-[#7C4A22] hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-xl transition-colors ${
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
          type="button"
          onClick={() => handleTabClick('orders')}
          id="tab-btn-orders"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-[#7C4A22] hover:text-[#3D1C0A]'
          }`}
        >
          <div className="relative">
            <div
              className={`px-3 py-1 rounded-xl transition-colors ${
                activeTab === 'orders' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            {activeOrder && (
              <span
                id="bottom-nav-live-order-dot"
                className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 rounded-full flex items-center border border-white"
              >
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Orders
          </span>
        </button>

        {/* TAB 3: TIFFIN */}
        <button
          type="button"
          onClick={() => handleTabClick('tiffin')}
          id="tab-btn-tiffin"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'tiffin'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-[#7C4A22] hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-xl transition-colors ${
              activeTab === 'tiffin' ? 'bg-orange-100/90 text-[#FF6B00]' : ''
            }`}
          >
            <Package className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            Tiffin
          </span>
        </button>

        {/* TAB 4: PROFILE */}
        <button
          type="button"
          onClick={() => handleTabClick('profile')}
          id="tab-btn-profile"
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#FF6B00] font-extrabold'
              : 'text-[#7C4A22] hover:text-[#3D1C0A]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-xl transition-colors ${
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
