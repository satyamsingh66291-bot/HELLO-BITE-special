import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Dish, CartItem, ItemCustomization } from '../types';

interface ItemCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  onAddToCart: (item: CartItem) => void;
}

const DEFAULT_ADDONS = [
  { id: 'addon_cheese', name: 'Extra Cheddar / Amul Cheese', price: 35 },
  { id: 'addon_dip', name: 'Mint Chutney & Garlic Dip Combo', price: 25 },
  { id: 'addon_sweet', name: 'Hot Gulab Jamun (1 Pc)', price: 35 },
  { id: 'addon_papad', name: 'Roasted Spiced Papad', price: 15 },
];

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({
  isOpen,
  onClose,
  dish,
  onAddToCart,
}) => {
  const [portion, setPortion] = useState<'Regular' | 'Half' | 'Full'>('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [instruction, setInstruction] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !dish) return null;

  const portionDelta =
    portion === 'Half'
      ? -Math.round(dish.price * 0.35)
      : portion === 'Full'
        ? Math.round(dish.price * 0.65)
        : 0;
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const addon = DEFAULT_ADDONS.find((a) => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const itemTotal = Math.max(20, dish.price + portionDelta + addonsTotal);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const addonsObjs = selectedAddons.map((id) => {
      const a = DEFAULT_ADDONS.find((x) => x.id === id)!;
      return { id: a.id, name: a.name, price: a.price };
    });

    const customization: ItemCustomization = {
      portion,
      portionDelta,
      addons: addonsObjs,
      instructions: instruction.trim() || undefined,
    };

    const cartItem: CartItem = {
      dishId: dish.id,
      name: `${dish.name}${portion !== 'Regular' ? ` (${portion})` : ''}`,
      price: itemTotal,
      quantity: 1,
      image: dish.image,
      isVeg: dish.isVeg,
      customization,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div
      id="customize-dish-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="customize-dish-back-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] truncate">
          Customize Dish
        </h2>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Hero Dish Image Card */}
          <div className="relative h-48 sm:h-64 w-full rounded-3xl overflow-hidden bg-stone-100 border border-[#F5E6D3] shadow-xs">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 border-2 ${
                  dish.isVeg ? 'border-emerald-600' : 'border-red-600'
                } flex items-center justify-center`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                />
              </div>
              <span className="text-xs font-extrabold text-[#3D1C0A]">
                {dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-1">
            <h3 className="font-display font-black text-xl text-[#3D1C0A] leading-tight">
              {dish.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#7C4A22] leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Portion Size Selection */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3">
            <span className="text-xs font-extrabold text-[#7C4A22] uppercase tracking-wider block">
              Choose Portion Size
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Half', 'Regular', 'Full'] as const).map((p) => {
                const isSelected = portion === p;
                const delta =
                  p === 'Half'
                    ? -Math.round(dish.price * 0.35)
                    : p === 'Full'
                      ? Math.round(dish.price * 0.65)
                      : 0;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPortion(p)}
                    className={`min-h-[56px] p-3 rounded-2xl border-2 text-center transition-all cursor-pointer tabular-nums ${
                      isSelected
                        ? 'border-[#FF6B00] bg-orange-50 text-[#3D1C0A] font-black shadow-xs'
                        : 'border-[#F5E6D3] hover:border-orange-300 text-[#7C4A22] font-bold'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">{p}</div>
                    <div className="text-[11px] mt-0.5">
                      {delta === 0
                        ? 'Standard'
                        : delta > 0
                          ? `+₹${delta}`
                          : `-₹${Math.abs(delta)}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Checklist */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3">
            <span className="text-xs font-extrabold text-[#7C4A22] uppercase tracking-wider block">
              Popular Add-Ons &amp; Dips
            </span>
            <div className="space-y-2">
              {DEFAULT_ADDONS.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`min-h-[48px] flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'border-[#FF6B00] bg-orange-50/70'
                        : 'border-[#F5E6D3] hover:bg-[#FFF8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#3D1C0A]">
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#3D1C0A] tabular-nums">
                      +₹{addon.price}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Cooking Instructions */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3">
            <span className="text-xs font-extrabold text-[#7C4A22] uppercase tracking-wider block">
              Kitchen Instructions (Optional)
            </span>
            <div className="flex flex-wrap gap-2">
              {['Less Spicy', 'Extra Crispy', 'No Onion/Garlic', 'Extra Gravy'].map(
                (tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setInstruction((prev) => (prev ? `${prev}, ${tag}` : tag))
                    }
                    className="min-h-[36px] text-xs bg-[#FFF8F0] hover:bg-orange-50 text-[#3D1C0A] font-bold px-3 py-1.5 rounded-xl border border-[#F5E6D3] transition-colors cursor-pointer"
                  >
                    +{tag}
                  </button>
                )
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Please send extra tissue, ring bell twice..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sticky Footer Add to Cart Bar */}
      <div className="shrink-0 bg-white border-t border-[#F5E6D3] px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="tabular-nums">
            <span className="text-[11px] uppercase font-bold text-[#7C4A22] block">
              Item Total
            </span>
            <span className="font-black text-xl text-[#3D1C0A]">₹{itemTotal}</span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            id="btn-confirm-customization"
            className="flex-1 min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 active:scale-98 text-white font-black text-sm sm:text-base py-3 px-5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer tabular-nums"
          >
            <span>Add Item to Cart</span>
            <span className="bg-black/20 px-2.5 py-0.5 rounded-xl text-xs">
              ₹{itemTotal}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
