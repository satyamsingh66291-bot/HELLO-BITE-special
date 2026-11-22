import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, MapPin, Tag, ShoppingBag, ArrowRight, ShieldCheck, HeartHandshake, Navigation } from 'lucide-react';
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
  perKmRate = 8
}) => {
  const [couponCode, setCouponCode] = useState(initialCouponCode || '');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; isFreeDelivery?: boolean } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [customTipInput, setCustomTipInput] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);

  // Auto-apply if initial coupon provided
  useEffect(() => {
    if (initialCouponCode && !appliedDiscount) {
      handleApplyCoupon(initialCouponCode);
    }
  }, [initialCouponCode]);

  if (!isOpen) return null;

  // Calculate bill
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = appliedDiscount?.isFreeDelivery ? 0 : dynamicDeliveryCharge;
  const tax = Math.round(subtotal * 0.05); // 5% GST & packing
  const discountAmount = appliedDiscount?.amount || 0;
  const grandTotal = Math.max(0, subtotal + deliveryCharge + tax + deliveryTip - discountAmount);

  const activeCoupons = coupons.filter(c => c.isActive);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    setCouponError('');

    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const matchedCoupon = activeCoupons.find(c => c.code.toUpperCase() === code);

    if (!matchedCoupon) {
      setCouponError(`Coupon "${code}" is invalid or expired.`);
      return;
    }

    if (subtotal < matchedCoupon.minOrderValue) {
      setCouponError(`Minimum cart value for ${matchedCoupon.code} is ₹${matchedCoupon.minOrderValue}`);
      return;
    }

    let calculatedDiscount = 0;
    let isFreeDelivery = false;

    if (matchedCoupon.discountType === 'flat') {
      calculatedDiscount = matchedCoupon.discountValue;
    } else if (matchedCoupon.discountType === 'percentage') {
      const pct = (subtotal * matchedCoupon.discountValue) / 100;
      calculatedDiscount = Math.round(matchedCoupon.maxDiscount ? Math.min(matchedCoupon.maxDiscount, pct) : pct);
    } else if (matchedCoupon.discountType === 'free_delivery') {
      isFreeDelivery = true;
      calculatedDiscount = dynamicDeliveryCharge;
    }

    setAppliedDiscount({
      code: matchedCoupon.code,
      amount: calculatedDiscount,
      isFreeDelivery
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-stone-900 leading-tight">
                  Special Menu Cart
                </h2>
                <p className="text-xs text-stone-500">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} ready for fresh preparation
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="cart-drawer-close-btn"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">Your cart is empty</h3>
                <p className="text-stone-500 text-xs mt-1 max-w-xs mx-auto">
                  Explore our sizzling fast food or subscribe to our daily home-cooked tiffins!
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Dynamic GPS Delivery Address Badge */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-2xl border border-orange-200/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Delivering To</span>
                          <span className="text-[10px] bg-orange-100 text-orange-800 font-extrabold px-1.5 py-0.5 rounded-md">
                            ~{deliveryDistanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <p className="text-xs font-bold text-stone-800 truncate mt-0.5">
                          {currentAddressLabel}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Per-km rate (₹{baseDeliveryFee} base + ₹{perKmRate}/km)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onOpenLocationPicker}
                      type="button"
                      className="px-2.5 py-1.5 bg-white hover:bg-orange-600 hover:text-white text-orange-700 text-[11px] font-bold rounded-xl border border-orange-200 shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Change
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Selected Items
                  </h3>

                  {cartItems.map((item) => (
                    <div
                      key={item.dishId}
                      className="flex items-center justify-between gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/70"
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {item.name}
                          </h4>
                        </div>
                        {item.planDuration && (
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-100/70 px-1.5 py-0.2 rounded">
                            {item.planDuration}
                          </span>
                        )}
                        <div className="text-xs font-extrabold text-stone-900 mt-1">
                          ₹{item.price * item.quantity}
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-stone-400 font-normal ml-1">
                              (₹{item.price} each)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Multiplier */}
                      <div className="flex items-center bg-white border border-stone-200 rounded-xl shadow-2xs overflow-hidden shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(item.dishId, item.quantity - 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="px-2 text-xs font-bold min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.dishId, item.quantity + 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Partner Tip Section */}
                <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span className="flex items-center gap-1.5 text-orange-800">
                      <HeartHandshake className="w-4 h-4 text-orange-600" />
                      <span>Delivery Partner Tip</span>
                    </span>
                    {deliveryTip > 0 && (
                      <span className="text-orange-700 font-extrabold">₹{deliveryTip}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    100% of your tip goes directly to your delivery partner.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[0, 10, 20, 30, 50].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleSelectTip(amount)}
                        className={`text-xs px-2.5 py-1 rounded-xl border font-bold transition-colors cursor-pointer ${
                          deliveryTip === amount && !showCustomTip
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300'
                        }`}
                      >
                        {amount === 0 ? 'No Tip' : `₹${amount}`}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomTip(!showCustomTip)}
                      className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition-colors cursor-pointer ${
                        showCustomTip
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300'
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
                        className="flex-1 bg-white text-xs px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomTip}
                        className="bg-stone-900 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Set Tip
                      </button>
                    </div>
                  )}
                </div>

                {/* Coupons / Offers */}
                <div className="pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Offers & Coupons
                  </h3>

                  {appliedDiscount ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Code &quot;{appliedDiscount.code}&quot; applied!</span>
                        <span className="font-bold">
                          {appliedDiscount.isFreeDelivery ? 'Free Delivery' : `Save ₹${appliedDiscount.amount}`}
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-stone-400 hover:text-red-600 text-xs underline font-normal cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 bg-stone-50 text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500 uppercase"
                        />
                        <button
                          onClick={() => handleApplyCoupon()}
                          className="bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-red-500 text-[11px] font-medium">{couponError}</p>
                      )}

                      {/* Admin-Managed Coupon Chips */}
                      {activeCoupons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeCoupons.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleApplyCoupon(c.code)}
                              title={c.description}
                              className="text-[11px] bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-orange-700 px-2 py-1 rounded-lg border border-stone-200 font-medium transition-colors cursor-pointer"
                            >
                              🎉 {c.code} ({c.discountType === 'free_delivery' ? 'Free Delivery' : c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bill Details Breakdown */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-xs">
                  <h3 className="font-bold text-stone-800 text-xs border-b border-stone-200 pb-1.5">
                    Bill Summary
                  </h3>

                  <div className="flex justify-between text-stone-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-stone-900">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <div className="flex items-center gap-1">
                      <span>Delivery Fee (~{deliveryDistanceKm} km)</span>
                      <button
                        onClick={onOpenLocationPicker}
                        className="text-[10px] text-orange-600 font-bold hover:underline"
                      >
                        (Change)
                      </button>
                    </div>
                    <span className="font-semibold text-stone-900">
                      {appliedDiscount?.isFreeDelivery ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryCharge}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Govt. GST & Safe Packaging (5%)</span>
                    <span className="font-semibold text-stone-900">₹{tax}</span>
                  </div>

                  {deliveryTip > 0 && (
                    <div className="flex justify-between text-orange-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5" /> Delivery Partner Tip
                      </span>
                      <span>₹{deliveryTip}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promo Discount ({appliedDiscount?.code})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-extrabold text-stone-900">
                    <span>Grand Total</span>
                    <span className="text-lg text-orange-600">₹{grandTotal}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/50">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Freshly cooked on-order with 100% contactless doorstep delivery.</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Proceed Button */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-white border-t border-stone-200 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>To Pay:</span>
                <span className="text-xl font-extrabold text-stone-900">₹{grandTotal}</span>
              </div>

              <button
                onClick={() => {
                  onProceedCheckout({
                    tip: deliveryTip,
                    discount: discountAmount,
                    couponCode: appliedDiscount?.code
                  });
                }}
                id="cart-proceed-checkout-btn"
                className="w-full bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
