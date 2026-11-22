import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Tag,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Navigation,
} from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface SpecialCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (dishId: string, qty: number) => void;
  currentAddressLabel?: string;
  dynamicDeliveryCharge: number;
  deliveryDistanceKm: number;
  onOpenLocationPicker: () => void;
  coupons?: Coupon[];
  deliveryTip: number;
  onUpdateTip: (tip: number) => void;
  onProceedCheckout: (checkoutData: {
    tip: number;
    discount: number;
    couponCode?: string;
  }) => void;
  appliedCouponCode?: string;
  baseDeliveryFee?: number;
  perKmRate?: number;
}

export const SpecialCartDrawer: React.FC<SpecialCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  currentAddressLabel = 'Gopalganj / Siwan',
  dynamicDeliveryCharge,
  deliveryDistanceKm,
  onOpenLocationPicker,
  coupons = [],
  deliveryTip,
  onUpdateTip,
  onProceedCheckout,
  appliedCouponCode: initialCouponCode,
  baseDeliveryFee = 20,
  perKmRate = 8,
}) => {
  const [couponCode, setCouponCode] = useState(initialCouponCode || '');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    isFreeDelivery?: boolean;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [customTipInput, setCustomTipInput] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);

  // Auto-apply if initial coupon provided
  useEffect(() => {
    if (initialCouponCode && !appliedDiscount) {
      handleApplyCoupon(initialCouponCode);
    }
  }, [initialCouponCode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate bill
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = appliedDiscount?.isFreeDelivery ? 0 : dynamicDeliveryCharge;
  const tax = Math.round(subtotal * 0.05);
  const discountAmount = appliedDiscount?.amount || 0;
  const grandTotal = Math.max(0, subtotal + deliveryCharge + tax + deliveryTip - discountAmount);

  const activeCoupons = coupons.filter((c) => c.isActive);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    setCouponError('');

    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const matchedCoupon = activeCoupons.find((c) => c.code.toUpperCase() === code);

    if (!matchedCoupon) {
      setCouponError(`Coupon "${code}" is invalid or expired.`);
      return;
    }

    if (subtotal < matchedCoupon.minOrderValue) {
      setCouponError(
        `Minimum cart value for ${matchedCoupon.code} is ₹${matchedCoupon.minOrderValue}`
      );
      return;
    }

    let calculatedDiscount = 0;
    let isFreeDelivery = false;

    if (matchedCoupon.discountType === 'flat') {
      calculatedDiscount = matchedCoupon.discountValue;
    } else if (matchedCoupon.discountType === 'percentage') {
      const pct = (subtotal * matchedCoupon.discountValue) / 100;
      calculatedDiscount = Math.round(
        matchedCoupon.maxDiscount ? Math.min(matchedCoupon.maxDiscount, pct) : pct
      );
    } else if (matchedCoupon.discountType === 'free_delivery') {
      isFreeDelivery = true;
      calculatedDiscount = dynamicDeliveryCharge;
    }

    setAppliedDiscount({
      code: matchedCoupon.code,
      amount: calculatedDiscount,
      isFreeDelivery,
    });
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponError('');
  };

  const handleSelectTip = (amount: number) => {
    onUpdateTip(amount);
    setShowCustomTip(false);
  };

  const handleApplyCustomTip = () => {
    const parsed = parseInt(customTipInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateTip(parsed);
      setShowCustomTip(false);
    }
  };

  return (
    <div
      id="cart-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="cart-drawer-close-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="text-center">
          <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] leading-tight">
            Your Cart
          </h2>
          <p className="text-[11px] font-semibold text-[#7C4A22]">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Scrollable Cart Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-3xl mx-auto space-y-4">
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#F5E6D3] p-12 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF6B00] mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-[#3D1C0A] text-lg">
                Your cart is empty
              </h3>
              <p className="text-[#7C4A22] text-xs sm:text-sm mt-1 max-w-xs mx-auto">
                Explore our freshly cooked menu or subscribe to our daily tiffins!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 min-h-[46px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm px-6 py-2.5 rounded-2xl shadow-md cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Dynamic GPS Delivery Address Badge */}
              <div className="bg-white p-4 rounded-3xl border border-[#F5E6D3] shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-[#FF6B00] mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF6B00]">
                          Delivering To
                        </span>
                        <span className="text-[11px] bg-orange-50 text-[#3D1C0A] font-extrabold px-2 py-0.5 rounded-lg border border-orange-200 tabular-nums">
                          ~{deliveryDistanceKm.toFixed(1)} km
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#3D1C0A] truncate mt-0.5">
                        {currentAddressLabel}
                      </p>
                      <p className="text-[11px] text-[#7C4A22] mt-0.5 tabular-nums">
                        Per-km rate (₹{baseDeliveryFee} base + ₹{perKmRate}/km)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenLocationPicker}
                    type="button"
                    className="min-h-[40px] px-3 py-1.5 bg-[#FFF8F0] hover:bg-[#FF6B00] hover:text-white text-[#FF6B00] text-xs font-extrabold rounded-xl border border-orange-200 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Change
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-3xl border border-[#F5E6D3] p-4 sm:p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7C4A22]">
                  Selected Items
                </h3>

                {cartItems.map((item) => (
                  <div
                    key={`${item.dishId}_${item.planDuration || 'std'}`}
                    className="flex items-center justify-between gap-3 p-3 bg-[#FFF8F0] rounded-2xl border border-[#F5E6D3]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                        <h4 className="font-bold text-xs sm:text-sm text-[#3D1C0A] truncate">
                          {item.name}
                        </h4>
                      </div>
                      {item.planDuration && (
                        <span className="text-[10px] font-bold text-[#FF6B00] bg-orange-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {item.planDuration}
                        </span>
                      )}
                      <div className="text-xs sm:text-sm font-black text-[#3D1C0A] mt-1 tabular-nums">
                        ₹{item.price * item.quantity}
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-[#7C4A22] font-normal ml-1">
                            (₹{item.price} each)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center bg-white border border-orange-200 rounded-xl shadow-2xs overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.dishId, item.quantity - 1)}
                        className="min-h-[38px] px-2.5 text-[#3D1C0A] hover:bg-orange-50 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                      </button>
                      <span className="px-2.5 text-xs sm:text-sm font-black min-w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.dishId, item.quantity + 1)}
                        className="min-h-[38px] px-2.5 text-[#3D1C0A] hover:bg-orange-50 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Partner Tip Section */}
              <div className="bg-white p-4 rounded-3xl border border-[#F5E6D3] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#3D1C0A]">
                  <span className="flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-[#FF6B00]" />
                    <span>Delivery Partner Tip</span>
                  </span>
                  {deliveryTip > 0 && (
                    <span className="text-[#FF6B00] font-black tabular-nums">₹{deliveryTip}</span>
                  )}
                </div>
                <p className="text-xs text-[#7C4A22]">
                  100% of your tip goes directly to your delivery partner.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[0, 10, 20, 30, 50].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleSelectTip(amount)}
                      className={`min-h-[40px] text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-colors cursor-pointer tabular-nums ${
                        deliveryTip === amount && !showCustomTip
                          ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-xs'
                          : 'bg-[#FFF8F0] text-[#3D1C0A] border-[#F5E6D3] hover:border-orange-300'
                      }`}
                    >
                      {amount === 0 ? 'No Tip' : `₹${amount}`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomTip(!showCustomTip)}
                    className={`min-h-[40px] text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-colors cursor-pointer ${
                      showCustomTip
                        ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                        : 'bg-[#FFF8F0] text-[#3D1C0A] border-[#F5E6D3] hover:border-orange-300'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {showCustomTip && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter tip (₹)"
                      value={customTipInput}
                      onChange={(e) => setCustomTipInput(e.target.value)}
                      className="flex-1 min-h-[42px] bg-[#FFF8F0] text-xs px-3 py-2 rounded-xl border border-[#F5E6D3] focus:outline-none focus:border-[#FF6B00]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTip}
                      className="min-h-[42px] bg-[#3D1C0A] hover:bg-[#FF6B00] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Set Tip
                    </button>
                  </div>
                )}
              </div>

              {/* Coupons / Offers */}
              <div className="bg-white p-4 rounded-3xl border border-[#F5E6D3] shadow-xs space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7C4A22]">
                  Offers &amp; Coupons
                </h3>

                {appliedDiscount ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>Code &quot;{appliedDiscount.code}&quot; applied!</span>
                      <span className="font-black">
                        {appliedDiscount.isFreeDelivery
                          ? 'Free Delivery'
                          : `Save ₹${appliedDiscount.amount}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-600 text-xs underline font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 min-h-[42px] bg-[#FFF8F0] text-xs px-3.5 py-2 rounded-xl border border-[#F5E6D3] focus:outline-none focus:border-[#FF6B00] uppercase font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="min-h-[42px] bg-[#3D1C0A] hover:bg-[#FF6B00] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-red-600 text-xs font-semibold">{couponError}</p>
                    )}

                    {activeCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {activeCoupons.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            title={c.description}
                            className="min-h-[36px] text-xs bg-[#FFF8F0] hover:bg-orange-50 text-[#3D1C0A] hover:text-[#FF6B00] px-3 py-1.5 rounded-xl border border-[#F5E6D3] font-bold transition-colors cursor-pointer"
                          >
                            {c.code} (
                            {c.discountType === 'free_delivery'
                              ? 'Free Delivery'
                              : c.discountType === 'percentage'
                                ? `${c.discountValue}% OFF`
                                : `₹${c.discountValue} OFF`}
                            )
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bill Details Breakdown */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#F5E6D3] shadow-xs space-y-2.5 text-xs sm:text-sm">
                <h3 className="font-display font-black text-[#3D1C0A] border-b border-[#F5E6D3] pb-2">
                  Bill Summary
                </h3>

                <div className="flex justify-between text-[#7C4A22] tabular-nums">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-[#3D1C0A]">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-[#7C4A22] tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <span>Delivery Fee (~{deliveryDistanceKm} km)</span>
                    <button
                      type="button"
                      onClick={onOpenLocationPicker}
                      className="text-xs text-[#FF6B00] font-bold hover:underline cursor-pointer"
                    >
                      (Change)
                    </button>
                  </div>
                  <span className="font-bold text-[#3D1C0A]">
                    {appliedDiscount?.isFreeDelivery ? (
                      <span className="text-emerald-600 font-black">FREE</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-[#7C4A22] tabular-nums">
                  <span>Govt. GST &amp; Safe Packaging (5%)</span>
                  <span className="font-bold text-[#3D1C0A]">₹{tax}</span>
                </div>

                {deliveryTip > 0 && (
                  <div className="flex justify-between text-[#FF6B00] font-bold tabular-nums">
                    <span className="flex items-center gap-1">
                      <HeartHandshake className="w-4 h-4" /> Delivery Partner Tip
                    </span>
                    <span>₹{deliveryTip}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold tabular-nums">
                    <span>Promo Discount ({appliedDiscount?.code})</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-[#F5E6D3] flex justify-between items-baseline font-black text-[#3D1C0A] tabular-nums">
                  <span>Grand Total</span>
                  <span className="text-lg sm:text-xl text-[#FF6B00]">₹{grandTotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-emerald-900 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/70">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Freshly cooked on-order with 100% contactless doorstep delivery.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Footer Proceed Button */}
      {cartItems.length > 0 && (
        <div className="shrink-0 bg-white border-t border-[#F5E6D3] px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="tabular-nums">
              <span className="text-[11px] font-bold text-[#7C4A22] uppercase block">
                To Pay
              </span>
              <span className="text-xl font-black text-[#3D1C0A]">₹{grandTotal}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onProceedCheckout({
                  tip: deliveryTip,
                  discount: discountAmount,
                  couponCode: appliedDiscount?.code,
                });
              }}
              id="cart-proceed-checkout-btn"
              className="flex-1 min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black py-3 px-5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-98 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
