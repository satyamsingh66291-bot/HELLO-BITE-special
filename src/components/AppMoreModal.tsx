import React, { useEffect } from 'react';
import {
  ArrowLeft,
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
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCallHelpline = () => {
    window.location.href = `tel:${settings.helplineNumber}`;
  };

  const handleWhatsApp = () => {
    const rawNumber =
      settings.whatsappNumber || settings.helplineNumber || '7091472879';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const intlNumber = cleanNumber.startsWith('91')
      ? cleanNumber
      : `91${cleanNumber}`;
    const text = encodeURIComponent(
      'Hello Bite Support, I need assistance with my food order.'
    );
    window.open(`https://wa.me/${intlNumber}?text=${text}`, '_blank');
  };

  return (
    <div
      id="profile-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Top Bar */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="profile-back-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] tracking-tight">
          My Profile
        </h2>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Full-Screen Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Customer Gmail Profile Card */}
          {currentUser ? (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-orange-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-[#FF6B00] to-[#F59E0B] text-white font-black text-2xl flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] truncate">
                      {currentUser.name}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-[#7C4A22] font-medium truncate mt-0.5">
                    {currentUser.email || `+91 ${currentUser.phoneNumber}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="min-h-[36px] inline-flex items-center text-xs font-extrabold text-[#FF6B00] hover:underline mt-1 cursor-pointer"
                  >
                    Manage Account Details
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                id="profile-sign-out-btn"
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
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
              className="w-full min-h-[64px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-orange-500/20 flex items-center justify-between gap-3 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-display font-black text-base">
                    Sign In with Google (Gmail)
                  </div>
                  <div className="text-xs text-orange-100 mt-0.5">
                    Save delivery pins, checkout faster &amp; track live orders
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white shrink-0" />
            </button>
          )}

          {/* Delivery Location & Past Orders */}
          <div className="bg-white rounded-3xl p-2 border border-[#F5E6D3] shadow-xs divide-y divide-[#F5E6D3]">
            {onOpenLocationPicker && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLocationPicker();
                }}
                id="profile-saved-location-btn"
                className="w-full min-h-[56px] flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#FFF8F0] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#3D1C0A]">
                      Saved Delivery Pin
                    </div>
                    <div className="text-xs text-[#7C4A22] truncate mt-0.5">
                      {currentAddressLabel || 'Tap to set location on Google Maps'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#7C4A22] shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrderHistory();
              }}
              id="app-more-orders-history-btn"
              className="w-full min-h-[56px] flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#FFF8F0] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#3D1C0A]">
                    My Orders &amp; Receipts
                  </div>
                  <div className="text-xs text-[#7C4A22] mt-0.5">
                    Track live deliveries &amp; reorder favourite meals
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#7C4A22] shrink-0" />
            </button>
          </div>

          {/* Quick Customer Care */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCallHelpline}
              id="app-more-call-btn"
              className="min-h-[84px] bg-[#FF6B00] hover:brightness-105 active:scale-[0.98] text-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 text-white" />
              <span className="text-sm font-black">Call Support</span>
              <span className="text-xs text-orange-100 font-mono tabular-nums">
                {settings.helplineNumber}
              </span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              id="app-more-whatsapp-btn"
              className="min-h-[84px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white p-4 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-sm font-black">WhatsApp Help</span>
              <span className="text-xs text-emerald-100 font-medium">
                Instant Support
              </span>
            </button>
          </div>

          {/* Legal: Privacy Policy, Terms of Service, Refund & Grievance */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-[#3D1C0A]">
              <Shield className="w-4 h-4 text-[#FF6B00]" />
              <span>Privacy Policy &amp; Terms of Service</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('privacy');
                }}
                id="more-privacy-policy-btn"
                className="min-h-[48px] bg-[#FFF8F0] hover:bg-orange-50 px-3.5 py-2.5 rounded-2xl border border-[#F5E6D3] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#3D1C0A]">
                  <Shield className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7C4A22]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('terms');
                }}
                id="more-terms-service-btn"
                className="min-h-[48px] bg-[#FFF8F0] hover:bg-orange-50 px-3.5 py-2.5 rounded-2xl border border-[#F5E6D3] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#3D1C0A]">
                  <FileText className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7C4A22]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('refund');
                }}
                id="more-refund-policy-btn"
                className="min-h-[48px] bg-[#FFF8F0] hover:bg-orange-50 px-3.5 py-2.5 rounded-2xl border border-[#F5E6D3] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#3D1C0A]">
                  <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Refund &amp; Cancellation</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7C4A22]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicy?.('contact');
                }}
                id="more-grievance-officer-btn"
                className="min-h-[48px] bg-[#FFF8F0] hover:bg-orange-50 px-3.5 py-2.5 rounded-2xl border border-[#F5E6D3] flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#3D1C0A]">
                  <Scale className="w-4 h-4 text-[#3D1C0A] shrink-0" />
                  <span>Grievance &amp; Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7C4A22]" />
              </button>
            </div>
          </div>

          {/* Kitchen Operating Hours */}
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-3xl p-4 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-sm">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Service Hours</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Open daily 7:00 AM – 11:30 PM. Customer Care Lead:{' '}
              <strong>{settings.contactPersonName}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
