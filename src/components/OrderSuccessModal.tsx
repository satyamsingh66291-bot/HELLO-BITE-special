import React, { useEffect } from 'react';
import { X, CheckCircle2, Phone, Clock, MapPin, ChefHat, Bike, Home, HeartHandshake, EyeOff } from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onDismissActiveOrder?: () => void;
  helplineName: string;
  helplineNumber: string;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  order,
  onClose,
  onDismissActiveOrder,
  helplineName,
  helplineNumber
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const steps = [
    { status: 'Pending', label: 'Order Received', desc: 'Directly received in Kitchen Admin Panel', icon: Clock },
    { status: 'Accepted', label: 'Accepted & Cooking', desc: 'Freshly preparing your dishes', icon: ChefHat },
    { status: 'Out for Delivery', label: 'Out for Delivery', desc: 'Rider is on the way to you', icon: Bike },
    { status: 'Delivered', label: 'Delivered', desc: 'Order delivered. Enjoy your meal!', icon: Home }
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'Pending': return 0;
      case 'Accepted': return 1;
      case 'Out for Delivery': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Celebration Banner */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            id="order-success-close-x-btn"
            title="Close tracker"
            className="absolute top-3 right-3 p-2 text-white/80 hover:text-white bg-white/15 hover:bg-white/25 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-9 h-9 text-white animate-bounce" />
          </div>

          <h2 className="font-display font-extrabold text-2xl">
            Order Placed Successfully!
          </h2>
          <p className="text-emerald-100 text-xs mt-1">
            Order ID: <span className="font-mono font-bold text-white text-sm">#{order.orderNumber}</span>
          </p>
          <p className="text-[11px] text-emerald-200 mt-0.5">
            Saved to Kitchen Admin in real-time
          </p>
        </div>

        {/* Live Status Tracker */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Live Order Tracker
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {order.status}
              </span>
            </div>

            {/* Stepper */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        isCurrent
                          ? 'bg-orange-600 border-white ring-4 ring-orange-100 text-white'
                          : isPassed
                          ? 'bg-emerald-600 border-white text-white'
                          : 'bg-white border-stone-300 text-stone-400'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <div>
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${
                        isCurrent ? 'text-orange-600' : isPassed ? 'text-stone-900' : 'text-stone-400'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{step.label}</span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Items Details */}
          <div className="text-xs space-y-2 text-stone-700 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Delivering to:</span> {order.customerName} ({order.phone})
                <div className="text-stone-500 text-[11px] mt-0.5">
                  {order.address}, {order.areaName}
                  {order.landmark ? ` (Near ${order.landmark})` : ''}
                </div>
              </div>
            </div>

            {/* Items summary */}
            <div className="pt-2 border-t border-stone-200 text-[11px] space-y-1">
              <div className="font-semibold text-stone-800">Items Ordered:</div>
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-stone-600">
                  <span>{it.name} × {it.quantity}</span>
                  <span>₹{it.price * it.quantity}</span>
                </div>
              ))}
              {Boolean(order.deliveryTip && order.deliveryTip > 0) && (
                <div className="flex justify-between text-emerald-700 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3" /> Delivery Partner Tip
                  </span>
                  <span>₹{order.deliveryTip}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
              <span>Total Amount ({order.paymentMethod}):</span>
              <span className="text-orange-600 text-sm">₹{order.total}</span>
            </div>
          </div>

          {/* Actions: Big primary close button to easily dismiss & helpline */}
          <div className="space-y-2">
            <button
              onClick={onClose}
              id="order-success-close-btn"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all active:scale-98 cursor-pointer"
            >
              <span>Close Tracker & Return to Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${helplineNumber}`}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs border border-stone-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>Call Helpline ({helplineNumber})</span>
              </a>

              {onDismissActiveOrder && (
                <button
                  onClick={() => {
                    onDismissActiveOrder();
                    onClose();
                  }}
                  title="Clear tracker badge from navbar"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 text-xs border border-stone-200 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                  <span>Dismiss</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
