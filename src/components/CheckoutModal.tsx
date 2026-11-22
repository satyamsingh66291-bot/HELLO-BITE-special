import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  Banknote,
  MapPin,
  Phone,
  User,
  Compass,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { CartItem, PaymentMethod, Order, OrderStatus, AppUser } from '../types';
import { sendTelegramOrderNotification } from '../utils/notifications';
import {
  validateDeliveryZone,
  calculateDynamicDeliveryPricing,
  getLocalityFromCoords,
  GeoCoordinates,
  KitchenHubConfig,
  GOPALGANJ_COORDS,
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
  onOpenPolicy,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(
    currentUser?.phoneNumber && currentUser.phoneNumber !== '0000000000'
      ? currentUser.phoneNumber
      : ''
  );
  const [address, setAddress] = useState(initialAddressLabel || '');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [deliveryTip] = useState(initialDeliveryTip);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<GeoCoordinates | null>(initialCoords);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [confirmedDeliveryForGopalganjSiwan, setConfirmedDeliveryForGopalganjSiwan] =
    useState(false);

  const kitchenHub = adminSettings.kitchenHub || GOPALGANJ_COORDS;

  useEffect(() => {
    if (currentUser) {
      if (!name) setName(currentUser.name);
      if (
        !phone &&
        currentUser.phoneNumber &&
        currentUser.phoneNumber !== '0000000000'
      ) {
        setPhone(currentUser.phoneNumber);
      }
      if (
        !address &&
        currentUser.savedAddresses &&
        currentUser.savedAddresses.length > 0
      ) {
        setAddress(currentUser.savedAddresses[0].address);
      }
    }
  }, [currentUser]);

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fallbackCoords: GeoCoordinates = gpsCoords || {
    latitude: kitchenHub.lat,
    longitude: kitchenHub.lng,
  };
  const dynamicPricing = calculateDynamicDeliveryPricing(
    fallbackCoords,
    adminSettings.baseDeliveryFee ?? 20,
    adminSettings.perKmRate ?? 8,
    kitchenHub,
    roadDistanceKm
  );
  const isFreeDelivery =
    discount >= dynamicPricing.calculatedFee && couponCode === 'HELLOFREE';
  const deliveryCharge = isFreeDelivery ? 0 : dynamicPricing.calculatedFee;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + deliveryCharge + tax + deliveryTip - discount);

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
          accuracy: pos.coords.accuracy,
        };
        setGpsCoords(coords);
        const loc = getLocalityFromCoords(coords);
        const [geocodedAddr, routeInfo] = await Promise.all([
          reverseGeocodeCoords(coords.latitude, coords.longitude),
          computeRouteDistance(
            { lat: kitchenHub.lat, lng: kitchenHub.lng },
            { lat: coords.latitude, lng: coords.longitude }
          ),
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
            setGpsError(
              'GPS permission was denied. Please allow location access in your browser or confirm your address below.'
            );
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
        maximumAge: 60000,
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
      errs.address =
        'Please enter complete delivery street address in Gopalganj or Siwan';
    }

    if (gpsCoords) {
      const zone = validateDeliveryZone(gpsCoords, kitchenHub);
      if (!zone.isInServiceZone && !confirmedDeliveryForGopalganjSiwan) {
        errs.location = `Your detected GPS is ~${zone.closestDistanceKm} km away from ${
          kitchenHub.name || 'the kitchen'
        }. Please confirm below if ordering for a recipient within our active delivery zone.`;
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
      const orderStatus: OrderStatus =
        paymentMethod === 'Cash on Delivery'
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
        gpsCoordinates: gpsCoords || undefined,
        locationVerified: Boolean(
          dynamicPricing.isServiceable || confirmedDeliveryForGopalganjSiwan
        ),
        deliveryDistrict: nearestDistrict,
      };

      const { storeService } = await import('../services/storeService');
      const placedOrder = storeService.placeOrder(orderPayload);
      storeService.incrementUserOrderCount(phone);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

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
      setErrors({
        form: 'An error occurred placing your order. Please try again or call our helpline.',
      });
    }
  };

  return (
    <div
      id="checkout-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="checkout-close-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] tracking-tight">
          Checkout &amp; Payment
        </h2>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Scrollable Checkout Form */}
      <form
        id="checkout-order-form"
        onSubmit={handlePlaceOrder}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-3xl mx-auto space-y-4">
            {errors.form && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl border border-red-200 text-xs font-semibold">
                {errors.form}
              </div>
            )}

            {/* 1. GPS Real-time Location Detector Bar */}
            <div className="bg-white border border-[#F5E6D3] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5 fill-orange-100" />
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6B00] block">
                      GPS Doorstep Delivery Validation
                    </span>
                    <p className="text-xs sm:text-sm text-[#3D1C0A] font-semibold mt-0.5">
                      {dynamicPricing.isServiceable
                        ? `~${dynamicPricing.distanceKm} km from ${dynamicPricing.nearestHubName}`
                        : 'Detect your live GPS location for doorstep delivery'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDetectLocation(true)}
                  disabled={gpsLoading}
                  id="checkout-gps-detect-btn"
                  className="min-h-[40px] bg-[#FFF8F0] hover:bg-orange-100 text-[#FF6B00] text-xs font-extrabold px-3.5 py-2 rounded-xl border border-orange-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {gpsLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Compass className="w-3.5 h-3.5" />
                  )}
                  <span>{gpsCoords ? 'Refresh GPS' : 'Detect GPS'}</span>
                </button>
              </div>

              <div className="pt-2.5 border-t border-[#F5E6D3] flex items-center justify-between text-xs sm:text-sm tabular-nums">
                <span className="text-[#7C4A22]">
                  Dynamic Distance Fee ({dynamicPricing.distanceKm} km):
                </span>
                <span className="font-black text-[#3D1C0A]">
                  {isFreeDelivery ? (
                    <span className="text-emerald-700">FREE (HELLOFREE)</span>
                  ) : (
                    <>
                      ₹{deliveryCharge}{' '}
                      <span className="text-[11px] text-[#7C4A22] font-normal">
                        ({dynamicPricing.displayBreakdown})
                      </span>
                    </>
                  )}
                </span>
              </div>

              {gpsError && (
                <p className="text-red-700 text-xs bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                  {gpsError}
                </p>
              )}

              {errors.location && (
                <div className="bg-amber-50 text-amber-900 p-3 rounded-2xl border border-amber-200 text-xs space-y-2">
                  <p className="font-semibold">{errors.location}</p>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={confirmedDeliveryForGopalganjSiwan}
                      onChange={(e) =>
                        setConfirmedDeliveryForGopalganjSiwan(e.target.checked)
                      }
                      className="w-4 h-4 text-[#FF6B00] rounded"
                    />
                    <span>
                      Yes, the recipient address is in Gopalganj or Siwan district
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. Customer Contact & Address Details */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#FF6B00] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Satyam Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      id="checkout-name-input"
                      className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-[#FF6B00] absolute left-3 pointer-events-none" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      id="checkout-phone-input"
                      className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00] focus:bg-white tracking-wider transition-all"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase tracking-wider mb-1">
                  Delivery Street Address in Gopalganj / Siwan *
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-[#FF6B00] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="House/Flat No., Mohalla, Ward, Street Name"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    id="checkout-address-input"
                    className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                  />
                </div>
                {errors.address && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase tracking-wider mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Darbar Cinema / Railway Station"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  id="checkout-landmark-input"
                  className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00] focus:bg-white"
                />
              </div>
            </div>

            {/* 3. Payment Method Selection */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-2.5">
              <label className="block text-xs font-extrabold text-[#7C4A22] uppercase tracking-wider">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-[#F5E6D3] hover:border-orange-300'
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
                    <div className="font-bold text-xs sm:text-sm text-[#3D1C0A] flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-[11px] text-[#7C4A22] mt-0.5 tabular-nums">
                      Pay ₹{total} in cash when your hot food arrives.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                    paymentMethod === 'UPI QR / Online'
                      ? 'border-[#FF6B00] bg-orange-50/70 shadow-xs'
                      : 'border-[#F5E6D3] hover:border-orange-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI QR / Online"
                    checked={paymentMethod === 'UPI QR / Online'}
                    onChange={() => setPaymentMethod('UPI QR / Online')}
                    className="mt-1 text-[#FF6B00] focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#3D1C0A] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#FF6B00]" />
                      <span>UPI QR / GooglePay / PhonePe</span>
                    </div>
                    <p className="text-[11px] text-[#7C4A22] mt-0.5">
                      Scan rider QR or pay online on delivery.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Bill Summary */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-2 text-xs sm:text-sm tabular-nums">
              <div className="font-display font-black text-[#3D1C0A] pb-2 border-b border-[#F5E6D3]">
                Bill Summary
              </div>
              <div className="flex justify-between text-[#7C4A22]">
                <span>
                  Item Total ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)
                </span>
                <span className="font-bold text-[#3D1C0A]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#7C4A22]">
                <span>Dynamic Delivery Fee ({dynamicPricing.distanceKm} km)</span>
                <span className="font-bold text-[#3D1C0A]">
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-black">FREE</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-[#7C4A22]">
                <span>GST &amp; Restaurant Packaging (5%)</span>
                <span className="font-bold text-[#3D1C0A]">₹{tax}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              {deliveryTip > 0 && (
                <div className="flex justify-between text-[#7C4A22]">
                  <span>Delivery Partner Tip</span>
                  <span className="font-bold text-[#3D1C0A]">₹{deliveryTip}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-[#F5E6D3] flex justify-between font-black text-[#3D1C0A] text-sm sm:text-base">
                <span>To Pay</span>
                <span className="text-[#FF6B00] text-lg">₹{total}</span>
              </div>
            </div>

            {onOpenPolicy && (
              <div className="text-xs text-[#7C4A22] text-center space-x-1.5 pb-2">
                <span>By placing order you agree to our</span>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('privacy')}
                  className="text-[#FF6B00] hover:underline font-bold cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('terms')}
                  className="text-[#FF6B00] hover:underline font-bold cursor-pointer"
                >
                  Terms of Service
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('refund')}
                  className="text-[#FF6B00] hover:underline font-bold cursor-pointer"
                >
                  Refund Policy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Confirm Bar */}
        <div className="shrink-0 bg-white border-t border-[#F5E6D3] px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="max-w-3xl mx-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              id="checkout-confirm-order-btn"
              className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 active:scale-98 disabled:opacity-50 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer tabular-nums"
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
          </div>
        </div>
      </form>
    </div>
  );
};
