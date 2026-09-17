import React from 'react';
import { Plus, Minus, Star, Clock, Sparkles } from 'lucide-react';
import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  cartQuantity: number;
  onAddToCart: (dish: Dish) => void;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity
}) => {
  return (
    <div 
      id={`dish-card-${dish.id}`}
      className={`bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group ${
        !dish.isAvailable ? 'opacity-70 grayscale-30' : ''
      }`}
    >
      {/* Image and Badges */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badge (e.g. Bestseller, Chef Choice) */}
        {dish.badge && (
          <div className="absolute top-2.5 left-2.5 bg-stone-900/90 text-amber-400 font-bold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{dish.badge}</span>
          </div>
        )}

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-2.5 right-2.5 bg-white/90 p-1 rounded-md shadow-xs backdrop-blur-xs">
          <div className={`w-3.5 h-3.5 border-2 ${dish.isVeg ? 'border-emerald-600' : 'border-red-600'} flex items-center justify-center`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!dish.isAvailable && (
          <div className="absolute inset-0 bg-stone-900/70 flex items-center justify-center p-3 text-center">
            <span className="bg-red-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-md shadow-md">
              Sold Out for Today
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Header Row with Rating & Prep Time */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
            <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>{dish.rating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal">({dish.ratingCount})</span>
            </div>

            <div className="flex items-center gap-1 text-stone-500 font-medium">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{dish.preparationTime}</span>
            </div>
          </div>

          {/* Dish Name */}
          <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight mt-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {dish.name}
          </h3>

          {/* Description */}
          <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Pricing and Action Button */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
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
              <span className="text-[10px] font-bold text-emerald-600">
                {Math.round(((dish.originalPrice - dish.price) / dish.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Add / Quantity Button */}
          {dish.isAvailable ? (
            cartQuantity > 0 ? (
              <div className="flex items-center bg-orange-600 text-white rounded-xl shadow-xs overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity - 1)}
                  className="px-2.5 py-1.5 hover:bg-orange-700 transition-colors"
                  aria-label="Decrease quantity"
                  id={`btn-decrease-${dish.id}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold min-w-5 text-center">
                  {cartQuantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity + 1)}
                  className="px-2.5 py-1.5 hover:bg-orange-700 transition-colors"
                  aria-label="Increase quantity"
                  id={`btn-increase-${dish.id}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(dish)}
                id={`btn-add-${dish.id}`}
                className="bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1"
              >
                <span>ADD</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <span className="text-xs font-semibold text-stone-400 italic">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};
