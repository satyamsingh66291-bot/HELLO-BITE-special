import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface StickyCartBarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export const StickyCartBar: React.FC<StickyCartBarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart
}) => {
  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          id="btn-sticky-cart-bar"
          className="w-full bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between active:scale-98 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-sm sm:text-base leading-tight">
                {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'} · ₹{cartTotal}
              </div>
              <p className="text-[11px] text-orange-100 font-medium">
                Tap to review order &amp; checkout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm bg-black/20 px-3.5 py-1.5 rounded-xl group-hover:bg-black/30 transition-colors">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
