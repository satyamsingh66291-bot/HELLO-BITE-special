import React from 'react';
import { Bike, Sparkles, Clock, ShieldCheck, Flame, Utensils, HeartHandshake } from 'lucide-react';

interface HeroBannerProps {
  onScrollToTiffin: () => void;
  onExploreDishes: () => void;
  helplineNumber: string;
  helplineName: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onScrollToTiffin,
  onExploreDishes,
  helplineNumber,
  helplineName
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-800 to-orange-950 text-white p-5 sm:p-8 shadow-xl my-4 sm:my-6">
      {/* Decorative Radial Background */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        {/* Top Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 bg-orange-600/90 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
            <Flame className="w-3.5 h-3.5" />
            Fastest Doorstep Delivery
          </span>

          <span className="inline-flex items-center gap-1 bg-white/10 text-amber-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs border border-white/10">
            <Clock className="w-3 h-3 text-orange-400" />
            Hot in 25-35 mins
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
          Craving Delicious Bites or Wholesome Daily Tiffins?
        </h1>

        <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-xl">
          Order fresh crispy burgers, gourmet pizzas, authentic North Indian meals, or subscribe to our hygienic daily tiffin service cooked with pure ghee &amp; love.
        </p>

        {/* Promo Highlights */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-amber-200 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Use <strong>FIRSTBITE</strong> for ₹50 OFF</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-emerald-400" />
            <span>Code <strong>HELLOFREE</strong> for Free Delivery</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            onClick={onExploreDishes}
            className="bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Order Food Now</span>
            <Bike className="w-4 h-4" />
          </button>

          <button
            onClick={onScrollToTiffin}
            className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-xs transition-all active:scale-95 flex items-center gap-2"
          >
            <Utensils className="w-4 h-4 text-amber-300" />
            <span>Daily Tiffin Plans</span>
          </button>
        </div>
      </div>
    </div>
  );
};
