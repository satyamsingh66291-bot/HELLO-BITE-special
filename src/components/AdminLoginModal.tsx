import React, { useState, useEffect } from 'react';
import {
  X,
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
  const [activeMode, setActiveMode] = useState<'admin' | 'rider' | 'kitchen'>(initialMode);
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
      setError('Incorrect access password. Please verify with authorized operations support.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 border border-stone-200">
        {/* Header */}
        <div className="bg-linear-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Staff Mode Switch Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-800/90 rounded-2xl border border-stone-700/80 mb-4 pr-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode('admin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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

          <h2 className="font-display font-extrabold text-xl text-white">
            {activeMode === 'rider'
              ? 'Delivery Partner Access'
              : activeMode === 'kitchen'
                ? 'Kitchen Operations Access'
                : 'Operations Admin Access'}
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            {activeMode === 'rider'
              ? 'Manage assigned deliveries, route navigation & COD updates'
              : activeMode === 'kitchen'
                ? 'Manage live kitchen queue, preparation statuses & menu stock'
                : 'Manage orders, per-km delivery rates, kitchen GPS & store configuration'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password-field"
                className="block text-xs font-black uppercase tracking-wider text-stone-700"
              >
                Staff Password
              </label>
              <span className="text-[10px] text-stone-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Protected
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
                className={`w-full text-sm font-semibold tracking-wider px-3.5 py-3 rounded-xl border ${
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
            className="w-full bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-98 cursor-pointer"
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

          {/* Helpline Verification */}
          <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
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
  );
};
