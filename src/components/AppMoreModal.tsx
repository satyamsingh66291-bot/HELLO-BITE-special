import React from 'react';
import {
  X,
  PhoneCall,
  MessageCircle,
  History,
  Clock,
  ChevronRight,
  Shield,
  RefreshCw,
  Scale,
  FileText,
  User,
  LogOut,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { AdminSettings, AppUser } from '../types';
import type { PolicyTab } from './PolicyModal';

interface AppMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  currentUser: AppUser | null;
  currentAddressLabel?: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOrderHistory: () => void;
  onOpenLocationPicker?: () => void;
  onOpenPolicy?: (tab?: PolicyTab) => void;
}

export const AppMoreModal: React.FC<AppMoreModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  currentAddressLabel,
  onOpenAuth,
  onLogout,
  onOpenOrderHistory,
  onOpenLocationPicker,
  onOpenPolicy,
}) => {
  if (!isOpen) return null;

  const handleCallHelpline = () => {
    window.location.href = `tel:${settings.helplineNumber}`;
  };

  const handleWhatsApp = () => {
    const rawNumber = settings.whatsappNumber || settings.helplineNumber || '7091472879';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const intlNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const text = encodeURIComponent(
      'Hello Bite Support, I need assistance with my food order.'
    );
    window.open(`https://wa.me/${intlNumber}?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FFF8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-[#FF6B00] to-[#F59E0B] flex items-center justify-center text-white font-black text-base shadow-sm">
              HB
            </div>
            <div>
              <h3 className="font-display font-extrabold text-[#3D1C0A] text-base leading-tight">
                My Profile
              </h3>
              <p className="text-[#7C4A22] text-xs">
                Account, Orders, Support &amp; Policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-orange-100 hover:bg-orange-200 text-[#3D1C0A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Customer Gmail Profile Card */}
          {currentUser ? (
            <div className="bg-[#FFF8F0] rounded-2xl p-4 border border-orange-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#FF6B00] to-amber-500 text-white font-black text-lg flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-display font-black text-sm text-[#3D1C0A] truncate">
                      {currentUser.name}
                    </h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#7C4A22] truncate">
                    {currentUser.email || `+91 ${currentUser.phoneNumber}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="text-[11px] font-bold text-[#FF6B00] hover:underline mt-0.5 cursor-pointer"
                  >
                    Manage Profile
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              id="profile-sign-in-btn"
              className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white p-4 rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-between gap-3 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-display font-black text-sm">
                    Sign In with Gmail
                  </div>
                  <div className="text-[11px] text-orange-100">
                    Save addresses &amp; track live orders
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white shrink-0" />
            </button>
          )}

          {/* Delivery Location & Past Orders */}
          <div className="bg-stone-50 rounded-2xl p-1.5 border border-stone-200/80 space-y-1">
            {onOpenLocationPicker && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLocationPicker();
                }}
                id="profile-saved-location-btn"
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">Saved Delivery Pin</div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {currentAddressLabel || 'Tap to set location on Google Maps'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrderHistory();
              }}
              id="app-more-orders-history-btn"
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    My Orders &amp; Receipts
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Track current orders &amp; reorder meals
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            </button>
          </div>

          {/* Quick Support Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCallHelpline}
              id="app-more-call-btn"
              className="bg-[#FF6B00] hover:brightness-105 active:scale-97 text-white p-3.5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 text-white" />
              <span className="text-xs font-black">Call Support</span>
              <span className="text-[10px] text-orange-100 font-mono font-medium">
                {settings.helplineNumber}
              </span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              id="app-more-whatsapp-btn"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white p-3.5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-xs font-black">WhatsApp Help</span>
              <span className="text-[10px] text-emerald-100 font-medium">
                Instant Support
              </span>
            </button>
          </div>

          {/* Privacy Policy, Terms of Service & Refund Rules */}
          <div className="border border-stone-200 rounded-2xl p-3.5 space-y-2 bg-stone-50/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Shield className="w-4 h-4 text-[#FF6B00]" />
              <span>Privacy Policy &amp; Terms of Service</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('privacy');
                }}
                id="more-privacy-policy-btn"
                className="w-full bg-white hover:bg-orange-50/50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <Shield className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('terms');
                }}
                id="more-terms-service-btn"
                className="w-full bg-white hover:bg-orange-50/50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('refund');
                }}
                id="more-refund-policy-btn"
                className="w-full bg-white hover:bg-orange-50/50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Refund &amp; Cancellation Policy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('contact');
                }}
                id="more-grievance-officer-btn"
                className="w-full bg-white hover:bg-orange-50/50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <Scale className="w-3.5 h-3.5 text-stone-700" />
                  <span>Grievance &amp; Support Contact</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>
          </div>

          {/* Kitchen Operating Hours */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Service Hours</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              Open daily 7:00 AM – 11:30 PM. Managed by <strong>{settings.contactPersonName}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
