import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  FileText,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Scale,
} from 'lucide-react';

export type PolicyTab = 'privacy' | 'terms' | 'refund' | 'contact';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="policy-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Top Header with Back Button */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          id="policy-modal-close-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] tracking-tight">
          Legal &amp; Policies
        </h2>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Tab Switcher */}
      <div className="bg-white border-b border-[#F5E6D3] px-3 sm:px-6 py-2.5 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            id="policy-tab-privacy-btn"
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'bg-[#FFF8F0] text-[#7C4A22] hover:text-[#3D1C0A] border border-[#F5E6D3]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            id="policy-tab-terms-btn"
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'bg-[#FFF8F0] text-[#7C4A22] hover:text-[#3D1C0A] border border-[#F5E6D3]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refund')}
            id="policy-tab-refund-btn"
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'bg-[#FFF8F0] text-[#7C4A22] hover:text-[#3D1C0A] border border-[#F5E6D3]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refund Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            id="policy-tab-contact-btn"
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'bg-[#FFF8F0] text-[#7C4A22] hover:text-[#3D1C0A] border border-[#F5E6D3]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Grievance &amp; Support</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-5 sm:p-7 border border-[#F5E6D3] shadow-xs space-y-6 text-xs sm:text-sm text-[#3D1C0A]/90 leading-relaxed">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200/80">
                <div className="font-display font-black text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF6B00]" />
                  <span>Privacy Policy — HELLO BITE</span>
                </div>
                <p className="text-xs text-[#7C4A22] mt-1">
                  Updated 2026. Applies to all food &amp; daily tiffin orders and customer accounts created via Firebase Authentication on HELLO BITE.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">1</span>
                  Information We Collect
                </h3>
                <ul className="list-disc pl-6 space-y-1.5 text-[#7C4A22] text-xs sm:text-sm">
                  <li><strong>Account &amp; Contact Details:</strong> Name, Gmail/email from Firebase Authentication, and Indian phone number (+91) for food delivery coordination.</li>
                  <li><strong>Delivery Address &amp; Pin:</strong> Street address, flat/house number, and landmark.</li>
                  <li><strong>Location Data (Consent-Based):</strong> With your explicit device permission, HELLO BITE uses your GPS location to center the interactive map, calculate road distance from the kitchen, and compute per-kilometer delivery charges.</li>
                  <li><strong>Order History:</strong> Food items, tiffin plans ordered, payment preference, and order receipts.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">2</span>
                  Google Maps &amp; Location Consent
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  HELLO BITE integrates <strong>Google Maps Platform</strong> (Maps, Places Autocomplete, Geocoding, and Routes) to help you pin delivery locations and calculate per-kilometer delivery distance. By using map and location features, Google&apos;s{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF6B00] underline font-bold"
                  >
                    Privacy Policy
                  </a>{' '}
                  applies to map data requests. GPS permission is optional and strictly revocable anytime from your browser or device settings; continuous background tracking is never performed.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">3</span>
                  Data Protection &amp; Deletion
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  We never sell or rent your personal contact or location data to third parties. You may request account or data deletion anytime by emailing{' '}
                  <strong className="text-[#3D1C0A]">satyamsingh36224@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200/80">
                <div className="font-display font-black text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF6B00]" />
                  <span>Terms of Service — HELLO BITE</span>
                </div>
                <p className="text-xs text-[#7C4A22] mt-1">
                  By accessing or placing a food or tiffin order on HELLO BITE, you agree to the terms below.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">1</span>
                  Service &amp; Eligibility
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  HELLO BITE facilitates fresh food preparation, doorstep meal delivery, and daily tiffin subscriptions across active kitchen service radii. Users must provide accurate delivery addresses and reachable contact numbers.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">2</span>
                  Per-Kilometer Delivery Charges &amp; Pricing
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  Delivery fees are calculated transparently based on route distance between the HELLO BITE kitchen hub and your pinned delivery location (base fee up to 2 km plus per-km charges thereafter). All applicable taxes and fees are displayed clearly before order confirmation.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">3</span>
                  Third-Party Map &amp; Auth Terms
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  Location search, pinning, and route distance calculations are powered by Google Maps Platform. Use of Google Maps features within HELLO BITE is subject to the{' '}
                  <a
                    href="https://maps.google.com/help/terms_maps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF6B00] underline font-bold"
                  >
                    Google Maps/Google Earth Additional Terms of Service
                  </a>
                  . Authentication is powered securely via Firebase Authentication.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">4</span>
                  Orders &amp; Acceptable Use
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  Abuse of Cash on Delivery (COD), fraudulent orders, or mistreatment of delivery partners may lead to account suspension.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND & CANCELLATION POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80">
                <div className="font-display font-black text-emerald-950 text-sm sm:text-base flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span>Refund &amp; Cancellation Policy — HELLO BITE</span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Fair cancellation and refund guidelines for fresh meal and tiffin orders.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">1</span>
                  Order Cancellation Guidelines
                </h3>
                <ul className="list-disc pl-6 space-y-1.5 text-[#7C4A22] text-xs sm:text-sm">
                  <li><strong>Before Preparation:</strong> Call helpline (<strong className="text-[#3D1C0A]">7091472879</strong>) immediately within 2–3 minutes of placing an order for a 100% free cancellation.</li>
                  <li><strong>During Preparation:</strong> Once cooking begins, fresh food orders cannot be cancelled without valid cause.</li>
                  <li><strong>Tiffin Subscriptions:</strong> Pause or cancel upcoming meals with 12 hours prior notice.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">2</span>
                  Eligible Refund Scenarios
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F5E6D3] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Damaged or Spilled Food:</strong> Packaging compromised in transit.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F5E6D3] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Incorrect or Missing Items:</strong> Dish mismatch or missing items.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center text-xs font-black">3</span>
                  Refund Timeline
                </h3>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  Verified refunds are processed within <strong className="text-[#3D1C0A]">24 to 48 hours</strong> back to your UPI/original payment method. Reach out at <strong className="text-[#3D1C0A]">7091472879</strong> or <strong className="text-[#3D1C0A]">satyamsingh36224@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & GRIEVANCE */}
          {activeTab === 'contact' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-[#F5E6D3] space-y-1.5">
                <div className="font-display font-black text-[#3D1C0A] text-sm sm:text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#FF6B00]" />
                  <span>Grievance Redressal &amp; Support</span>
                </div>
                <p className="text-[#7C4A22] text-xs sm:text-sm">
                  Official customer support and grievance contact details for HELLO BITE.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2.5">
                <div className="text-xs font-extrabold text-[#FF6B00] uppercase tracking-wider">
                  Grievance Officer &amp; Support
                </div>
                <div className="text-base font-black text-[#3D1C0A]">Satyam Singh</div>
                <div className="text-xs sm:text-sm text-[#7C4A22] space-y-2">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <a
                      href="mailto:satyamsingh36224@gmail.com"
                      className="text-[#FF6B00] font-bold hover:underline"
                    >
                      satyamsingh36224@gmail.com
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="font-semibold text-[#3D1C0A]">+91 7091472879</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                    <span>Gopalganj &amp; Siwan, Bihar - 841428</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
