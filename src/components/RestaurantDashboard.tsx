import React, { useState, useEffect } from 'react';
import {
  Store,
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Bike,
  Plus,
  Edit3,
  Trash2,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Power,
  MapPin,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';
import {
  AppUser,
  Dish,
  Order,
  OrderStatus,
  RestaurantRecord,
} from '../types';
import { storeService } from '../services/storeService';
import { DishModal } from './DishModal';

interface RestaurantDashboardProps {
  currentUser: AppUser | null;
  dishes: Dish[];
  orders: Order[];
  onBackToStore: () => void;
  onSaveDish: (dish: Dish) => void;
  onDeleteDish: (dishId: string) => void;
  onToggleDishStock: (dishId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onLogout: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({
  currentUser,
  dishes,
  orders,
  onBackToStore,
  onSaveDish,
  onDeleteDish,
  onToggleDishStock,
  onUpdateOrderStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'profile'>('orders');
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>(() =>
    storeService.getRestaurants()
  );
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  useEffect(() => {
    const unsub = storeService.subscribeRestaurants((list) => setRestaurants(list));
    return () => unsub();
  }, []);

  const myRestaurant =
    restaurants.find(
      (r) =>
        (currentUser?.id && r.ownerId === currentUser.id) ||
        (currentUser?.phoneNumber && r.ownerPhone === currentUser.phoneNumber)
    ) || null;

  const isStoreOpen = myRestaurant ? myRestaurant.isOpen : true;
  const approvalStatus = myRestaurant?.approvalStatus || 'pending';

  const incomingOrders = orders.filter((o) =>
    [
      'Order Placed - Pay Cash on Delivery',
      'Pending',
      'Accepted',
      'Out for Delivery',
    ].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'Delivered');
  const todayRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#3D1C0A] flex flex-col font-sans pb-16">
      {/* Orange / Cream Header */}
      <header className="sticky top-0 z-40 bg-linear-to-r from-[#FF6B00] via-[#FF7B00] to-[#F59E0B] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-lg leading-tight">
                  {myRestaurant?.restaurantName || 'Hello Bite Partner Kitchen'}
                </h1>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    approvalStatus === 'approved'
                      ? 'bg-emerald-500 text-white'
                      : approvalStatus === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-[#FF6B00]'
                  }`}
                >
                  {approvalStatus === 'approved'
                    ? '✓ Verified Partner'
                    : approvalStatus === 'rejected'
                      ? 'Review Required'
                      : 'Pending KYC'}
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">
                {myRestaurant?.address ||
                  `${currentUser?.city || 'Gopalganj'} · Partner ID: ${currentUser?.phoneNumber || 'Verified'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {myRestaurant && (
              <button
                type="button"
                onClick={() =>
                  storeService.toggleRestaurantOpen(
                    myRestaurant.restaurantId,
                    !isStoreOpen
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-sm cursor-pointer transition-all ${
                  isStoreOpen
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isStoreOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToStore}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer App</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/15 hover:bg-red-600 text-white cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="max-w-6xl mx-auto px-4 pb-3.5 grid grid-cols-3 gap-2.5">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 border border-white/20">
            <div className="text-[10px] font-bold uppercase text-orange-100">
              Live Queue
            </div>
            <div className="text-xl font-black mt-0.5">
              {incomingOrders.length} Orders
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 border border-white/20">
            <div className="text-[10px] font-bold uppercase text-orange-100">
              Menu Items
            </div>
            <div className="text-xl font-black mt-0.5">{dishes.length} Dishes</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 border border-white/20">
            <div className="text-[10px] font-bold uppercase text-orange-100">
              Kitchen Revenue
            </div>
            <div className="text-xl font-black mt-0.5">₹{todayRevenue}</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Verification Banner */}
        {approvalStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold block">
                FSSAI &amp; Kitchen Verification In Review
              </strong>
              Your restaurant registration is saved in Firestore. Admin can approve your listing under Admin Portal → Partners &amp; Approvals. You can prepare your menu in the meantime.
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'orders'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Kitchen Orders ({incomingOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'menu'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu Manager ({dishes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'profile'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>FSSAI &amp; Profile</span>
          </button>
        </div>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {incomingOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-orange-100 shadow-xs">
                <Clock className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h3 className="font-display font-black text-base text-[#3D1C0A]">
                  Waiting for New Kitchen Orders
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Orders placed by Gopalganj &amp; Siwan customers will appear here live.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingOrders.map((order) => {
                  const isNew =
                    order.status === 'Pending' ||
                    order.status === 'Order Placed - Pay Cash on Delivery';
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl p-4 border border-orange-100 shadow-sm flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-orange-50 pb-2.5">
                          <div>
                            <span className="font-mono font-black text-sm text-[#FF6B00]">
                              #{order.orderNumber}
                            </span>
                            <h4 className="font-extrabold text-sm text-[#3D1C0A]">
                              {order.customerName}
                            </h4>
                          </div>
                          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200">
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between font-semibold text-stone-700"
                            >
                              <span>
                                {it.quantity}× {it.name}
                              </span>
                              <span>₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-orange-50 flex items-center justify-between text-xs">
                          <span className="text-stone-500 flex items-center gap-1 truncate max-w-[65%]">
                            <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </span>
                          <span className="font-black text-[#3D1C0A]">
                            Bill: ₹{order.total}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isNew && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'Accepted')
                            }
                            className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept &amp; Prepare</span>
                          </button>
                        )}
                        {order.status === 'Accepted' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateOrderStatus(order.id, 'Out for Delivery')
                            }
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Ready · Hand to Rider</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-3.5 border border-orange-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-sm text-[#3D1C0A]">
                  Your Kitchen Menu &amp; Live Stock
                </h3>
                <p className="text-[11px] text-stone-500">
                  Changes sync immediately to customers in Gopalganj &amp; Siwan
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingDish(null);
                  setDishModalOpen(true);
                }}
                className="bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-white rounded-2xl p-3.5 border border-orange-100 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#FF6B00] bg-orange-50 px-1.5 py-0.5 rounded">
                        {dish.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#3D1C0A] truncate mt-1">
                        {dish.name}
                      </h4>
                      <div className="font-black text-sm text-[#3D1C0A]">
                        ₹{dish.price}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-orange-50">
                    <button
                      type="button"
                      onClick={() => onToggleDishStock(dish.id)}
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg cursor-pointer ${
                        dish.isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {dish.isAvailable ? '● In Stock' : '✕ Out of Stock'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDish(dish);
                          setDishModalOpen(true);
                        }}
                        className="p-1.5 text-stone-600 hover:bg-orange-50 rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove "${dish.name}"?`)) {
                            onDeleteDish(dish.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-sm font-black text-[#3D1C0A]">
              <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
              <span>Restaurant Registration &amp; Compliance Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-orange-100">
                <div className="text-stone-500">Restaurant Name</div>
                <div className="font-extrabold text-sm text-[#3D1C0A] mt-0.5">
                  {myRestaurant?.restaurantName || 'Hello Bite Kitchen Partner'}
                </div>
              </div>
              <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-orange-100">
                <div className="text-stone-500">Owner Contact</div>
                <div className="font-extrabold text-sm text-[#3D1C0A] mt-0.5">
                  {myRestaurant?.ownerName || currentUser?.name || 'Partner'} ·{' '}
                  {myRestaurant?.ownerPhone || currentUser?.phoneNumber}
                </div>
              </div>
              <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-orange-100">
                <div className="text-stone-500">FSSAI Licence Number</div>
                <div className="font-extrabold text-sm text-[#3D1C0A] mt-0.5">
                  {myRestaurant?.fssaiNumber || 'Not submitted yet'}
                </div>
              </div>
              <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-orange-100">
                <div className="text-stone-500">Partner Approval Status</div>
                <div className="font-extrabold text-sm text-[#FF6B00] uppercase mt-0.5">
                  {approvalStatus}
                </div>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-stone-500">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                Completed Payouts Today: <strong className="text-[#3D1C0A]">₹{todayRevenue}</strong>
              </span>
            </div>
          </div>
        )}
      </main>

      <DishModal
        isOpen={dishModalOpen}
        onClose={() => setDishModalOpen(false)}
        onSave={onSaveDish}
        dishToEdit={editingDish}
      />
    </div>
  );
};
