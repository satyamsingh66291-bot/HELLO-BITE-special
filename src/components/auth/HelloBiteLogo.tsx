import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface HelloBiteLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export const HelloBiteLogo: React.FC<HelloBiteLogoProps> = ({
  size = 'md',
  subtitle,
}) => {
  const iconBoxClass =
    size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : size === 'sm'
        ? 'w-8 h-8 rounded-xl'
        : 'w-11 h-11 rounded-2xl';
  const titleClass =
    size === 'lg'
      ? 'text-3xl sm:text-4xl'
      : size === 'sm'
        ? 'text-lg'
        : 'text-2xl';

  return (
    <div className="inline-flex flex-col items-center">
      <div className="flex items-center gap-2.5">
        <div
          className={`${iconBoxClass} bg-linear-to-br from-[#FF6B00] via-[#FF8811] to-[#F59E0B] flex items-center justify-center text-white shadow-lg shadow-orange-500/30 border border-white/40 relative`}
        >
          <UtensilsCrossed
            className={size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
          />
        </div>
        <div className="text-left leading-none">
          <div className={`font-display font-black tracking-tight ${titleClass}`}>
            <span className="text-[#3D1C0A]">Hello</span>{' '}
            <span className="text-[#FF6B00]">Bite</span>
          </div>
          {subtitle && (
            <div className="text-[11px] font-bold text-[#9A5B25] mt-1 tracking-wide">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
