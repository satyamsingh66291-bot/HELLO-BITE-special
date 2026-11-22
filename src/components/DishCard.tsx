import React from 'react';
import { Plus, Minus, Star, Clock, Sparkles, Heart, Flame } from 'lucide-react';
import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  cartQuantity: number;
  isFavorite: boolean;
  onAddToCart: (dish: Dish) => void;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  onOpenCustomizer: (dish: Dish) => void;
  onToggleFavorite: (dishId: string) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  cartQuantity,
  isFavorite,
  onAddToCart,
  onUpdateQuantity,
  onOpenCustomizer,
  onToggleFavorite
}) => {
  return (
    <div 
      id={`dish-card-${dish.id}`}
      className={`bg-white rounded-3xl border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-300 overflow-hidden flex flex-col justify-between group ${
        !dish.isAvailable ? 'opacity-70 grayscale-30' : ''
      }`}
    >
      {/* Image and Badges */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(dish.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all shadow-xs z-10 cursor-pointer ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 hover:bg-white text-stone-700 hover:text-red-500'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Badge (e.g. Bestseller, Chef's Special) */}
        {dish.badge && (
          <div className="absolute top-2.5 left-2.5 bg-stone-900/90 text-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>{dish.badge}</span>
          </div>
        )}

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 p-1 rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1.5">
          <div className={`w-3.5 h-3.5 border-2 ${dish.isVeg ? 'border-emerald-600' : 'border-red-600'} flex items-center justify-center`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
          </div>
          <span className="text-[10px] font-bold text-stone-700 pr-1">
            {dish.isVeg ? 'VEG' : 'NON-VEG'}
          </span>
        </div>

        {/* Out of Stock Overlay */}
        {!dish.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
            <span className="bg-red-600 text-white font-black text-xs uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-md">
              Sold Out for Today
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Header Row with Rating & Prep Time */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>{dish.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal text-[10px]">({dish.ratingCount})</span>
            </div>

            <div className="flex items-center gap-1 text-stone-500 font-medium text-[11px]">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{dish.preparationTime}</span>
            </div>
          </div>

          {/* Dish Name */}
          <h3 className="font-display font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-orange-600 transition-colors line-clamp-1">
            {dish.name}
          </h3>

          {/* Description */}
          <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Pricing and Action Button */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                ₹{dish.price}
              </span>
              {dish.originalPrice && dish.originalPrice > dish.price && (
                <span className="text-stone-400 line-through text-xs">
                  ₹{dish.originalPrice}
                </span>
              )}
            </div>
            {dish.originalPrice && dish.originalPrice > dish.price && (
              <span className="text-[10px] font-extrabold text-emerald-600">
                {Math.round(((dish.originalPrice - dish.price) / dish.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Actions: Add / Customise / Stepper */}
          {dish.isAvailable ? (
            cartQuantity > 0 ? (
              <div className="flex items-center bg-orange-600 text-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity - 1)}
                  className="px-2.5 py-1.5 hover:bg-orange-700 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                  id={`btn-decrease-${dish.id}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-black min-w-5 text-center">
                  {cartQuantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity + 1)}
                  className="px-2.5 py-1.5 hover:bg-orange-700 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                  id={`btn-increase-${dish.id}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenCustomizer(dish)}
                  className="text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Choose portion & add-ons"
                >
                  Customise
                </button>
                <button
                  onClick={() => onAddToCart(dish)}
                  id={`btn-add-${dish.id}`}
                  className="bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <span>ADD</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ) : (
            <span className="text-xs font-semibold text-stone-400 italic">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};
