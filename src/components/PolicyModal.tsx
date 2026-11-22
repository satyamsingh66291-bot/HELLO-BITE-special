import React, { useState, useEffect } from 'react';
import {
  X,
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              HB
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-white">
                HELLO BITE Legal &amp; Policies
              </h2>
              <p className="text-xs text-stone-400">
                Privacy Policy, Terms of Service &amp; Refund Guidelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="policy-modal-close-btn"
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('privacy')}
            id="policy-tab-privacy-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            id="policy-tab-terms-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            id="policy-tab-refund-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refund Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            id="policy-tab-contact-btn"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Grievance &amp; Support</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed flex-1">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200/80">
                <div className="font-bold text-orange-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span>Privacy Policy — HELLO BITE</span>
                </div>
                <p className="text-[11px] text-orange-800 mt-1">
                  Updated 2026. Applies to all orders, ride bookings, and accounts created via Firebase Authentication on HELLO BITE.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">1</span>
                  Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-stone-600 text-xs">
                  <li><strong>Account &amp; Contact Details:</strong> Name, Gmail/email from Firebase Authentication, and Indian phone number (+91) for delivery coordination.</li>
                  <li><strong>Delivery Address &amp; Pin:</strong> Street address, flat/house number, and landmark.</li>
                  <li><strong>Location Data (Consent-Based):</strong> With your explicit device permission, HELLO BITE uses your GPS location to center the interactive map, calculate road distance from the kitchen, and compute per-kilometer delivery charges.</li>
                  <li><strong>Order History:</strong> Dishes ordered, payment preference, and order receipts.</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">2</span>
                  Google Maps &amp; Location Consent
                </h3>
                <p className="text-stone-600 text-xs">
                  HELLO BITE integrates <strong>Google Maps Platform</strong> (Maps, Places Autocomplete, Geocoding, and Routes) to help you pin delivery locations and calculate per-kilometer delivery distance. By using map and location features, Google&apos;s{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-600 underline font-semibold"
                  >
                    Privacy Policy
                  </a>{' '}
                  applies to map data requests. GPS permission is optional and strictly revocable anytime from your browser or device settings; continuous background tracking is never performed.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">3</span>
                  Data Protection &amp; Deletion
                </h3>
                <p className="text-stone-600 text-xs">
                  We never sell or rent your personal contact or location data to third parties. You may request account or data deletion anytime by emailing{' '}
                  <strong>satyamsingh36224@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200/80">
                <div className="font-bold text-orange-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Terms of Service — HELLO BITE</span>
                </div>
                <p className="text-[11px] text-orange-800 mt-1">
                  By accessing or placing an order on HELLO BITE, you agree to the terms below.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">1</span>
                  Service &amp; Eligibility
                </h3>
                <p className="text-stone-600 text-xs">
                  HELLO BITE facilitates fresh food delivery, tiffin subscriptions, and local ride requests across active service radii. Users must provide accurate delivery addresses and reachable contact numbers.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">2</span>
                  Per-Kilometer Delivery Charges &amp; Pricing
                </h3>
                <p className="text-stone-600 text-xs">
                  Delivery fees are calculated transparently based on route distance between the HELLO BITE kitchen hub and your pinned delivery location (base fee up to 2 km plus per-km charges thereafter). All applicable taxes and fees are displayed clearly before order confirmation.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">3</span>
                  Third-Party Map &amp; Auth Terms
                </h3>
                <p className="text-stone-600 text-xs">
                  Location search, pinning, and route distance calculations are powered by Google Maps Platform. Use of Google Maps features within HELLO BITE is subject to the{' '}
                  <a
                    href="https://maps.google.com/help/terms_maps/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-600 underline font-semibold"
                  >
                    Google Maps/Google Earth Additional Terms of Service
                  </a>
                  . Authentication is powered securely via Firebase Authentication.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">4</span>
                  Orders &amp; Acceptable Use
                </h3>
                <p className="text-stone-600 text-xs">
                  Abuse of Cash on Delivery (COD), fraudulent orders, or mistreatment of delivery partners may lead to account suspension.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND & CANCELLATION POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/80">
                <div className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <span>Refund &amp; Cancellation Policy — HELLO BITE</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Fair cancellation and refund guidelines for fresh meal orders.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">1</span>
                  Order Cancellation Guidelines
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-stone-600 text-xs">
                  <li><strong>Before Preparation:</strong> Call helpline (<strong>7091472879</strong>) immediately within 2-3 minutes of placing an order for a 100% free cancellation.</li>
                  <li><strong>During Preparation:</strong> Once cooking begins, fresh food orders cannot be cancelled without valid cause.</li>
                  <li><strong>Tiffin Subscriptions:</strong> Pause or cancel upcoming meals with 12 hours prior notice.</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">2</span>
                  Eligible Refund Scenarios
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Damaged or Spilled Food:</strong> Packaging compromised in transit.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Incorrect or Missing Items:</strong> Dish mismatch or missing items.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center text-xs">3</span>
                  Refund Timeline
                </h3>
                <p className="text-stone-600 text-xs">
                  Verified refunds are processed within <strong>24 to 48 hours</strong> back to your UPI/original payment method. Reach out at <strong>7091472879</strong> or <strong>satyamsingh36224@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & GRIEVANCE */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-orange-600" />
                  <span>Grievance Redressal &amp; Support</span>
                </div>
                <p className="text-stone-600 text-xs">
                  Official customer support and grievance contact details for HELLO BITE.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2">
                <div className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                  Grievance Officer &amp; Support
                </div>
                <div className="text-sm font-extrabold text-stone-900">Satyam Singh</div>
                <div className="text-xs text-stone-600 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <a
                      href="mailto:satyamsingh36224@gmail.com"
                      className="text-orange-700 font-bold hover:underline"
                    >
                      satyamsingh36224@gmail.com
                    </a>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>+91 7091472879</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Gopalganj &amp; Siwan, Bihar - 841428</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500">
            HELLO BITE Legal &amp; Consumer Protection
          </div>
          <button
            onClick={onClose}
            id="policy-modal-dismiss-btn"
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
