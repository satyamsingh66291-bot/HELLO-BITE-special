import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Clock,
  Package,
  DollarSign,
  LogOut,
  Store,
  AlertTriangle,
  Volume2,
  VolumeX,
  User,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  Headphones,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Order, RiderProfile, RiderRecord, AppUser } from '../types';
import { storeService } from '../services/storeService';
import { audioAlert } from '../utils/audioAlert';
import confetti from 'canvas-confetti';

interface RiderDashboardProps {
  orders: Order[];
  currentUser?: AppUser | null;
  onBackToStore: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export const RiderDashboard: React.FC<RiderDashboardProps> = ({
  orders,
  currentUser,
  onBackToStore,
  onOpenAdmin,
  onLogout,
}) => {
  const [rider, setRider] = useState<RiderProfile>(() =>
    storeService.getRiderProfile()
  );
  const [registeredRiders, setRegisteredRiders] = useState<RiderRecord[]>(() =>
    storeService.getRiders()
  );
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>(
    'available'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [riderName, setRiderName] = useState(rider.name);
  const [riderPhone, setRiderPhone] = useState(rider.phone);
  const [riderBike, setRiderBike] = useState(rider.bikeNumber);
  const [selectedHub, setSelectedHub] = useState<
    'Gopalganj Central Kitchen' | 'Siwan Express Hub'
  >(rider.hub);

  const [confirmDeliveredOrder, setConfirmDeliveredOrder] =
    useState<Order | null>(null);

  useEffect(() => {
    const unsub = storeService.subscribeRiders((list) =>
      setRegisteredRiders(list)
    );
    return () => unsub();
  }, []);

  const myRiderRecord =
    registeredRiders.find(
      (r) =>
        (currentUser?.id && r.userId === currentUser.id) ||
        (currentUser?.phoneNumber &&
          r.personalDetails.phoneNumber === currentUser.phoneNumber)
    ) || null;

  useEffect(() => {
    if (myRiderRecord) {
      setRider((prev) => ({
        ...prev,
        id: myRiderRecord.userId,
        name: myRiderRecord.personalDetails.fullName || prev.name,
        phone: myRiderRecord.personalDetails.phoneNumber || prev.phone,
        bikeNumber: myRiderRecord.vehicleDetails.vehicleNumber || prev.bikeNumber,
        isOnline: myRiderRecord.availability,
      }));
    }
  }, [myRiderRecord]);

  const unassignedOrders = orders.filter(
    (o) =>
      (o.status === 'Pending' ||
        o.status === 'Order Placed - Pay Cash on Delivery' ||
        o.status === 'Accepted') &&
      (!o.riderInfo || o.riderInfo.name === rider.name)
  );

  const myActiveOrders = orders.filter(
    (o) =>
      (o.status === 'Accepted' || o.status === 'Out for Delivery') &&
      o.riderInfo?.name === rider.name
  );

  const completedTodayOrders = orders.filter(
    (o) =>
      o.status === 'Delivered' &&
      (o.riderInfo?.name === rider.name || !o.riderInfo)
  );

  const [lastKnownCount, setLastKnownCount] = useState<number>(
    unassignedOrders.length
  );
  useEffect(() => {
    if (
      unassignedOrders.length > lastKnownCount &&
      soundEnabled &&
      rider.isOnline
    ) {
      audioAlert.playRiderAlert();
    }
    setLastKnownCount(unassignedOrders.length);
  }, [unassignedOrders.length, soundEnabled, rider.isOnline]);

  const handleToggleOnline = () => {
    const nextOnline = !rider.isOnline;
    const updated = { ...rider, isOnline: nextOnline };
    setRider(updated);
    storeService.saveRiderProfile(updated);
    if (myRiderRecord) {
      storeService.updateRiderAvailability(myRiderRecord.userId, nextOnline);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: RiderProfile = {
      ...rider,
      name: riderName.trim() || 'Rider Sonu Kumar',
      phone: riderPhone.trim() || '7091472879',
      bikeNumber: riderBike.trim() || 'BR-28-AB-4521',
      hub: selectedHub,
    };
    setRider(updated);
    storeService.saveRiderProfile(updated);
    setShowProfileModal(false);
  };

  const handleAcceptOrder = (order: Order) => {
    const riderInfo = {
      name: rider.name,
      phone: rider.phone,
      bikeNumber: rider.bikeNumber,
      currentStep: 2,
    };
    storeService.updateOrderRider(order.id, riderInfo, 'Accepted');
    audioAlert.playWhatsAppNotificationSound();
    setActiveTab('active');
  };

  const handlePickedUpOrder = (order: Order) => {
    const riderInfo = {
      ...(order.riderInfo || {
        name: rider.name,
        phone: rider.phone,
        bikeNumber: rider.bikeNumber,
      }),
      currentStep: 3,
    };
    storeService.updateOrderRider(order.id, riderInfo, 'Out for Delivery');
    audioAlert.playWhatsAppNotificationSound();
  };

  const handleFinalizeDelivery = (order: Order) => {
    const riderInfo = {
      ...(order.riderInfo || {
        name: rider.name,
        phone: rider.phone,
        bikeNumber: rider.bikeNumber,
      }),
      currentStep: 4,
    };
    storeService.updateOrderRider(order.id, riderInfo, 'Delivered');

    const updatedRider: RiderProfile = {
      ...rider,
      todayDeliveriesCount: rider.todayDeliveriesCount + 1,
      todayCashCollected:
        order.paymentMethod === 'Cash on Delivery'
          ? rider.todayCashCollected + order.total
          : rider.todayCashCollected,
      todayTips: rider.todayTips + (order.deliveryTip || 0),
    };
    setRider(updatedRider);
    storeService.saveRiderProfile(updatedRider);

    setConfirmDeliveredOrder(null);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const totalCodToDeposit = completedTodayOrders
    .filter((o) => o.paymentMethod === 'Cash on Delivery')
    .reduce((acc, o) => acc + o.total, 0);

  const totalTipsToday = completedTodayOrders.reduce(
    (acc, o) => acc + (o.deliveryTip || 0),
    0
  );

  const estimatedEarnings =
    completedTodayOrders.length * 40 + totalTipsToday + (myRiderRecord?.earnings.today || 0);
  const acceptanceRate = myRiderRecord?.earnings.acceptanceRate || 98;

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#3D1C0A] flex flex-col font-sans pb-16 selection:bg-orange-500 selection:text-white">
      {/* Orange / Cream Signature Header ("Hello Bite Rider") */}
      <header className="sticky top-0 z-40 bg-linear-to-b from-[#FF6B00] via-[#FF7E1A] to-[#FF9436] text-white shadow-xl rounded-b-3xl">
        <div className="max-w-6xl mx-auto px-4 pt-3.5 pb-4 space-y-3.5">
          {/* Top Nav Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-sm">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-lg tracking-tight">
                    Hello Bite Rider
                  </span>
                  <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                    {rider.bikeNumber}
                  </span>
                </div>
                <p className="text-xs text-orange-100 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {rider.name} · {rider.hub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Order Chime' : 'Unmute Order Chime'}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-70" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                title="Rider Settings"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="hidden sm:flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={onBackToStore}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Store</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-white/15 hover:bg-red-600 text-white cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3-Card Hero Metric Row (Today's Deliveries | Earnings | Acceptance) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white/18 backdrop-blur-sm border border-white/25 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black leading-none">
                {completedTodayOrders.length}
              </div>
              <div className="text-[11px] font-bold text-orange-100 mt-1">
                Today&apos;s Deliveries
              </div>
            </div>
            <div className="bg-white/18 backdrop-blur-sm border border-white/25 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black leading-none">
                ₹{estimatedEarnings}
              </div>
              <div className="text-[11px] font-bold text-orange-100 mt-1">
                Earnings
              </div>
            </div>
            <div className="bg-white/18 backdrop-blur-sm border border-white/25 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black leading-none">
                {acceptanceRate}%
              </div>
              <div className="text-[11px] font-bold text-orange-100 mt-1">
                Acceptance
              </div>
            </div>
          </div>

          {/* Go Online Switch Card */}
          <div className="bg-white text-[#3D1C0A] rounded-2xl p-3 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  rider.isOnline
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm leading-tight">
                  {rider.isOnline ? 'Online · Receiving Orders' : 'Go Online'}
                </div>
                <div className="text-[11px] text-stone-500 font-medium">
                  {rider.isOnline
                    ? `COD Cash In Hand: ₹${totalCodToDeposit}`
                    : 'Tap switch to start receiving orders'}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={rider.isOnline}
              onClick={handleToggleOnline}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                rider.isOnline ? 'bg-[#FF6B00]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  rider.isOnline ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 w-full flex-1 pt-4 space-y-4">
        {/* Partner KYC Status Notice if registered */}
        {myRiderRecord && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
              myRiderRecord.approvalStatus === 'approved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : myRiderRecord.approvalStatus === 'rejected'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                KYC Verification Status:{' '}
                <strong className="uppercase">{myRiderRecord.approvalStatus}</strong>{' '}
                (DL: {myRiderRecord.vehicleDetails.drivingLicenceNumber})
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions Strip */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className="bg-white hover:bg-orange-50 rounded-2xl p-2.5 border border-orange-100 shadow-2xs flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-[#3D1C0A] truncate">
              My Earnings
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className="bg-white hover:bg-orange-50 rounded-2xl p-2.5 border border-orange-100 shadow-2xs flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-[#3D1C0A] truncate">
              Order History
            </span>
          </button>
          <a
            href="tel:7091472879"
            className="bg-white hover:bg-orange-50 rounded-2xl p-2.5 border border-orange-100 shadow-2xs flex flex-col items-center gap-1"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-[#3D1C0A] truncate">
              Support
            </span>
          </a>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="bg-white hover:bg-orange-50 rounded-2xl p-2.5 border border-orange-100 shadow-2xs flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-[#3D1C0A] truncate">
              Profile
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'available'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Live Drops ({unassignedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Active Trips ({myActiveOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-stone-600 hover:bg-orange-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Delivered ({completedTodayOrders.length})</span>
          </button>
        </div>

        {/* Offline Warning */}
        {!rider.isOnline && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                You are currently <strong>OFFLINE</strong>. Switch online to accept live deliveries.
              </span>
            </div>
            <button
              onClick={handleToggleOnline}
              className="bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
            >
              Go Online
            </button>
          </div>
        )}

        {/* AVAILABLE ORDERS TAB */}
        {activeTab === 'available' && (
          <div>
            {unassignedOrders.length === 0 ? (
              <div className="bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                    Listening Live on Firestore
                  </span>
                  <h3 className="font-display font-black text-2xl mt-2">
                    Ride More, Earn More
                  </h3>
                  <p className="text-xs text-orange-100 mt-1 max-w-sm">
                    New customer food &amp; tiffin orders in Gopalganj and Siwan drop here instantly with a live chime.
                  </p>
                  {!rider.isOnline && (
                    <button
                      type="button"
                      onClick={handleToggleOnline}
                      className="mt-3 bg-white text-[#FF6B00] font-black text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Go Online</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center shrink-0">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {unassignedOrders.map((order) => {
                  const cleanPhone = order.phone.replace(/\D/g, '').slice(-10);
                  const isCod = order.paymentMethod === 'Cash on Delivery';
                  const isAccepted = order.status === 'Accepted';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-orange-200 hover:border-[#FF6B00] transition-all p-4 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 border-b border-orange-100 pb-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-[#FF6B00]">
                                #{order.orderNumber}
                              </span>
                              <span className="text-[10px] bg-orange-50 text-[#7C4A22] px-2 py-0.5 rounded-md font-bold">
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {order.deliveryDistanceKm && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                                  ~{order.deliveryDistanceKm.toFixed(1)} km
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-[#3D1C0A] text-base mt-1">
                              {order.customerName}
                            </h3>
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                              isCod
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isCod
                              ? `COD: ₹${order.total}`
                              : `PAID: ₹${order.total}`}
                          </div>
                        </div>

                        <div className="bg-[#FFF8F0] p-3 rounded-2xl border border-orange-100 space-y-2 mb-3">
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[#3D1C0A]">
                                {order.address}
                              </p>
                              {order.landmark && (
                                <p className="text-[11px] text-stone-500">
                                  Landmark: {order.landmark}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1.5 border-t border-orange-100">
                            <a
                              href={`tel:${order.phone}`}
                              className="flex-1 bg-white hover:bg-orange-50 text-[#3D1C0A] font-bold text-xs py-2 px-2.5 rounded-xl border border-orange-200 flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Namaste ${order.customerName}! I am ${rider.name}, your Hello Bite delivery partner (${rider.bikeNumber}). I am on the way with order #${order.orderNumber}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${
                                order.gpsCoordinates
                                  ? `${order.gpsCoordinates.latitude},${order.gpsCoordinates.longitude}`
                                  : encodeURIComponent(`${order.address}, Bihar`)
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Map</span>
                            </a>
                          </div>
                        </div>

                        <div className="space-y-1 mb-3 text-xs text-stone-700">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {item.quantity}× {item.name}
                              </span>
                              <span className="font-bold">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-orange-100">
                        {isAccepted ? (
                          <button
                            onClick={() => handlePickedUpOrder(order)}
                            className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-extrabold text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Package className="w-4 h-4" />
                            <span>Picked Up &amp; Start Riding</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Accept Order (#{order.orderNumber})</span>
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

        {/* MY ACTIVE TRIPS TAB */}
        {activeTab === 'active' && (
          <div>
            {myActiveOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-orange-100 max-w-lg mx-auto">
                <Bike className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h3 className="font-display font-black text-base text-[#3D1C0A]">
                  No Active Trips Assigned
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Accept an order from Live Drops to begin your delivery trip.
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 bg-[#FF6B00] text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  View Live Drops
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myActiveOrders.map((order) => {
                  const cleanPhone = order.phone.replace(/\D/g, '').slice(-10);
                  const isCod = order.paymentMethod === 'Cash on Delivery';
                  const isOutForDelivery = order.status === 'Out for Delivery';

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border-2 border-[#FF6B00] p-4 shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-orange-100 pb-2 mb-3">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                            {isOutForDelivery
                              ? '● Out for Delivery'
                              : '● Accepted · Pick Up Now'}
                          </span>
                          <span className="text-xs font-mono font-black text-[#FF6B00]">
                            #{order.orderNumber}
                          </span>
                        </div>

                        <div className="bg-[#FFF8F0] p-3.5 rounded-2xl border border-orange-100 mb-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-base font-extrabold text-[#3D1C0A]">
                                {order.customerName}
                              </h3>
                              <p className="text-xs text-stone-600">{order.address}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-stone-400">
                                Bill
                              </span>
                              <div className="text-base font-black text-[#3D1C0A]">
                                ₹{order.total}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-2.5 rounded-xl text-xs font-bold ${
                              isCod
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {isCod
                              ? `💵 COLLECT ₹${order.total} CASH ON DELIVERY`
                              : `✅ PREPAID ONLINE · NO CASH TO COLLECT`}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <a
                              href={`tel:${order.phone}`}
                              className="bg-white border border-orange-200 text-[#3D1C0A] font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                `Hello ${order.customerName}! I am ${rider.name}, your Hello Bite delivery partner. Arriving shortly.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${
                                order.gpsCoordinates
                                  ? `${order.gpsCoordinates.latitude},${order.gpsCoordinates.longitude}`
                                  : encodeURIComponent(`${order.address}, Bihar`)
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-stone-900 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Navigate</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-orange-100">
                        {!isOutForDelivery ? (
                          <button
                            onClick={() => handlePickedUpOrder(order)}
                            className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Package className="w-4 h-4" />
                            <span>Picked Up &amp; Start Riding</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeliveredOrder(order)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark as Delivered</span>
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

        {/* DELIVERED TODAY TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-3.5 border border-orange-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FF6B00]" />
                <span className="font-bold">COD Cash Collected Today:</span>
                <strong className="text-base text-[#3D1C0A]">
                  ₹{totalCodToDeposit}
                </strong>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <HeartHandshake className="w-4 h-4" />
                <span>Tips: ₹{totalTipsToday}</span>
              </div>
            </div>

            {completedTodayOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-orange-100">
                <CheckCircle2 className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h3 className="font-bold text-base text-[#3D1C0A]">
                  No Completed Deliveries Yet
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Delivered orders and COD cash summaries appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTodayOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white p-3.5 rounded-2xl border border-orange-100 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#3D1C0A]">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-stone-500">
                            {ord.customerName}
                          </span>
                        </div>
                        <p className="text-stone-500 truncate max-w-xs">
                          {ord.address}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#3D1C0A] text-sm">
                        ₹{ord.total}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">
                        {ord.paymentMethod === 'Cash on Delivery'
                          ? 'COD Collected'
                          : 'Prepaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* RIDER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-[#3D1C0A]">
            <h3 className="font-display font-black text-lg mb-1">
              Rider Profile &amp; Vehicle
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Displayed on customer live order tracking cards.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Rider Full Name</label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full bg-[#FFF8F0] px-3 py-2 rounded-xl border border-orange-200"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full bg-[#FFF8F0] px-3 py-2 rounded-xl border border-orange-200"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={riderBike}
                  onChange={(e) => setRiderBike(e.target.value)}
                  className="w-full bg-[#FFF8F0] px-3 py-2 rounded-xl border border-orange-200 uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Assigned Hub</label>
                <select
                  value={selectedHub}
                  onChange={(e) =>
                    setSelectedHub(
                      e.target.value as
                        | 'Gopalganj Central Kitchen'
                        | 'Siwan Express Hub'
                    )
                  }
                  className="w-full bg-[#FFF8F0] px-3 py-2 rounded-xl border border-orange-200"
                >
                  <option value="Gopalganj Central Kitchen">
                    Gopalganj Central Kitchen
                  </option>
                  <option value="Siwan Express Hub">Siwan Express Hub</option>
                </select>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-stone-100 text-stone-700 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF6B00] text-white font-extrabold py-2.5 rounded-xl cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELIVERED MODAL */}
      {confirmDeliveredOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-orange-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-[#3D1C0A]">
            <h3 className="font-display font-black text-lg">
              Complete Delivery Handover
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Order #{confirmDeliveredOrder.orderNumber} for{' '}
              {confirmDeliveredOrder.customerName}
            </p>
            <div className="bg-[#FFF8F0] border border-orange-200 p-4 rounded-2xl my-4 text-xs">
              {confirmDeliveredOrder.paymentMethod === 'Cash on Delivery' ? (
                <>
                  <strong className="text-amber-800 block uppercase mb-1">
                    💵 Collect Cash on Delivery:
                  </strong>
                  <div className="text-2xl font-black text-[#FF6B00]">
                    ₹{confirmDeliveredOrder.total}
                  </div>
                </>
              ) : (
                <div className="font-bold text-emerald-700">
                  ✅ Online Payment Verified (₹{confirmDeliveredOrder.total})
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeliveredOrder(null)}
                className="flex-1 bg-stone-100 text-stone-700 font-bold py-2.5 rounded-xl cursor-pointer text-xs"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleFinalizeDelivery(confirmDeliveredOrder)}
                className="flex-1 bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl cursor-pointer text-xs"
              >
                Confirm &amp; Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
