import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ChefHat,
  Bike,
  CheckCircle2,
  RotateCcw,
  ShoppingBag,
  HeartHandshake,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Order, CartItem } from '../types';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onTrackOrder: (order: Order) => void;
  onReorder: (items: CartItem[]) => void;
  onExploreMenu: () => void;
}

export const CustomerOrderHistoryModal: React.FC<CustomerOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onTrackOrder,
  onReorder,
  onExploreMenu,
}) => {
  const [phoneFilter, setPhoneFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredOrders = phoneFilter.trim()
    ? orders.filter(
        (o) =>
          o.phone.includes(phoneFilter.trim()) ||
          o.orderNumber.includes(phoneFilter.trim())
      )
    : orders;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
          label: 'Pending Confirmation',
        };
      case 'Accepted':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ChefHat,
          label: 'Accepted & Cooking',
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Bike,
          label: 'Out for Delivery',
        };
      case 'Delivered':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          label: 'Delivered',
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Clock,
          label: status,
        };
    }
  };

  return (
    <div
      id="orders-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="order-history-close-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="text-center">
          <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] leading-tight">
            My Orders
          </h2>
          <p className="text-[11px] font-semibold text-[#7C4A22]">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Filter Bar (if multiple orders exist) */}
      {orders.length > 2 && (
        <div className="bg-white border-b border-[#F5E6D3] px-4 sm:px-6 py-2.5 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order # or phone number..."
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="w-full min-h-[42px] bg-[#FFF8F0] text-xs sm:text-sm pl-10 pr-3.5 py-2 rounded-xl border border-[#F5E6D3] text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
        </div>
      )}

      {/* Orders List / Empty State */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-3xl mx-auto space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#F5E6D3] p-12 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF6B00] mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-display font-black text-[#3D1C0A] text-lg">
                No orders yet
              </h3>
              <p className="text-[#7C4A22] text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                Explore our sizzling fast food, biryani, or daily home-cooked tiffin thalis!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreMenu();
                }}
                className="mt-5 min-h-[46px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-sm px-6 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Browse Menu Now
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#F5E6D3] p-10 text-center text-[#7C4A22] text-sm">
              No orders matched &ldquo;{phoneFilter}&rdquo;
            </div>
          ) : (
            filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              const dateFormatted = new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#F5E6D3] p-4 sm:p-5 shadow-xs space-y-3.5"
                >
                  {/* Top Bar of Order */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F5E6D3] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#3D1C0A] text-sm sm:text-base tabular-nums">
                          #{order.orderNumber}
                        </span>
                        <span className="text-stone-400 text-xs">•</span>
                        <span className="text-xs text-[#7C4A22]">{dateFormatted}</span>
                      </div>
                      <div className="text-xs text-[#7C4A22] mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                        <span>{order.areaName}</span>
                      </div>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[#3D1C0A]">
                        <span className="font-medium">
                          <span className="text-[#FF6B00] font-black">{item.quantity}×</span>{' '}
                          {item.name}
                        </span>
                        <span className="font-mono font-bold tabular-nums">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown & Tip */}
                  <div className="bg-[#FFF8F0] rounded-2xl p-3 text-xs space-y-1 text-[#7C4A22] border border-[#F5E6D3]">
                    <div className="flex justify-between tabular-nums">
                      <span>Items Subtotal:</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span>Delivery Fee:</span>
                      <span>₹{order.deliveryCharge}</span>
                    </div>
                    {Boolean(order.deliveryTip && order.deliveryTip > 0) && (
                      <div className="flex justify-between text-emerald-700 font-semibold tabular-nums">
                        <span className="flex items-center gap-1">
                          <HeartHandshake className="w-3.5 h-3.5" /> Delivery Partner Tip:
                        </span>
                        <span>₹{order.deliveryTip}</span>
                      </div>
                    )}
                    {Boolean(order.discount && order.discount > 0) && (
                      <div className="flex justify-between text-emerald-600 font-semibold tabular-nums">
                        <span>Coupon Discount:</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#3D1C0A] font-black pt-1.5 border-t border-[#F5E6D3] text-xs sm:text-sm tabular-nums">
                      <span>Total Paid ({order.paymentMethod}):</span>
                      <span className="text-[#FF6B00]">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onTrackOrder(order);
                      }}
                      className="min-h-[44px] bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-extrabold text-xs px-4 py-2 rounded-xl border border-orange-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Track Order</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReorder(order.items);
                      }}
                      className="min-h-[44px] bg-[#3D1C0A] hover:bg-[#FF6B00] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Order Again</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
