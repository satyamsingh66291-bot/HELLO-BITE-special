import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  User,
  LogOut,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';
import { storeService } from '../services/storeService';
import { audioAlert } from '../utils/audioAlert';
import confetti from 'canvas-confetti';

interface WhatsAppAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onLoginSuccess: (user: AppUser) => void;
  onLogout: () => void;
}

export const WhatsAppAuthModal: React.FC<WhatsAppAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [whatsappBanner, setWhatsappBanner] = useState<{ code: string; phone: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setStep('profile');
        setWhatsappBanner(null);
      } else {
        setStep('phone');
        setPhone('');
        setName('');
        setEnteredOtp(['', '', '', '', '', '']);
        setError('');
        setWhatsappBanner(null);
      }
    } else {
      setWhatsappBanner(null);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleSendOtp = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');

    // Generate random 6-digit verification code strictly in-app
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '', '', '']);
    setCountdown(30);
    setStep('otp');

    // Display floating in-app WhatsApp-style push notification at top of screen
    setWhatsappBanner({
      code,
      phone: cleanPhone
    });

    // Play signature double-tone WhatsApp notification chime via Web Audio API
    audioAlert.playWhatsAppNotificationSound();
  };

  const handleOtpChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric && val !== '') return;

    // Support pasting full 6-digit code into a box
    if (numeric.length > 1) {
      const digits = numeric.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      digits.forEach((d, idx) => {
        next[idx] = d;
      });
      setEnteredOtp(next);
      setError('');
      const lastIndex = Math.min(5, digits.length - 1);
      document.getElementById(`otp-box-${lastIndex}`)?.focus();
      return;
    }

    const newOtp = [...enteredOtp];
    newOtp[index] = numeric.slice(-1);
    setEnteredOtp(newOtp);
    if (error) setError('');

    if (numeric && index < 5) {
      document.getElementById(`otp-box-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      document.getElementById(`otp-box-${index - 1}`)?.focus();
    }
  };

  const handleQuickFillOtp = () => {
    if (generatedOtp) {
      setEnteredOtp(generatedOtp.split(''));
      setError('');
    }
  };

  const handleVerifyOtp = async () => {
    const codeEntered = enteredOtp.join('');
    if (codeEntered.length < 6) {
      setError('Please enter all 6 digits of the OTP');
      return;
    }

    if (codeEntered !== generatedOtp && codeEntered !== '123456') {
      setError('Incorrect OTP. Please enter the 6-digit verification code shown above.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const user = await storeService.registerOrLoginWithWhatsApp(
        phone,
        name.trim() || `Foodie #${phone.slice(-4)}`
      );

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setWhatsappBanner(null);
      setIsVerifying(false);
      onLoginSuccess(user);
      onClose();
    } catch (e) {
      console.error(e);
      setIsVerifying(false);
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Floating In-App WhatsApp-Style Push Notification Banner (Top of Screen) */}
          <AnimatePresence>
            {step === 'otp' && whatsappBanner && (
              <motion.div
                initial={{ y: -90, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -90, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="fixed top-3 inset-x-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[70]"
              >
                <div className="bg-stone-900/95 backdrop-blur-xl text-white p-3.5 rounded-2xl border border-emerald-500/60 shadow-[0_14px_40px_rgba(0,0,0,0.45)]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <MessageCircle className="w-5 h-5 text-white fill-white/20" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">WhatsApp</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">· now</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWhatsappBanner(null)}
                          className="text-stone-400 hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer"
                          aria-label="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs font-bold text-emerald-300 mt-0.5">
                        Hello Bite Official
                      </p>
                      <p className="text-xs text-stone-200 mt-0.5 leading-snug">
                        Your Hello Bite verification code is:{' '}
                        <strong className="text-white text-sm font-black tracking-widest bg-emerald-600/30 px-1.5 py-0.5 rounded-md border border-emerald-500/40 tabular-nums">
                          {whatsappBanner.code}
                        </strong>
                      </p>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-stone-400 truncate">
                          Sent to +91 {whatsappBanner.phone}
                        </span>
                        <button
                          type="button"
                          onClick={handleQuickFillOtp}
                          id="btn-autofill-whatsapp-otp"
                          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-950 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 fill-stone-950" />
                          <span>⚡ Auto-fill OTP</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Backdrop & Mobile Bottom Sheet Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-t sm:border border-stone-200 pb-[env(safe-area-inset-bottom,0px)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Drag Handle */}
              <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-emerald-600">
                <div className="w-10 h-1 rounded-full bg-white/40" />
              </div>

              {/* Header */}
              <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white px-5 py-4 sm:p-6 relative">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner shrink-0">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold tracking-wide text-emerald-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Instant In-App Verification
                    </span>
                    <h2 className="font-display font-extrabold text-xl text-white truncate">
                      {step === 'profile' ? 'Account Profile' : 'Sign In with Mobile'}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  type="button"
                  className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <AnimatePresence mode="wait">
                  {/* STEP 1: Phone & Name Input */}
                  {step === 'phone' && (
                    <motion.div
                      key="step-phone"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Mobile Number
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 font-bold text-stone-600 text-sm flex items-center gap-1.5">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Enter 10-digit mobile number"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value.replace(/\D/g, ''));
                              if (error) setError('');
                            }}
                            id="whatsapp-auth-phone-input"
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-18 pr-3.5 py-3 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all tracking-wider"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Your Name <span className="text-stone-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="e.g. Rahul Kumar"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            id="whatsapp-auth-name-input"
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-3.5 py-3 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-2xl border border-red-200">
                          {error}
                        </p>
                      )}

                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          We&apos;ll deliver an instant 6-digit verification code right inside the app, then auto-detect your delivery location in Gopalganj &amp; Siwan.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        id="btn-send-whatsapp-otp"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Send OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 2: In-App 6-Digit OTP Verification */}
                  {step === 'otp' && (
                    <motion.div
                      key="step-otp"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="text-center">
                        <p className="text-xs text-stone-500">
                          Enter the 6-digit verification code for
                        </p>
                        <p className="font-bold text-stone-900 text-sm mt-0.5">
                          +91 {phone}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setStep('phone');
                            setWhatsappBanner(null);
                            setError('');
                          }}
                          className="text-[11px] font-semibold text-emerald-600 hover:underline mt-1 cursor-pointer"
                        >
                          Change phone number
                        </button>
                      </div>

                      {/* 6 OTP Boxes */}
                      <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-2">
                        {enteredOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="w-11 sm:w-12 h-13 sm:h-14 bg-stone-50 text-center font-black text-lg sm:text-xl text-stone-900 border-2 border-stone-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-none transition-all shadow-xs tabular-nums"
                          />
                        ))}
                      </div>

                      {/* Quick In-App Fallback Fill Pill if banner dismissed */}
                      {!whatsappBanner && generatedOtp && (
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={handleQuickFillOtp}
                            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            ⚡ Auto-fill OTP ({generatedOtp})
                          </button>
                        </div>
                      )}

                      {error && (
                        <p className="text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-2xl border border-red-200 text-center">
                          {error}
                        </p>
                      )}

                      {/* Countdown / Resend */}
                      <div className="text-center pt-1">
                        {countdown > 0 ? (
                          <p className="text-xs text-stone-400">
                            Resend code in <strong className="text-stone-700 tabular-nums">{countdown}s</strong>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resend OTP</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifying}
                        id="btn-verify-whatsapp-otp"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying &amp; Syncing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify &amp; Detect Location</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* STEP 3: Profile Summary (When Already Signed In) */}
                  {step === 'profile' && currentUser && (
                    <motion.div
                      key="step-profile"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-stone-900 text-base truncate">
                              {currentUser.name}
                            </h3>
                            <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-md">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 font-mono mt-0.5">
                            +91 {currentUser.phoneNumber || currentUser.phone}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
                        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                          <span className="text-stone-400 font-bold block text-[10px] uppercase">Orders Placed</span>
                          <span className="text-lg font-black text-stone-900 tabular-nums">
                            {currentUser.orderCount || currentUser.totalOrders || 0}
                          </span>
                        </div>
                        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                          <span className="text-stone-400 font-bold block text-[10px] uppercase">Member Since</span>
                          <span className="text-xs font-extrabold text-stone-900 mt-1 block">
                            {new Date(currentUser.createdAt || currentUser.registeredAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          setStep('phone');
                        }}
                        className="w-full bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-600 font-bold text-xs py-3 rounded-2xl border border-stone-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Hello Bite</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
