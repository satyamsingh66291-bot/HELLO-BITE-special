import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Banknote, 
  CreditCard, 
  Send, 
  MapPin, 
  Phone, 
  User, 
  MessageSquare, 
  Tag, 
  Compass, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  RefreshCw,
  Sparkles,
  Bike
} from 'lucide-react';
import { CartItem, PaymentMethod, Order, OrderStatus, AppUser, DynamicDeliveryFee } from '../types';
import { sendTelegramOrderNotification } from '../utils/notifications';
import { 
  validateDeliveryZone, 
  calculateDynamicDeliveryPricing,
  getLocalityFromCoords,
  GeoCoordinates,
  KitchenHubConfig,
  GOPALGANJ_COORDS
} from '../utils/geoUtils';
import { computeRouteDistance, reverseGeocodeCoords } from '../utils/mapsClient';
import type { PolicyTab } from './PolicyModal';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: AppUser | null;
  initialCoords: GeoCoordinates | null;
  initialAddressLabel: string;
  onOrderPlaced: (order: Order) => void;
  deliveryTip?: number;
  discount?: number;
  couponCode?: string;
  adminSettings: {
    helplineName: string;
    helplineNumber: string;
    whatsappNumber: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    baseDeliveryFee?: number;
    perKmRate?: number;
    kitchenHub?: KitchenHubConfig;
  };
  onOpenPolicy?: (tab?: PolicyTab) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  initialCoords,
  initialAddressLabel,
  onOrderPlaced,
  deliveryTip: initialDeliveryTip = 0,
  discount = 0,
  couponCode,
  adminSettings,
  onOpenPolicy
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(
    currentUser?.phoneNumber && currentUser.phoneNumber !== '0000000000'
      ? currentUser.phoneNumber
      : ''
  );
  const [address, setAddress] = useState(initialAddressLabel || '');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [deliveryTip, setDeliveryTip] = useState(initialDeliveryTip);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time HTML5 Geolocation state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<GeoCoordinates | null>(initialCoords);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [confirmedDeliveryForGopalganjSiwan, setConfirmedDeliveryForGopalganjSiwan] = useState(false);

  const kitchenHub = adminSettings.kitchenHub || GOPALGANJ_COORDS;

  // Sync if currentUser updates
  useEffect(() => {
    if (currentUser) {
      if (!name) setName(currentUser.name);
      if (!phone && currentUser.phoneNumber && currentUser.phoneNumber !== '0000000000') {
        setPhone(currentUser.phoneNumber);
      }
      if (!address && currentUser.savedAddresses && currentUser.savedAddresses.length > 0) {
        setAddress(currentUser.savedAddresses[0].address);
      }
    }
  }, [currentUser]);

  // Sync initial coords / compute Google Maps road distance on open
  useEffect(() => {
    if (!isOpen) return;
    const coords = initialCoords || gpsCoords;
    if (coords) {
      setGpsCoords(coords);
      void computeRouteDistance(
        { lat: kitchenHub.lat, lng: kitchenHub.lng },
        { lat: coords.latitude, lng: coords.longitude }
      ).then((r) => {
        if (r) setRoadDistanceKm(r.distanceKm);
      });
    } else if (!gpsLoading) {
      handleDetectLocation(false);
    }
  }, [isOpen, initialCoords]);

  if (!isOpen) return null;

  // Dynamic Per-KM Delivery Pricing calculation
  const fallbackCoords: GeoCoordinates = gpsCoords || { latitude: kitchenHub.lat, longitude: kitchenHub.lng };
  const dynamicPricing = calculateDynamicDeliveryPricing(
    fallbackCoords,
    adminSettings.baseDeliveryFee ?? 20,
    adminSettings.perKmRate ?? 8,
    kitchenHub,
    roadDistanceKm
  );
  const isFreeDelivery = discount >= dynamicPricing.calculatedFee && couponCode === 'HELLOFREE';
  const deliveryCharge = isFreeDelivery ? 0 : dynamicPricing.calculatedFee;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + deliveryCharge + tax + deliveryTip - discount);

  // HTML5 Geolocation detection + Google Maps Geocoding & Routes distance
  const handleDetectLocation = (isUserClick = true) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: GeoCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setGpsCoords(coords);
        const loc = getLocalityFromCoords(coords);
        const [geocodedAddr, routeInfo] = await Promise.all([
          reverseGeocodeCoords(coords.latitude, coords.longitude),
          computeRouteDistance(
            { lat: kitchenHub.lat, lng: kitchenHub.lng },
            { lat: coords.latitude, lng: coords.longitude }
          )
        ]);
        if (geocodedAddr) {
          setAddress(geocodedAddr);
        } else if (!address || address === 'Detect GPS Location') {
          setAddress(loc.fullLabel);
        }
        if (routeInfo) {
          setRoadDistanceKm(routeInfo.distanceKm);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (isUserClick) {
          if (err.code === 1) {
            setGpsError('GPS permission was denied. Please allow location access in your browser or confirm your address below.');
          } else if (err.code === 2) {
            setGpsError('Unable to retrieve GPS. Ensure device GPS is turned on.');
          } else {
            setGpsError('GPS request timed out. Please enter your address below.');
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone.trim().replace(/\D/g, ''))) {
      errs.phone = 'Enter valid 10-digit Indian phone number';
    }
    if (!address.trim() || address.trim().length < 6) {
      errs.address = 'Please enter complete delivery street address in Gopalganj or Siwan';
    }

    if (gpsCoords) {
      const zone = validateDeliveryZone(gpsCoords, kitchenHub);
      if (!zone.isInServiceZone && !confirmedDeliveryForGopalganjSiwan) {
        errs.location = `Your detected GPS is ~${zone.closestDistanceKm} km away from ${kitchenHub.name || 'the kitchen'}. Please confirm below if ordering for a recipient within our active delivery zone.`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Set status strictly according to Indus Appstore guidelines:
      // When COD is selected: "Order Placed - Pay Cash on Delivery"
      const orderStatus: OrderStatus = paymentMethod === 'Cash on Delivery'
        ? 'Order Placed - Pay Cash on Delivery'
        : 'Pending';

      const nearestDistrict = dynamicPricing.nearestDistrict;
      const orderPayload = {
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        areaId: `hub_${nearestDistrict.toLowerCase()}`,
        areaName: `${nearestDistrict} Zone (~${dynamicPricing.distanceKm} km from hub)`,
        deliveryCharge,
        deliveryDistanceKm: dynamicPricing.distanceKm,
        deliveryTip,
        couponApplied: couponCode ? { code: couponCode, discount } : undefined,
        items: cartItems,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        status: orderStatus,
        customerNotes: notes.trim() || undefined,
        gpsCoordinates: gpsCoords || undefined,
        locationVerified: Boolean(dynamicPricing.isServiceable || confirmedDeliveryForGopalganjSiwan),
        deliveryDistrict: nearestDistrict
      };

      // Push to store (local and Firebase Firestore)
      const { storeService } = await import('../services/storeService');
      const placedOrder = storeService.placeOrder(orderPayload);
      storeService.incrementUserOrderCount(phone);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // Send background Telegram notification if configured
      if (adminSettings.telegramBotToken && adminSettings.telegramChatId) {
        sendTelegramOrderNotification(
          placedOrder,
          adminSettings.telegramBotToken,
          adminSettings.telegramChatId
        ).catch(console.warn);
      }

      onOrderPlaced(placedOrder);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error submitting order:', err);
      setIsSubmitting(false);
      setErrors({ form: 'An error occurred placing your order. Please try again or call our helpline.' });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 my-4 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-600 rounded-2xl text-white">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Finalise Order &amp; Checkout
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Fast doorstep delivery across Gopalganj &amp; Siwan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="checkout-close-btn"
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePlaceOrder} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errors.form && (
            <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs font-semibold">
              {errors.form}
            </div>
          )}

          {/* 1. GPS Real-time Location Detector Bar */}
          <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-orange-600 shrink-0 mt-0.5 fill-orange-100" />
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-800 block">
                    GPS Doorstep Delivery Validation
                  </span>
                  <p className="text-xs text-stone-700 font-medium mt-0.5">
                    {dynamicPricing.isServiceable
                      ? `~${dynamicPricing.distanceKm} km from ${dynamicPricing.nearestHubName}`
                      : 'Detect your precise live GPS location for doorstep delivery'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDetectLocation(true)}
                disabled={gpsLoading}
                id="checkout-gps-detect-btn"
                className="bg-white hover:bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-300 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                {gpsLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Compass className="w-3.5 h-3.5" />
                )}
                <span>{gpsCoords ? 'Refresh GPS' : 'Detect GPS'}</span>
              </button>
            </div>

            {/* Dynamic Delivery Pricing Transparency Banner */}
            <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between text-xs">
              <span className="text-stone-600">
                Dynamic Distance Fee ({dynamicPricing.distanceKm} km):
              </span>
              <span className="font-extrabold text-stone-900">
                {isFreeDelivery ? (
                  <span className="text-emerald-700">FREE (HELLOFREE Applied)</span>
                ) : (
                  <>₹{deliveryCharge} <span className="text-[10px] text-stone-500 font-normal">({dynamicPricing.displayBreakdown})</span></>
                )}
              </span>
            </div>

            {gpsError && (
              <p className="text-red-700 text-[11px] bg-red-50 p-2 rounded-xl border border-red-200 font-medium">
                {gpsError}
              </p>
            )}

            {errors.location && (
              <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200 text-xs space-y-2">
                <p className="font-semibold">{errors.location}</p>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={confirmedDeliveryForGopalganjSiwan}
                    onChange={(e) => setConfirmedDeliveryForGopalganjSiwan(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Yes, the recipient address is in Gopalganj or Siwan district</span>
                </label>
              </div>
            )}
          </div>

          {/* 2. Customer Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Satyam Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  id="checkout-name-input"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
              {errors.name && <p className="text-red-600 text-[11px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Phone Number (WhatsApp) *
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  id="checkout-phone-input"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white tracking-wider transition-all"
                />
              </div>
              {errors.phone && <p className="text-red-600 text-[11px] mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* 3. Address & Landmark */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Delivery Street Address in Gopalganj / Siwan *
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="House/Flat No., Mohalla, Ward, Colony, Street Name"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  id="checkout-address-input"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
              {errors.address && <p className="text-red-600 text-[11px] mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Darbar Cinema / Thawe Road Petrol Pump / Railway Station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                id="checkout-landmark-input"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          {/* 4. Payment Method Selection (Emphasize COD) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* COD Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Pay ₹{total} in cash when your hot food arrives at your door.
                  </p>
                </div>
              </label>

              {/* UPI Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                  paymentMethod === 'UPI QR / Online'
                    ? 'border-orange-600 bg-orange-50/70 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI QR / Online"
                  checked={paymentMethod === 'UPI QR / Online'}
                  onChange={() => setPaymentMethod('UPI QR / Online')}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-orange-600" />
                    <span>UPI QR / GooglePay / PhonePe</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Scan rider QR or pay online on delivery.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 5. Bill Summary Breakdown */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
            <div className="font-bold text-stone-900 uppercase tracking-wider text-[11px] pb-1 border-b border-stone-200">
              Bill Summary
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Item Total ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Dynamic Delivery Fee ({dynamicPricing.distanceKm} km)</span>
              <span>{isFreeDelivery ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${deliveryCharge}`}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST &amp; Restaurant Packaging (5%)</span>
              <span>₹{tax}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Coupon Discount ({couponCode})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            {deliveryTip > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Delivery Partner Tip</span>
                <span>₹{deliveryTip}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-stone-900 text-sm">
              <span>To Pay</span>
              <span className="text-orange-600 text-base">₹{total}</span>
            </div>
          </div>

          {onOpenPolicy && (
            <div className="text-[11px] text-stone-500 text-center space-x-1.5 pt-1">
              <span>By placing order you agree to our</span>
              <button
                type="button"
                onClick={() => onOpenPolicy('privacy')}
                className="text-orange-600 hover:underline font-semibold"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onOpenPolicy('terms')}
                className="text-orange-600 hover:underline font-semibold"
              >
                Terms of Service
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onOpenPolicy('refund')}
                className="text-orange-600 hover:underline font-semibold"
              >
                Refund Policy
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="checkout-confirm-order-btn"
            className="w-full bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-98 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Confirming Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {paymentMethod === 'Cash on Delivery'
                    ? `Place COD Order · Pay ₹${total}`
                    : `Confirm Order · ₹${total}`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
