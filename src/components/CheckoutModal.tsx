import React, { useState } from 'react';
import { X, CheckCircle2, QrCode, Banknote, CreditCard, Send, MapPin, Phone, User, MessageSquare, HeartHandshake, Tag } from 'lucide-react';
import { CartItem, DeliveryArea, PaymentMethod, Order } from '../types';
import { sendTelegramOrderNotification } from '../utils/notifications';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  selectedArea: DeliveryArea;
  areas: DeliveryArea[];
  onSelectArea: (area: DeliveryArea) => void;
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
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  selectedArea,
  areas,
  onSelectArea,
  onOrderPlaced,
  deliveryTip: initialDeliveryTip = 0,
  discount = 0,
  couponCode,
  adminSettings
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [deliveryTip, setDeliveryTip] = useState(initialDeliveryTip);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryCharge = selectedArea.charge;
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal + deliveryCharge + tax + deliveryTip - discount);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phone.trim().replace(/\D/g, ''))) {
      errs.phone = 'Enter valid 10-digit Indian phone number';
    }
    if (!address.trim() || address.trim().length < 8) {
      errs.address = 'Please enter complete delivery address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        areaId: selectedArea.id,
        areaName: selectedArea.name,
        deliveryCharge,
        deliveryTip,
        couponApplied: couponCode ? { code: couponCode, discount } : undefined,
        items: cartItems,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        customerNotes: notes.trim() || undefined,
      };

      // Push to store (local and Firebase Firestore)
      const { storeService } = await import('../services/storeService');
      const placedOrder = storeService.placeOrder(orderPayload);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // Telegram notification to Admin Group if configured
      if (adminSettings.telegramBotToken && adminSettings.telegramChatId) {
        sendTelegramOrderNotification(
          placedOrder,
          adminSettings.telegramBotToken,
          adminSettings.telegramChatId
        ).catch(console.warn);
      }

      // Direct Firebase Database order placed - no WhatsApp redirection!
      onOrderPlaced(placedOrder);
      setIsSubmitting(false);

    } catch (err) {
      console.error('Error placing order in Firebase store:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
              Complete Your Order
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Instant dispatch to {adminSettings.helplineName}&apos;s kitchen team
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handlePlaceOrder} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-600" />
              <span>Contact & Delivery Info</span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                id="checkout-name-input"
                className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              />
              {errors.name && <p className="text-red-500 text-[11px] mt-0.5">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phone Number (for order delivery updates) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 text-xs sm:text-sm font-bold">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  id="checkout-phone-input"
                  className={`w-full text-xs sm:text-sm pl-12 pr-3.5 py-2.5 rounded-xl border ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-stone-300'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[11px] mt-0.5">{errors.phone}</p>}
            </div>

            {/* Delivery Area Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Delivery Location / Area *</span>
              </label>
              <select
                value={selectedArea.id}
                onChange={(e) => {
                  const area = areas.find(a => a.id === e.target.value);
                  if (area) onSelectArea(area);
                }}
                id="checkout-area-select"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — Delivery Fee: ₹{a.charge} ({a.estimatedTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Full Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Street Address, House/Flat No. *
              </label>
              <textarea
                rows={2}
                placeholder="Flat 302, Green Valley Apartments, Near City Park"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                id="checkout-address-input"
                className={`w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border ${
                  errors.address ? 'border-red-500 bg-red-50' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              />
              {errors.address && <p className="text-red-500 text-[11px] mt-0.5">{errors.address}</p>}
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="Opposite SBI Bank / Behind Metro Gate 2"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Delivery Partner Tip In Checkout */}
          <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="flex items-center gap-1.5 text-orange-800">
                <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
                <span>Rider Tip (100% goes to Delivery Partner)</span>
              </span>
              <span className="font-extrabold text-orange-700">₹{deliveryTip}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 10, 20, 30, 50].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDeliveryTip(t)}
                  className={`text-xs px-2.5 py-1 rounded-xl border font-bold transition-colors cursor-pointer ${
                    deliveryTip === t
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300'
                  }`}
                >
                  {t === 0 ? 'None' : `₹${t}`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              Select Payment Mode
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-orange-600 bg-orange-50/80 text-orange-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Cash on Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI QR / Online')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'UPI QR / Online'
                    ? 'border-orange-600 bg-orange-50/80 text-orange-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <QrCode className="w-5 h-5 text-orange-600" />
                <span className="text-xs">UPI QR / GPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card on Delivery')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'Card on Delivery'
                    ? 'border-orange-600 bg-orange-50/80 text-orange-950 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">Card on Delivery</span>
              </button>
            </div>

            {paymentMethod === 'UPI QR / Online' && (
              <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Delivery rider carries an active UPI QR code (GPay/PhonePe/Paytm) directly to your door.</span>
              </div>
            )}
          </div>

          {/* Cooking Instructions */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-stone-400" />
              <span>Cooking & Delivery Notes (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Less spicy, extra green chutney, ring doorbell"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Quick Bill Summary */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Items Total ({cartItems.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee ({selectedArea.name.split('(')[0]})</span>
              <span>₹{deliveryCharge}</span>
            </div>
            {deliveryTip > 0 && (
              <div className="flex justify-between text-orange-700 font-semibold">
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5" /> Delivery Partner Tip
                </span>
                <span>₹{deliveryTip}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Coupon Discount ({couponCode})
                </span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Govt. Tax (5% GST)</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex justify-between font-extrabold text-stone-900 text-sm pt-1.5 border-t border-stone-200">
              <span>Grand Total To Pay:</span>
              <span className="text-orange-600 font-display text-base">₹{total}</span>
            </div>
          </div>

          {/* Direct Firebase Database Notice */}
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Direct Kitchen Dispatch: Order is saved to Firebase Database &amp; alerts Satyam Singh in real-time.</span>
          </div>

          {/* Place Order Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="checkout-submit-order-btn"
            className="w-full bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving to Firebase Database...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Order (₹{total})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
