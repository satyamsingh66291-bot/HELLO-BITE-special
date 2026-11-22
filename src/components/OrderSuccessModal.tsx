import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Headphones,
  Phone,
  MapPin,
  Bike,
  Banknote,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Check,
  Star,
  Clock,
  Store,
  RefreshCw,
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { Order, CartItem } from '../types';
import { GOPALGANJ_COORDS, KitchenHubConfig } from '../utils/geoUtils';
import { useGoogleMapsApiKey } from '../utils/mapsClient';
import trackingMapImg from '../assets/images/order_tracking_map_1794636850065.jpg';
import foodBowlImg from '../assets/images/role_food_bowl_1794635221244.jpg';

interface OrderSuccessModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onDismissActiveOrder?: () => void;
  onReorder?: (items: CartItem[]) => void;
  helplineName: string;
  helplineNumber: string;
  whatsappNumber: string;
  kitchenHub?: KitchenHubConfig;
}

const TrackingMapContent: React.FC<{
  hub: KitchenHubConfig;
  dest: { lat: number; lng: number };
  currentStep: number;
  riderName: string;
  fallbackImg: React.ReactNode;
}> = ({ hub, dest, currentStep, riderName, fallbackImg }) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <>{fallbackImg}</>;
  }

  const progressRatio =
    currentStep >= 3 ? 1 : currentStep === 2 ? 0.58 : currentStep === 1 ? 0.15 : 0.05;
  const riderLat = hub.lat + (dest.lat - hub.lat) * progressRatio;
  const riderLng = hub.lng + (dest.lng - hub.lng) * progressRatio;
  const midLat = (hub.lat + dest.lat) / 2;
  const midLng = (hub.lng + dest.lng) / 2;

  return (
    <div className="relative h-[36vh] min-h-[240px] sm:h-[40vh] w-full overflow-hidden bg-[#F9EFE6]">
      {(status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFF8F0] text-[#7C4A22] gap-2 z-10">
          <RefreshCw className="w-5 h-5 text-[#FF6B00] animate-spin" />
          <span className="text-xs font-bold">Loading live delivery map...</span>
        </div>
      )}
      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={{ lat: midLat, lng: midLng }}
        defaultZoom={13}
        gestureHandling="cooperative"
        disableDefaultUI={true}
        zoomControl={true}
      >
        {/* Kitchen Origin Marker */}
        <AdvancedMarker position={{ lat: hub.lat, lng: hub.lng }} title={hub.name || 'Kitchen'}>
          <Pin background="#3D1C0A" borderColor="#FFFFFF" glyphColor="#FF6B00">
            <Store className="w-3.5 h-3.5" />
          </Pin>
        </AdvancedMarker>

        {/* Live Rider Marker */}
        <AdvancedMarker position={{ lat: riderLat, lng: riderLng }} title={riderName}>
          <Pin background="#F59E0B" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.1}>
            <Bike className="w-3.5 h-3.5" />
          </Pin>
        </AdvancedMarker>

        {/* Customer Doorstep Marker */}
        <AdvancedMarker position={{ lat: dest.lat, lng: dest.lng }} title="Your Doorstep">
          <Pin background="#FF6B00" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.15} />
        </AdvancedMarker>
      </GoogleMap>
    </div>
  );
};

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOpen,
  order,
  onClose,
  onReorder,
  helplineNumber,
  whatsappNumber,
  kitchenHub = GOPALGANJ_COORDS,
}) => {
  const [etaRemainingMins, setEtaRemainingMins] = useState(18);
  const { apiKey } = useGoogleMapsApiKey();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (order) {
      const elapsedMins = Math.floor((Date.now() - order.createdAt) / 60000);
      const remaining = Math.max(5, 22 - elapsedMins);
      setEtaRemainingMins(remaining);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'Order Placed - Pay Cash on Delivery':
      case 'Pending':
        return 0;
      case 'Accepted':
        return 1;
      case 'Out for Delivery':
        return 2;
      case 'Delivered':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  const steps = [
    { label: 'Order Placed' },
    { label: 'Preparing' },
    { label: 'Out for Delivery' },
    { label: 'Delivered' },
  ];

  const headlineMap = [
    order.status === 'Order Placed - Pay Cash on Delivery'
      ? 'Order Placed! Pay Cash on Delivery'
      : 'Order Placed! Kitchen Notified',
    'Kitchen is preparing your meal!',
    'Your order is on the way!',
    'Order Delivered! Enjoy your food!',
  ];

  const riderName = order.riderInfo?.name || 'Ramesh Kumar (Hello Bite Fleet)';
  const riderBike = order.riderInfo?.bikeNumber || 'BR-28-AC-4029';
  const riderPhone = order.riderInfo?.phone || helplineNumber;

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `Hi Hello Bite Support, I am tracking Order #${order.orderNumber}.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  const progressWidthPct = Math.min(100, Math.round((currentStep / 3) * 100));

  const destCoords = order.gpsCoordinates
    ? { lat: order.gpsCoordinates.latitude, lng: order.gpsCoordinates.longitude }
    : { lat: kitchenHub.lat + 0.01, lng: kitchenHub.lng + 0.01 };

  const fallbackIllustratedMap = (
    <div className="relative h-[34vh] min-h-[220px] w-full overflow-hidden bg-[#F9EFE6]">
      <img
        src={trackingMapImg}
        alt="Live Delivery Route Map"
        className="w-full h-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#FFF8F0]/90" />

      <svg
        viewBox="0 0 400 180"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M 110 132 L 285 52"
          stroke="#FF6B00"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="10 6"
          opacity="0.95"
        />
      </svg>

      <div
        className="absolute left-[22%] bottom-[16%] -translate-x-1/2 flex flex-col items-center transition-all duration-700"
        style={{
          transform:
            currentStep >= 3
              ? 'translate(140px, -72px)'
              : currentStep === 2
                ? 'translate(55px, -28px)'
                : 'translate(0px, 0px)',
        }}
      >
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white flex items-center justify-center shadow-lg border-2 border-white">
          <Bike className="w-6 h-6" />
        </div>
        <span className="mt-1 bg-white/95 text-[#3D1C0A] text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs border border-orange-100">
          {currentStep >= 3 ? 'Arrived' : 'Rider'}
        </span>
      </div>

      <div className="absolute right-[20%] top-[16%] flex flex-col items-center">
        <div className="w-11 h-11 rounded-full bg-white text-[#FF6B00] flex items-center justify-center shadow-lg border-3 border-[#FF6B00]">
          <MapPin className="w-5 h-5 fill-orange-100" />
        </div>
        <span className="mt-1 bg-[#3D1C0A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
          Your Doorstep
        </span>
      </div>
    </div>
  );

  return (
    <div
      id="order-tracking-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="order-tracker-close-x-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="text-center">
          <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] leading-tight">
            Order Tracking
          </h2>
          <p className="text-[11px] font-bold text-[#FF6B00] tabular-nums">
            Order #{order.orderNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppSupport}
          className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-orange-50 text-[#FF6B00] flex items-center justify-center transition-colors cursor-pointer"
          title="Customer Support"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </header>

      {/* Scrollable Full-Screen Body */}
      <div className="flex-1 overflow-y-auto pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        {apiKey ? (
          <APIProvider apiKey={apiKey} language="en" region="IN">
            <TrackingMapContent
              hub={kitchenHub}
              dest={destCoords}
              currentStep={currentStep}
              riderName={riderName}
              fallbackImg={fallbackIllustratedMap}
            />
          </APIProvider>
        ) : (
          fallbackIllustratedMap
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6 -mt-5 relative z-10 space-y-4">
          {/* Main Progress Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#F5E6D3] shadow-md">
            <div className="text-center">
              <h3 className="font-display font-black text-lg sm:text-xl text-[#3D1C0A]">
                {headlineMap[currentStep]}
              </h3>
              <p className="text-xs sm:text-sm text-[#7C4A22] font-semibold mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 text-[#FF6B00]" />
                <span>
                  {order.status === 'Delivered'
                    ? 'Delivered safely to your location'
                    : `Arriving in ${etaRemainingMins} min`}
                </span>
              </p>
            </div>

            {/* Horizontal 4-Step Checkmark Bar */}
            <div className="mt-5 relative">
              <div className="absolute top-3.5 left-[10%] right-[10%] h-1 bg-stone-200 rounded-full" />
              <div
                className="absolute top-3.5 left-[10%] h-1 bg-linear-to-r from-[#FF6B00] to-[#F59E0B] rounded-full transition-all duration-500"
                style={{ width: `${Math.round(progressWidthPct * 0.8)}%` }}
              />

              <div className="grid grid-cols-4 gap-1 relative z-10">
                {steps.map((step, idx) => {
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                          isPassed
                            ? 'bg-[#FF6B00] border-white text-white shadow-sm'
                            : 'bg-stone-200 border-white text-stone-400'
                        } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span
                        className={`text-[11px] leading-tight mt-1.5 font-bold ${
                          isPassed ? 'text-[#3D1C0A]' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rider Info Row */}
            <div className="mt-5 pt-4 border-t border-[#F5E6D3] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-black text-sm sm:text-base text-[#3D1C0A] truncate">
                    {riderName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#7C4A22] font-semibold">
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-extrabold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      4.8
                    </span>
                    <span>·</span>
                    <span className="truncate">{riderBike}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${riderPhone}`}
                  className="w-11 h-11 rounded-full bg-[#FFF8F0] hover:bg-orange-100 text-[#FF6B00] border border-orange-200 flex items-center justify-center transition-colors"
                  title="Call Rider"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={handleWhatsAppSupport}
                  className="w-11 h-11 rounded-full bg-[#FFF8F0] hover:bg-orange-100 text-[#FF6B00] border border-orange-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Message Support"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Cash on Delivery Confirmation Banner */}
          {(order.paymentMethod === 'Cash on Delivery' ||
            order.status === 'Order Placed - Pay Cash on Delivery') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-emerald-900">
              <Banknote className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">
                  Order Placed - Pay Cash on Delivery
                </span>
                <span className="text-xs text-emerald-800">
                  Keep <strong className="tabular-nums">₹{order.total}</strong> cash ready when your rider reaches {order.address}.
                </span>
              </div>
            </div>
          )}

          {/* Destination & Bill Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-extrabold text-[#3D1C0A]">
                  {order.customerName} ({order.phone})
                </span>
                <p className="text-xs text-[#7C4A22] mt-0.5">
                  {order.address}
                  {order.landmark ? ` · Near ${order.landmark}` : ''}
                </p>
              </div>
              {order.locationVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" /> GPS OK
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-[#F5E6D3] space-y-1.5 text-xs sm:text-sm">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[#7C4A22]">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-bold text-[#3D1C0A] tabular-nums">
                    ₹{it.price * it.quantity}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-dashed border-orange-200 flex justify-between font-black text-sm text-[#3D1C0A] tabular-nums">
                <span>Total ({order.paymentMethod})</span>
                <span className="text-[#FF6B00]">₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="bg-linear-to-r from-[#FF6B00] via-[#FF7E1A] to-[#F59E0B] rounded-3xl p-5 text-white flex items-center justify-between gap-3 shadow-lg shadow-orange-500/25">
            <div>
              <h4 className="font-display font-black text-lg leading-tight">
                Enjoy your meal!
              </h4>
              <p className="text-xs text-orange-100 font-medium mt-0.5">
                Freshly prepared at Hello Bite Kitchen
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] bg-white text-[#FF6B00] font-black text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Back to Menu
                </button>
                {onReorder && (
                  <button
                    type="button"
                    onClick={() => {
                      onReorder(order.items);
                      onClose();
                    }}
                    className="min-h-[40px] bg-black/20 hover:bg-black/30 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <span>Reorder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <img
              src={foodBowlImg}
              alt="Fresh Hello Bite Meal"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/60 shadow-md shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
