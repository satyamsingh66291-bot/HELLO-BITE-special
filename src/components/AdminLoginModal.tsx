import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, ShieldCheck, PhoneCall, ArrowRight, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  validPassword: string; // default: 9771264784
  helplineName: string; // SATYAM SINGH
  helplineNumber: string; // 7091472879
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  validPassword,
  helplineName,
  helplineNumber
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.trim() === validPassword.trim()) {
      setPassword('');
      onLoginSuccess();
    } else {
      setError('Invalid password. Please check credentials or contact helpline.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-linear-to-r from-stone-900 to-stone-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="font-display font-extrabold text-xl text-white">
            Admin Authentication
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Access live order tracking, menu manager &amp; loud chime alert
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            {/* The exact label requested */}
            <label 
              htmlFor="admin-password-field" 
              className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5"
            >
              ENTER PASSWORD
            </label>

            <div className="relative">
              <input
                id="admin-password-field"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter 10-digit admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full text-sm px-3.5 py-3 rounded-xl border ${
                  error ? 'border-red-500 bg-red-50' : 'border-stone-300'
                } pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="btn-admin-login-submit"
            className="w-full bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
          >
            <span>Unlock Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Helpline Details Footer Card (Mandatory Requirement) */}
          <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-stone-500 font-bold text-[11px] uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
              <span>Helpline & Support Verification</span>
            </div>
            <div className="flex justify-between items-center text-stone-800 pt-1">
              <span className="text-stone-500">Contact Person Name:</span>
              <span className="font-extrabold text-stone-900">{helplineName}</span>
            </div>
            <div className="flex justify-between items-center text-stone-800">
              <span className="text-stone-500">Helpline Number:</span>
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
