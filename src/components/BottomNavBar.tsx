import React from 'react';
import { 
  UtensilsCrossed, 
  Package, 
  ShoppingBag, 
  Receipt, 
  Headphones,
  Flame,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';

export type AppNavTab = 'menu' | 'tiffin' | 'cart' | 'orders' | 'more';

interface BottomNavBarProps {
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  cartCount: number;
  cartTotal: number;
  activeOrder: Order | null;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenMore: () => void;
  onScrollToMenu: () => void;
  onScrollToTiffin: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  cartTotal,
  activeOrder,
  onOpenCart,
  onOpenOrders,
  onOpenMore,
  onScrollToMenu,
  onScrollToTiffin
}) => {
  const handleTabClick = (tab: AppNavTab) => {
    onSelectTab(tab);
    if (tab === 'menu') {
      onScrollToMenu();
    } else if (tab === 'tiffin') {
      onScrollToTiffin();
    } else if (tab === 'cart') {
      onOpenCart();
    } else if (tab === 'orders') {
      onOpenOrders();
    } else if (tab === 'more') {
      onOpenMore();
    }
  };

  return (
    <nav 
      id="app-bottom-nav-bar"
      aria-label="App Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around select-none">
        {/* TAB 1: MENU */}
        <button
          onClick={() => handleTabClick('menu')}
          id="tab-btn-menu"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 ${
            activeTab === 'menu' 
              ? 'text-orange-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-full transition-colors ${activeTab === 'menu' ? 'bg-orange-100/80 text-orange-600' : ''}`}>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">Menu</span>
        </button>

        {/* TAB 2: TIFFIN */}
        <button
          onClick={() => handleTabClick('tiffin')}
          id="tab-btn-tiffin"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 ${
            activeTab === 'tiffin' 
              ? 'text-orange-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-full transition-colors ${activeTab === 'tiffin' ? 'bg-orange-100/80 text-orange-600' : ''}`}>
              <Package className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-black px-1 rounded-full scale-90">
              Hot
            </span>
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">Tiffin</span>
        </button>

        {/* TAB 3: CART (With Center Hero Stacking) */}
        <button
          onClick={() => handleTabClick('cart')}
          id="tab-btn-cart"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 ${
            activeTab === 'cart' 
              ? 'text-orange-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-full transition-colors ${
              cartCount > 0 
                ? 'bg-orange-600 text-white shadow-xs' 
                : activeTab === 'cart' 
                  ? 'bg-orange-100 text-orange-600' 
                  : ''
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
            {cartCount > 0 && (
              <span 
                id="bottom-nav-cart-badge"
                className="absolute -top-1 -right-2 bg-stone-900 text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in-50"
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">
            {cartCount > 0 ? `₹${cartTotal}` : 'Cart'}
          </span>
        </button>

        {/* TAB 4: ORDERS */}
        <button
          onClick={() => handleTabClick('orders')}
          id="tab-btn-orders"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 ${
            activeTab === 'orders' 
              ? 'text-orange-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-full transition-colors ${activeTab === 'orders' ? 'bg-orange-100/80 text-orange-600' : ''}`}>
              <Receipt className="w-5 h-5" />
            </div>
            {activeOrder && (
              <span 
                id="bottom-nav-live-order-dot"
                className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black px-1 rounded-full flex items-center gap-0.5 animate-pulse border border-white"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">Orders</span>
        </button>

        {/* TAB 5: MORE / HELPLINE / ADMIN */}
        <button
          onClick={() => handleTabClick('more')}
          id="tab-btn-more"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-92 ${
            activeTab === 'more' 
              ? 'text-orange-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <div className={`p-1 rounded-full transition-colors ${activeTab === 'more' ? 'bg-orange-100/80 text-orange-600' : ''}`}>
              <Headphones className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 leading-none">Help &amp; More</span>
        </button>
      </div>
    </nav>
  );
};
