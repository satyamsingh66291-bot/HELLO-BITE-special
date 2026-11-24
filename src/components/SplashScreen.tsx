import React, { useEffect, useState } from 'react';
import { Utensils, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const finishTimer = setTimeout(() => {
        onFinished();
      }, 500); // 500ms fade transition
      return () => clearTimeout(finishTimer);
    }, 2800); // ~3 seconds total splash

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-linear-to-br from-[#FF6B00] via-[#E65C00] to-[#CC5200] flex flex-col items-center justify-between p-6 text-white transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full flex justify-end pt-4">
        <span className="text-[11px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
          Food &amp; Super Delivery
        </span>
      </div>

      <div className="flex flex-col items-center text-center my-auto space-y-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white shadow-2xl flex items-center justify-center relative animate-bounce duration-1000">
          <div className="absolute -top-2 -right-2 bg-amber-400 text-stone-900 rounded-full p-2 shadow-md">
            <Sparkles className="w-5 h-5 fill-stone-900 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <Utensils className="w-14 h-14 text-[#FF6B00]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white drop-shadow-md">
            HELLO BITE
          </h1>
          <p className="text-sm sm:text-base text-orange-100 font-semibold tracking-wide">
            Good Food. Great Speed. Better Life.
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center pb-6 space-y-3">
        <div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div className="w-full h-full bg-white rounded-full animate-pulse" />
        </div>
        <span className="text-[11px] text-orange-100 font-medium tracking-wider">
          Gopalganj &amp; Siwan&apos;s Trusted App
        </span>
      </div>
    </div>
  );
};
