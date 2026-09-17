import React, { useState } from 'react';
import { X, Clock, MapPin, ChefHat, Bike, CheckCircle2, RotateCcw, ShoppingBag, HeartHandshake, AlertCircle, Search } from 'lucide-react';
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
  onExploreMenu
}) => {
  const [phoneFilter, setPhoneFilter] = useState('');

  if (!isOpen) return null;

  const filteredOrders = phoneFilter.trim()
    ? orders.filter(o => o.phone.includes(phoneFilter.trim()) || o.orderNumber.includes(phoneFilter.trim()))
    : orders;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Clock,
          label: 'Pending Confirmation'
        };
      case 'Accepted':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ChefHat,
          label: 'Accepted & Cooking'
        };
      case 'Out for Delivery':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Bike,
          label: 'Out for Delivery'
        };
      case 'Delivered':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
          label: 'Delivered'
        };
      case 'Cancelled':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          label: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          icon: Clock,
          label: status
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 my-4 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-xl text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white">
                My Order History
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed on HelloBite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="order-history-close-btn"
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar (if multiple orders exist) */}
        {orders.length > 2 && (
          <div className="p-3 bg-stone-50 border-b border-stone-200 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by order # or phone number..."
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="w-full bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* Orders List / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">No orders yet</h3>
              <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
                You haven&apos;t placed any orders yet. Try our crispy burgers, paneer tikka, or home-cooked lunch thali!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onExploreMenu();
                }}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Browse Menu Now
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-stone-500 text-xs">
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
                hour12: true
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                >
                  {/* Top Bar of Order */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          #{order.orderNumber}
                        </span>
                        <span className="text-stone-400 text-xs">•</span>
                        <span className="text-xs text-stone-500">{dateFormatted}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-600" />
                        <span>{order.areaName}</span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1.5 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-stone-700">
                        <span className="font-medium">
                          <span className="text-orange-600 font-bold">{item.quantity}×</span> {item.name}
                        </span>
                        <span className="font-mono text-stone-900 font-semibold">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown & Tip */}
                  <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] space-y-1 text-stone-600 border border-stone-100">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{order.deliveryCharge}</span>
                    </div>
                    {Boolean(order.deliveryTip && order.deliveryTip > 0) && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <HeartHandshake className="w-3 h-3" /> Delivery Partner Tip:
                        </span>
                        <span>₹{order.deliveryTip}</span>
                      </div>
                    )}
                    {Boolean(order.discount && order.discount > 0) && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Coupon Discount:</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-900 font-bold pt-1 border-t border-stone-200 text-xs">
                      <span>Total Paid ({order.paymentMethod}):</span>
                      <span className="text-orange-600 text-sm">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onTrackOrder(order);
                      }}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-orange-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onReorder(order.items);
                      }}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Order Again</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
