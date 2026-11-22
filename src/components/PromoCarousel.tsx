import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Tag } from 'lucide-react';
import promoPizzaImg from '../assets/images/promo_pizza_banner_1794636850745.jpg';
import welcomeFeastImg from '../assets/images/hellobite_welcome_feast_1794635220422.jpg';
import roleFoodImg from '../assets/images/role_food_bowl_1794635221244.jpg';

interface PromoCarouselProps {
  onApplyCoupon: (code: string) => void;
  onExploreTiffin: () => void;
  onExploreFood: () => void;
  appliedCouponCode?: string;
}

interface BannerSlide {
  id: string;
  headlineTop: string;
  headlineBig: string;
  headlineSub: string;
  ctaText: string;
  couponCode?: string;
  actionType: 'coupon' | 'tiffin' | 'menu';
  image: string;
  gradient: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'slide_firstbite',
    headlineTop: 'Flat',
    headlineBig: '50% OFF',
    headlineSub: 'on Your First Order · Code FIRSTBITE',
    ctaText: 'Order Now',
    couponCode: 'FIRSTBITE',
    actionType: 'coupon',
    image: promoPizzaImg,
    gradient: 'from-[#FF5500] via-[#FF7A00] to-[#FFA726]',
  },
  {
    id: 'slide_free_delivery',
    headlineTop: 'Free',
    headlineBig: 'DELIVERY',
    headlineSub: 'Across Gopalganj & Siwan · Code HELLOFREE',
    ctaText: 'Claim Offer',
    couponCode: 'HELLOFREE',
    actionType: 'coupon',
    image: welcomeFeastImg,
    gradient: 'from-[#EA580C] via-[#F97316] to-[#FBBF24]',
  },
  {
    id: 'slide_tiffin',
    headlineTop: 'Pure Desi Ghee',
    headlineBig: 'TIFFINS',
    headlineSub: 'Hot home-style daily meal subscriptions',
    ctaText: 'View Plans',
    actionType: 'tiffin',
    image: roleFoodImg,
    gradient: 'from-[#FF6B00] via-[#F59E0B] to-[#FCD34D]',
  },
];

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  onApplyCoupon,
  onExploreTiffin,
  onExploreFood,
  appliedCouponCode,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = BANNER_SLIDES[currentIndex];
  const isApplied = slide.couponCode && appliedCouponCode === slide.couponCode;

  const handleAction = (s: BannerSlide) => {
    if (s.actionType === 'coupon' && s.couponCode) {
      onApplyCoupon(s.couponCode);
    } else if (s.actionType === 'tiffin') {
      onExploreTiffin();
    } else {
      onExploreFood();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-lg my-3">
      <div
        className={`relative bg-linear-to-r ${slide.gradient} text-white p-5 sm:p-6 min-h-[168px] sm:min-h-[195px] flex items-center justify-between gap-4 transition-all duration-500`}
      >
        {/* Left Promo Copy & CTA matching Screen 4 */}
        <div className="relative z-10 flex-1 space-y-1.5">
          <div className="text-sm sm:text-base font-extrabold text-white/95 leading-none">
            {slide.headlineTop}
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-none drop-shadow-xs">
            {slide.headlineBig}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-orange-50 max-w-xs leading-snug pt-0.5">
            {slide.headlineSub}
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAction(slide)}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-96 ${
                isApplied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#FFE066] hover:bg-[#FFD43B] text-[#3D1C0A]'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{slide.couponCode} Applied</span>
                </>
              ) : (
                <>
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Food Photo Frame */}
        <div className="relative z-10 shrink-0">
          <img
            src={slide.image}
            alt={slide.headlineBig}
            className="w-28 h-28 sm:w-40 sm:h-36 rounded-2xl object-cover border-2 border-white/60 shadow-xl"
          />
          {slide.couponCode && (
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-black text-white/95">
              <Tag className="w-3 h-3" />
              <span>{slide.couponCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Indicator Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {BANNER_SLIDES.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Banner ${idx + 1}`}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
