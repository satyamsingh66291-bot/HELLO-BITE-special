import React, { useState } from 'react';
import { TiffinPlan, CartItem } from '../types';
import { Utensils, CheckCircle, ShieldCheck, Flame, Calendar, Sparkles } from 'lucide-react';

interface DailyTiffinSectionProps {
  plans: TiffinPlan[];
  onAddTiffinToCart: (item: CartItem) => void;
}

export const DailyTiffinSection: React.FC<DailyTiffinSectionProps> = ({
  plans,
  onAddTiffinToCart
}) => {
  // Store selected duration per plan
  const [durations, setDurations] = useState<Record<string, 'Daily' | 'Weekly (7 Days)' | 'Monthly (30 Days)'>>({
    tiffin_breakfast: 'Weekly (7 Days)',
    tiffin_lunch: 'Monthly (30 Days)',
    tiffin_dinner: 'Weekly (7 Days)',
    tiffin_fullday: 'Monthly (30 Days)'
  });

  const handleSelectDuration = (planId: string, duration: 'Daily' | 'Weekly (7 Days)' | 'Monthly (30 Days)') => {
    setDurations(prev => ({ ...prev, [planId]: duration }));
  };

  const handleAddToCart = (plan: TiffinPlan) => {
    const selectedDur = durations[plan.id] || 'Weekly (7 Days)';
    let price = plan.priceWeekly;
    if (selectedDur === 'Daily') price = plan.pricePerDay;
    if (selectedDur === 'Monthly (30 Days)') price = plan.priceMonthly;

    const cartItem: CartItem = {
      dishId: `${plan.id}_${selectedDur}`,
      name: `${plan.name} [${selectedDur}]`,
      price,
      quantity: 1,
      image: plan.image,
      isVeg: true,
      isTiffin: true,
      planDuration: selectedDur
    };

    onAddTiffinToCart(cartItem);
  };

  return (
    <section id="daily-tiffin-section" className="py-8 bg-linear-to-b from-amber-50/60 to-orange-50/40 rounded-3xl p-4 sm:p-8 border border-amber-200/70 my-8 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-200/70 text-amber-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Utensils className="w-3.5 h-3.5 text-orange-600" />
            <span>Maa Ke Hath Ka Khana • Daily Tiffin Service</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Daily Healthy Subscription Meals
          </h2>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            Pure home-style nourishing breakfast, lunch & dinner delivered hot in insulated stainless tiffins. Zero preservatives, 100% hygiene.
          </p>
        </div>

        {/* Value Props Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-700">
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Insulated Hot Tiffin
          </span>
          <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-orange-600" /> Pause / Resume Anytime
          </span>
        </div>
      </div>

      {/* Grid of Tiffin Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const selectedDur = durations[plan.id] || 'Weekly (7 Days)';
          let displayPrice = plan.priceWeekly;
          let perMealApprox = Math.round(plan.priceWeekly / 7);

          if (selectedDur === 'Daily') {
            displayPrice = plan.pricePerDay;
            perMealApprox = plan.pricePerDay;
          } else if (selectedDur === 'Monthly (30 Days)') {
            displayPrice = plan.priceMonthly;
            perMealApprox = Math.round(plan.priceMonthly / 30);
          }

          return (
            <div
              key={plan.id}
              id={`tiffin-card-${plan.id}`}
              className="bg-white rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Photo & Tag */}
                <div className="relative h-44 overflow-hidden bg-stone-100">
                  <img
                    src={plan.image}
                    alt={plan.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {plan.tag && (
                    <div className="absolute top-2.5 left-2.5 bg-orange-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{plan.tag}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-stone-900/85 text-stone-200 font-semibold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>{plan.caloriesApprox}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {plan.type}
                  </span>
                  <h3 className="font-bold text-stone-900 text-base mt-1.5 leading-snug">
                    {plan.name}
                  </h3>
                  <p className="text-stone-500 text-xs mt-1 leading-relaxed line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Included Items List */}
                  <div className="mt-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Today&apos;s Menu Includes:
                    </div>
                    {plan.mealsIncluded.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-stone-700">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{m}</span>
                      </div>
                    ))}
                  </div>

                  {/* Duration Selector Tabs */}
                  <div className="mt-4">
                    <label className="text-[11px] font-bold text-stone-500 block mb-1.5">
                      Choose Meal Duration:
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => handleSelectDuration(plan.id, 'Daily')}
                        className={`py-1 rounded-lg transition-colors text-[11px] ${
                          selectedDur === 'Daily'
                            ? 'bg-white text-orange-600 shadow-xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        1 Day
                      </button>
                      <button
                        onClick={() => handleSelectDuration(plan.id, 'Weekly (7 Days)')}
                        className={`py-1 rounded-lg transition-colors text-[11px] ${
                          selectedDur === 'Weekly (7 Days)'
                            ? 'bg-white text-orange-600 shadow-xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        onClick={() => handleSelectDuration(plan.id, 'Monthly (30 Days)')}
                        className={`py-1 rounded-lg transition-colors text-[11px] ${
                          selectedDur === 'Monthly (30 Days)'
                            ? 'bg-white text-orange-600 shadow-xs font-bold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        30 Days
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Add Button */}
              <div className="p-4 pt-0">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xl font-extrabold text-stone-900">
                      ₹{displayPrice}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">
                      / {selectedDur === 'Daily' ? 'day' : selectedDur === 'Weekly (7 Days)' ? '7 days' : 'month'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ~₹{perMealApprox}/meal
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(plan)}
                  id={`btn-tiffin-add-${plan.id}`}
                  className="w-full bg-stone-900 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Subscribe Tiffin Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
