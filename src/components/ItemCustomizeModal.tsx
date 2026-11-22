import React, { useState } from 'react';
import { X, Plus, Check, Sparkles, ChefHat, Heart } from 'lucide-react';
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
  onAddToCart
}) => {
  const [portion, setPortion] = useState<'Regular' | 'Half' | 'Full'>('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [instruction, setInstruction] = useState<string>('');

  if (!isOpen || !dish) return null;

  const portionDelta = portion === 'Half' ? -Math.round(dish.price * 0.35) : portion === 'Full' ? Math.round(dish.price * 0.65) : 0;
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const addon = DEFAULT_ADDONS.find(a => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const itemTotal = Math.max(20, dish.price + portionDelta + addonsTotal);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const addonsObjs = selectedAddons.map(id => {
      const a = DEFAULT_ADDONS.find(x => x.id === id)!;
      return { id: a.id, name: a.name, price: a.price };
    });

    const customization: ItemCustomization = {
      portion,
      portionDelta,
      addons: addonsObjs,
      instructions: instruction.trim() || undefined
    };

    const cartItem: CartItem = {
      dishId: dish.id,
      name: `${dish.name}${portion !== 'Regular' ? ` (${portion})` : ''}`,
      price: itemTotal,
      quantity: 1,
      image: dish.image,
      isVeg: dish.isVeg,
      customization
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Dish Preview */}
        <div className="relative">
          <div className="h-44 sm:h-52 w-full overflow-hidden bg-stone-100">
            <img 
              src={dish.image} 
              alt={dish.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-stone-900/70 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs flex items-center gap-2">
            <div className={`w-3.5 h-3.5 border-2 ${dish.isVeg ? 'border-emerald-600' : 'border-red-600'} flex items-center justify-center`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
            </div>
            <span className="text-xs font-bold text-stone-800">
              {dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          <div>
            <h3 className="font-display font-extrabold text-lg text-stone-900 leading-tight">
              {dish.name}
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Portion Size Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Choose Portion Size
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Half', 'Regular', 'Full'] as const).map(p => {
                const isSelected = portion === p;
                const delta = p === 'Half' ? -Math.round(dish.price * 0.35) : p === 'Full' ? Math.round(dish.price * 0.65) : 0;
                return (
                  <button
                    key={p}
                    onClick={() => setPortion(p)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-xs' 
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="text-xs">{p}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {delta === 0 ? 'Standard' : delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Popular Add-Ons &amp; Dips
            </span>
            <div className="space-y-2">
              {DEFAULT_ADDONS.map(addon => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      isChecked 
                        ? 'border-orange-400 bg-orange-50/60' 
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-stone-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-stone-800">{addon.name}</span>
                    </div>
                    <span className="text-xs font-bold text-stone-900">+₹{addon.price}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Cooking Instructions */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Kitchen Instructions (Optional)
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Less Spicy', 'Extra Crispy', 'No Onion/Garlic', 'Extra Gravy'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setInstruction(prev => prev ? `${prev}, ${tag}` : tag)}
                  className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="e.g. Please send extra tissue, ring bell twice..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Footer Add to Cart Bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Item Total</span>
            <span className="font-extrabold text-xl text-stone-900">₹{itemTotal}</span>
          </div>

          <button
            onClick={handleConfirm}
            id="btn-confirm-customization"
            className="flex-1 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-98 text-white font-bold text-sm py-3 px-5 rounded-2xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Add Item to Cart</span>
            <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs">₹{itemTotal}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
