import React from 'react';
import { 
  X, 
  PhoneCall, 
  MessageCircle, 
  ShieldCheck, 
  History, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Lock,
  ChevronRight,
  Smartphone,
  Info
} from 'lucide-react';
import { DeliveryArea, AdminSettings } from '../types';

interface AppMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onOpenAdmin: () => void;
  onOpenOrderHistory: () => void;
  areas: DeliveryArea[];
}

export const AppMoreModal: React.FC<AppMoreModalProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenAdmin,
  onOpenOrderHistory,
  areas
}) => {
  if (!isOpen) return null;

  const handleCallHelpline = () => {
    window.location.href = `tel:${settings.helplineNumber}`;
  };

  const handleWhatsApp = () => {
    const rawNumber = settings.whatsappNumber || settings.helplineNumber || '7091472879';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const intlNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const text = encodeURIComponent('Hello Satyam Singh, I need assistance with my Hello Bite order/tiffin subscription.');
    window.open(`https://wa.me/${intlNumber}?text=${text}`, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* App Sheet Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
              HB
            </div>
            <div>
              <h3 className="font-display font-extrabold text-stone-900 text-base leading-tight">
                Hello Bite Express
              </h3>
              <p className="text-stone-500 text-xs">
                App Support, Account &amp; Management
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Contact Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCallHelpline}
              id="app-more-call-btn"
              className="bg-orange-600 hover:bg-orange-700 active:scale-97 text-white p-3.5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center"
            >
              <PhoneCall className="w-5 h-5 text-white" />
              <span className="text-xs font-black">Call Helpline</span>
              <span className="text-[10px] text-orange-100 font-mono font-medium">
                {settings.helplineNumber}
              </span>
            </button>

            <button
              onClick={handleWhatsApp}
              id="app-more-whatsapp-btn"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white p-3.5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-xs font-black">WhatsApp Chat</span>
              <span className="text-[10px] text-emerald-100 font-medium">
                Instant Reply
              </span>
            </button>
          </div>

          {/* Customer Past Orders */}
          <div className="bg-stone-50 rounded-2xl p-1 border border-stone-200/80">
            <button
              onClick={() => {
                onClose();
                onOpenOrderHistory();
              }}
              id="app-more-orders-history-btn"
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">My Past Orders &amp; Receipts</div>
                  <div className="text-[11px] text-stone-500">View previous orders and reorder instantly</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Admin / Staff Portal Button */}
          <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-500/30">
                  Staff Access
                </span>
                <h4 className="font-display font-extrabold text-sm text-white mt-1.5">
                  Admin &amp; Kitchen Portal
                </h4>
                <p className="text-stone-400 text-xs mt-0.5">
                  Manage live food orders, dish listings, pricing &amp; revenue live.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-stone-800 text-orange-400">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              id="app-more-admin-login-btn"
              className="w-full mt-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Log in to Admin Dashboard</span>
            </button>
          </div>

          {/* Delivery Coverage Areas */}
          <div className="border border-stone-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Delivery Zones &amp; Timing</span>
              </div>
              <span className="text-[11px] text-stone-500">Live Rates</span>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {areas.map((area) => (
                <div key={area.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-700">{area.name}</div>
                    <div className="text-[10px] text-stone-400">Avg. ETA: {area.estimatedTime}</div>
                  </div>
                  <div className="font-bold text-orange-600">₹{area.charge}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Hours & Safe Food Assurance */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Operations &amp; Helpline</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Open 7:00 AM to 11:30 PM (All 7 Days). Managed by <strong>{settings.contactPersonName}</strong>. 
              All items prepared fresh in hygienic kitchen with quality oil and fresh produce.
            </p>
          </div>

          {/* Median Web-to-App Badge */}
          <div className="text-center pt-2 pb-1 text-stone-400 text-[11px] flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-stone-400" />
            <span>Hello Bite App • Optimized for Median Web-to-App</span>
          </div>
        </div>
      </div>
    </div>
  );
};
