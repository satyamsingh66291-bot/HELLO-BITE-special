import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  AlertCircle,
  Bike,
  Store,
  ChefHat,
} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRiderLoginSuccess?: () => void;
  onKitchenLoginSuccess?: () => void;
  initialMode?: 'admin' | 'rider' | 'kitchen';
  validPassword: string;
  helplineName: string;
  helplineNumber: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRiderLoginSuccess,
  onKitchenLoginSuccess,
  initialMode = 'admin',
  validPassword,
  helplineName,
  helplineNumber,
}) => {
  const [activeMode, setActiveMode] = useState<'admin' | 'rider' | 'kitchen'>(
    initialMode
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = password.trim();
    const expected = (validPassword || '').trim();
    if (trimmed.length > 0 && expected.length > 0 && trimmed === expected) {
      setPassword('');
      if (activeMode === 'rider' && onRiderLoginSuccess) {
        onRiderLoginSuccess();
      } else if (activeMode === 'kitchen' && onKitchenLoginSuccess) {
        onKitchenLoginSuccess();
      } else {
        onLoginSuccess();
      }
    } else {
      setError(
        'Incorrect access password. Please verify with authorized operations support.'
      );
    }
  };

  return (
    <div
      id="staff-login-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Header */}
      <header className="h-14 shrink-0 bg-stone-900 text-white px-3 sm:px-6 flex items-center justify-between border-b border-stone-800">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-stone-800 text-white flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-white">
          Staff Portal Access
        </h2>

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm overflow-hidden border border-[#F5E6D3]">
          <div className="bg-stone-900 text-white p-5 sm:p-6">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-800/90 rounded-2xl border border-stone-700/80 mb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('admin');
                  setError('');
                }}
                className={`min-h-[40px] flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'admin'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('rider');
                  setError('');
                }}
                className={`min-h-[40px] flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'rider'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Rider</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('kitchen');
                  setError('');
                }}
                className={`min-h-[40px] flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'kitchen'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen</span>
              </button>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-2">
              {activeMode === 'rider' ? (
                <Bike className="w-6 h-6" />
              ) : activeMode === 'kitchen' ? (
                <ChefHat className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>

            <h3 className="font-display font-extrabold text-xl text-white">
              {activeMode === 'rider'
                ? 'Delivery Partner Access'
                : activeMode === 'kitchen'
                  ? 'Kitchen Operations Access'
                  : 'Operations Admin Access'}
            </h3>
            <p className="text-xs text-stone-300 mt-1">
              {activeMode === 'rider'
                ? 'Manage assigned deliveries, route navigation & COD updates'
                : activeMode === 'kitchen'
                  ? 'Manage live kitchen queue, preparation statuses & menu stock'
                  : 'Manage orders, per-km delivery rates, kitchen GPS & store configuration'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password-field"
                  className="block text-xs font-black uppercase tracking-wider text-stone-700"
                >
                  Staff Password
                </label>
                <span className="text-[11px] text-stone-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Protected
                </span>
              </div>

              <div className="relative">
                <input
                  id="admin-password-field"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full min-h-[46px] text-sm font-semibold tracking-wider px-3.5 py-3 rounded-xl border ${
                    error ? 'border-red-500 bg-red-50/50' : 'border-stone-300 bg-stone-50/60'
                  } pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold mt-2 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              id="btn-admin-login-submit"
              className="w-full min-h-[48px] bg-linear-to-r from-orange-600 to-amber-600 hover:brightness-105 text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer"
            >
              <span>
                {activeMode === 'rider'
                  ? 'Continue to Rider Workspace'
                  : activeMode === 'kitchen'
                    ? 'Continue to Kitchen Workspace'
                    : 'Continue to Admin Workspace'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                <span>Authorized Personnel Verification</span>
              </div>
              <div className="flex justify-between items-center text-stone-800 pt-1">
                <span className="text-stone-500">Operations Lead:</span>
                <span className="font-extrabold text-stone-900">{helplineName}</span>
              </div>
              <div className="flex justify-between items-center text-stone-800">
                <span className="text-stone-500">Helpline:</span>
                <a
                  href={`tel:${helplineNumber}`}
                  className="font-extrabold text-orange-600 hover:underline"
                >
                  {helplineNumber}
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
