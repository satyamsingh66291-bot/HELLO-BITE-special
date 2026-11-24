import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
  Bike,
  Store,
  Utensils,
  Package,
  LogOut,
  FileText,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  AppUser,
  UserRole,
  RiderRecord,
  RestaurantRecord,
  DynamicDeliveryFee,
} from '../../types';
import { storeService } from '../../services/storeService';
import {
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  consumeGoogleRedirectResult,
  formatGoogleAuthError,
  uploadPartnerFile,
  createRecaptchaVerifier,
  sendOtpToPhoneNumber,
  ConfirmationResult,
} from '../../services/firebase';
import {
  GeoCoordinates,
  getLocalityFromCoords,
  calculateDynamicDeliveryPricing,
} from '../../utils/geoUtils';
import { reverseGeocodeCoords } from '../../utils/mapsClient';
import { HelloBiteLogo } from './HelloBiteLogo';

import welcomeFeastImg from '../../assets/images/hellobite_welcome_feast_1794635220422.jpg';

export type AuthScreenStep =
  | 'welcome'
  | 'login'
  | 'verified'
  | 'profile'
  | 'location'
  | 'account';

interface AuthFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  initialStep?: AuthScreenStep;
  onAuthComplete: (params: {
    user: AppUser;
    coords?: GeoCoordinates;
    addressLabel?: string;
    openPartnerPortal?: UserRole;
  }) => void;
  onOpenPartnerDashboard?: (role: UserRole) => void;
  onOpenInteractiveMap?: () => void;
  onLogout: () => void;
}

const FOOD_CATEGORY_OPTIONS = [
  'North Indian',
  'Fast Food',
  'Tiffin Special',
  'Snacks',
  'Beverages',
  'Sweets',
];

export const AuthFlowModal: React.FC<AuthFlowModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialStep,
  onAuthComplete,
  onOpenPartnerDashboard,
  onOpenInteractiveMap,
  onLogout,
}) => {
  const [step, setStep] = useState<AuthScreenStep>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Customer');

  // Firebase Phone Auth State
  const [phoneMobile, setPhoneMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneMobile.replace(/\D/g, '').slice(-10);
    if (cleanNumber.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = createRecaptchaVerifier('recaptcha-container');
      }
      const formattedPhone = `+91${cleanNumber}`;
      const conf = await sendOtpToPhoneNumber(formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(conf);
      setOtpSent(true);
      setCountdown(30);
      setCanResend(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send OTP via SMS. Please check mobile number or try again.');
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setAuthError('Please enter the 6-digit OTP code received on your phone.');
      return;
    }

    if (!confirmationResult) {
      setAuthError('OTP session expired. Please request a new OTP.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await confirmationResult.confirm(otpCode.trim());
      const fUser = result.user;
      const cleanNumber = phoneMobile.replace(/\D/g, '').slice(-10);
      const name = fUser.displayName || `Hello Bite Foodie`;

      setVerifiedUid(fUser.uid);
      setPhoneInput(cleanNumber);
      setFullName(name);

      await storeService.saveUserProfile({
        uid: fUser.uid,
        phoneNumber: cleanNumber,
        name,
        role: selectedRole,
        city,
      });

      setStep('verified');
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.55 } });
      } catch {}
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [canOfferRedirect, setCanOfferRedirect] = useState(false);
  const [verifiedUid, setVerifiedUid] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  // Profile / Role Setup Form
  const [fullName, setFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [city, setCity] = useState('Gopalganj');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Rider fields (for already-registered partner accounts)
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooter' | 'Bicycle'>('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState('');
  const [dlDoc, setDlDoc] = useState<{ url: string; name: string } | null>(null);
  const [rcDoc, setRcDoc] = useState<{ url: string; name: string } | null>(null);

  // Restaurant fields (for already-registered partner accounts)
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>([
    'North Indian',
    'Fast Food',
  ]);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [fssaiDoc, setFssaiDoc] = useState<{ url: string; name: string } | null>(null);
  const [kitchenPhoto, setKitchenPhoto] = useState<{ url: string; name: string } | null>(null);

  // Location step state
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [detectedCoords, setDetectedCoords] = useState<GeoCoordinates>({
    latitude: 26.4687,
    longitude: 84.4442,
  });
  const [detectedAddressLabel, setDetectedAddressLabel] = useState(
    'Gopalganj Town · Main Market'
  );
  const [locVerified, setLocVerified] = useState(false);

  // Prevent mid-flow step resets when currentUser updates asynchronously during Google Sign-In
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Handle return from Google signInWithRedirect on mobile browsers if triggered
    void consumeGoogleRedirectResult().then(async (cred) => {
      if (!cred?.user) return;
      const gUser = cred.user;
      const email = gUser.email || '';
      const name =
        gUser.displayName || (email ? email.split('@')[0] : 'Hello Bite User');
      setVerifiedUid(gUser.uid);
      setVerifiedEmail(email);
      setFullName(name);
      setProfilePhotoUrl(gUser.photoURL || '');
      try {
        await storeService.saveUserProfile({
          uid: gUser.uid,
          phoneNumber: gUser.phoneNumber
            ? gUser.phoneNumber.replace(/\D/g, '').slice(-10)
            : '0000000000',
          name,
          email,
          profileImage: gUser.photoURL || undefined,
          role: 'Customer',
          city: 'Gopalganj',
        });
      } catch {
        // local profile still updates via Auth subscriber
      }
      if (isOpen) {
        setStep('verified');
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setAuthError(null);
      setCanOfferRedirect(false);

      if (currentUser && !initialStep) {
        setStep('account');
        setSelectedRole(
          currentUser.role === 'Admin'
            ? 'Customer'
            : (currentUser.role as UserRole)
        );
        setFullName(currentUser.name || '');
        setVerifiedEmail(currentUser.email || '');
        setPhoneInput(
          currentUser.phoneNumber && currentUser.phoneNumber !== '0000000000'
            ? currentUser.phoneNumber
            : ''
        );
        setCity(currentUser.city || 'Gopalganj');
        setProfilePhotoUrl(currentUser.profileImage || '');
      } else {
        setStep(initialStep || 'welcome');
      }
    }
  }, [isOpen, currentUser, initialStep]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanDigitsPhone = phoneInput.replace(/\D/g, '').slice(-10);
  const dynamicFeePreview: DynamicDeliveryFee =
    calculateDynamicDeliveryPricing(detectedCoords);

  const handleGoogleGmailLogin = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    setCanOfferRedirect(false);

    try {
      const cred = await signInWithGooglePopup();
      const gUser = cred.user;
      const email = gUser.email || '';
      const name =
        gUser.displayName || (email ? email.split('@')[0] : 'Hello Bite User');

      setVerifiedUid(gUser.uid);
      setVerifiedEmail(email);
      setFullName(name);
      setProfilePhotoUrl(gUser.photoURL || '');
      if (gUser.phoneNumber) {
        setPhoneInput(gUser.phoneNumber.replace(/\D/g, '').slice(-10));
      }

      try {
        await storeService.saveUserProfile({
          uid: gUser.uid,
          phoneNumber: gUser.phoneNumber
            ? gUser.phoneNumber.replace(/\D/g, '').slice(-10)
            : cleanDigitsPhone || '0000000000',
          name,
          email,
          profileImage: gUser.photoURL || undefined,
          role: selectedRole,
          city,
        });
      } catch (saveErr) {
        console.warn('Profile sync will retry automatically:', saveErr);
      }

      setStep('verified');
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
    } catch (err) {
      const formatted = formatGoogleAuthError(err);
      setAuthError(formatted.message);
      setCanOfferRedirect(formatted.canOfferRedirect);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err) {
      const formatted = formatGoogleAuthError(err);
      setAuthError(formatted.message);
      setAuthLoading(false);
    }
  };

  const handleFileUpload = async (
    target: 'avatar' | 'dl' | 'rc' | 'fssai' | 'kitchen',
    file?: File
  ) => {
    if (!file) return;
    setUploadingField(target);
    const uidPart = verifiedUid || currentUser?.id || Date.now().toString();
    const res = await uploadPartnerFile(
      `uploads/${selectedRole.toLowerCase()}/${uidPart}/${target}_${Date.now()}_${file.name}`,
      file
    );
    setUploadingField(null);

    if (target === 'avatar') setProfilePhotoUrl(res.url);
    if (target === 'dl') setDlDoc({ url: res.url, name: res.fileName });
    if (target === 'rc') setRcDoc({ url: res.url, name: res.fileName });
    if (target === 'fssai') setFssaiDoc({ url: res.url, name: res.fileName });
    if (target === 'kitchen')
      setKitchenPhoto({ url: res.url, name: res.fileName });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (selectedRole === 'Rider') {
      if (!vehicleNumber.trim() || !drivingLicenceNumber.trim()) {
        setAuthError(
          'Please enter your vehicle number and driving licence number.'
        );
        return;
      }
    }

    if (selectedRole === 'Restaurant') {
      if (
        !restaurantName.trim() ||
        !restaurantAddress.trim() ||
        !fssaiNumber.trim()
      ) {
        setAuthError(
          'Please provide restaurant name, address, and FSSAI number.'
        );
        return;
      }
    }

    setAuthLoading(true);
    try {
      const userId =
        verifiedUid ||
        currentUser?.id ||
        `user_${cleanDigitsPhone || Date.now().toString().slice(-8)}`;
      const savedUser = await storeService.saveUserProfile({
        uid: userId,
        phoneNumber: cleanDigitsPhone || currentUser?.phoneNumber || '0000000000',
        name: fullName.trim(),
        email: verifiedEmail || currentUser?.email,
        profileImage: profilePhotoUrl || undefined,
        role: selectedRole,
        city,
      });

      if (selectedRole === 'Rider') {
        const riderRecord: RiderRecord = {
          userId: savedUser.id,
          personalDetails: {
            fullName: fullName.trim(),
            phoneNumber: savedUser.phoneNumber,
            email: savedUser.email,
            city,
            profilePhotoUrl: profilePhotoUrl || undefined,
          },
          vehicleDetails: {
            vehicleType,
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            drivingLicenceNumber: drivingLicenceNumber.trim().toUpperCase(),
          },
          documents: {
            drivingLicenceUrl: dlDoc?.url,
            drivingLicenceFileName: dlDoc?.name,
            vehicleRcUrl: rcDoc?.url,
            vehicleRcFileName: rcDoc?.name,
          },
          approvalStatus: 'pending',
          availability: true,
          earnings: {
            today: 0,
            total: 0,
            deliveriesCount: 0,
            acceptanceRate: 100,
          },
          createdAt: Date.now(),
        };
        await storeService.saveRiderRegistration(riderRecord);
      }

      if (selectedRole === 'Restaurant') {
        const restRecord: RestaurantRecord = {
          restaurantId: `rest_${savedUser.id}`,
          ownerId: savedUser.id,
          ownerName: fullName.trim(),
          ownerPhone: savedUser.phoneNumber,
          ownerEmail: savedUser.email,
          restaurantName: restaurantName.trim(),
          address: restaurantAddress.trim(),
          city,
          foodCategories:
            restaurantCategories.length > 0
              ? restaurantCategories
              : ['North Indian'],
          fssaiNumber: fssaiNumber.trim().toUpperCase(),
          documents: {
            fssaiCertificateUrl: fssaiDoc?.url,
            fssaiFileName: fssaiDoc?.name,
            kitchenPhotoUrl: kitchenPhoto?.url,
            kitchenFileName: kitchenPhoto?.name,
          },
          approvalStatus: 'pending',
          isOpen: true,
          rating: 4.8,
          prepTime: '20-25 min',
          createdAt: Date.now(),
        };
        await storeService.saveRestaurantRegistration(restRecord);
      }

      setStep('location');
    } catch {
      setAuthError('Could not save profile right now. Please retry.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocError('GPS is unavailable on this device. Open the interactive map to pin your location.');
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: GeoCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setDetectedCoords(coords);
        const locality = getLocalityFromCoords(coords);
        setDetectedAddressLabel(locality.fullLabel);
        setLocVerified(true);
        const geocoded = await reverseGeocodeCoords(coords.latitude, coords.longitude);
        if (geocoded) {
          setDetectedAddressLabel(geocoded);
        }
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setLocError(
          err.code === 1
            ? 'GPS access was declined. Tap Open Interactive Map below to pin your location.'
            : 'Unable to lock GPS coordinates quickly. Tap Open Interactive Map to select your address.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleFinishLocationSetup = async () => {
    const activeUser = storeService.getCurrentUser();
    if (activeUser) {
      await storeService.updateUserLocation(
        activeUser.phoneNumber || activeUser.id,
        {
          address: detectedAddressLabel,
          coordinates: {
            latitude: detectedCoords.latitude,
            longitude: detectedCoords.longitude,
          },
        }
      );
    }

    const updatedUser = storeService.getCurrentUser() || activeUser;
    if (updatedUser) {
      onAuthComplete({
        user: updatedUser,
        coords: detectedCoords,
        addressLabel: detectedAddressLabel,
        openPartnerPortal:
          selectedRole === 'Rider' || selectedRole === 'Restaurant'
            ? selectedRole
            : undefined,
      });
    }
    onClose();
  };

  const handleTopBack = () => {
    setAuthError(null);
    if (step === 'login') {
      setStep('welcome');
    } else if (step === 'profile') {
      setStep(currentUser ? 'account' : 'verified');
    } else if (step === 'location') {
      setStep('profile');
    } else {
      onClose();
    }
  };

  return (
    <div
      id="auth-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-linear-to-b from-[#FFF8F0] via-white to-[#FFEBD6] flex flex-col animate-in fade-in duration-150"
    >
      {/* Standardized 56px Sticky Top Header with Back Button */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleTopBack}
          id="auth-top-back-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <HelloBiteLogo size="sm" />

        <div className="w-11 sm:w-16" aria-hidden="true" />
      </header>

      {/* Scrollable Full-Screen Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {/* ACCOUNT VIEW (WHEN LOGGED IN WITH GOOGLE) */}
            {step === 'account' && currentUser && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-3xl p-5 border border-[#F5E6D3] shadow-sm flex items-center gap-4">
                  {currentUser.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#FF6B00] to-amber-500 text-white font-black text-2xl flex items-center justify-center shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display font-black text-lg text-[#3D1C0A] truncate">
                        {currentUser.name}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-xs text-[#7C4A22] font-medium truncate">
                      {currentUser.email ||
                        (currentUser.phoneNumber &&
                        currentUser.phoneNumber !== '0000000000'
                          ? `+91 ${currentUser.phoneNumber}`
                          : 'Verified Hello Bite Account')}
                    </p>
                    <div className="mt-1 text-xs font-extrabold text-[#FF6B00]">
                      Verified Google Account ·{' '}
                      <span className="text-emerald-700 uppercase">
                        {currentUser.accountStatus || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(currentUser.role === 'Rider' ||
                    currentUser.role === 'Restaurant') &&
                    onOpenPartnerDashboard && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPartnerDashboard(
                            currentUser.role as UserRole
                          );
                          onClose();
                        }}
                        className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {currentUser.role === 'Rider' ? (
                          <Bike className="w-4 h-4" />
                        ) : (
                          <Store className="w-4 h-4" />
                        )}
                        <span>Open {currentUser.role} Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => setStep('profile')}
                    className="w-full min-h-[48px] bg-white hover:bg-orange-50 text-[#3D1C0A] font-bold text-sm py-3 rounded-2xl border border-[#F5E6D3] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInteractiveMap) {
                        onClose();
                        onOpenInteractiveMap();
                      } else {
                        setStep('location');
                      }
                    }}
                    className="w-full min-h-[48px] bg-white hover:bg-orange-50 text-[#3D1C0A] font-bold text-sm py-3 rounded-2xl border border-[#F5E6D3] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Update Delivery GPS Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setStep('welcome');
                    }}
                    className="w-full min-h-[48px] bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm py-3 rounded-2xl border border-red-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Google Account</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 1: WELCOME SCREEN */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-5 text-center"
              >
                <div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-[#3D1C0A] leading-tight">
                    Good Food. Fresh Tiffins. Hot Delivery.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7C4A22] mt-1.5">
                    Sign in with your mobile number &amp; OTP to save your doorstep location &amp; track live orders
                  </p>
                </div>

                <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                  <img
                    src={welcomeFeastImg}
                    alt="Hello Bite Signature Meal Feast"
                    className="w-full h-56 sm:h-64 object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-[#F5E6D3] shadow-xs flex flex-col items-center">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mb-2">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#3D1C0A]">
                      Fresh Food Delivery
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#F5E6D3] shadow-xs flex flex-col items-center">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#FF6B00] flex items-center justify-center mb-2">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#3D1C0A]">
                      Daily Hot Tiffins
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Customer');
                    setAuthError(null);
                    setStep('login');
                  }}
                  id="auth-welcome-get-started"
                  className="w-full min-h-[52px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-base py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue with Phone Number (OTP)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* SCREEN 2: MOBILE NUMBER + OTP AUTHENTICATION */}
            {step === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1">
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-[#3D1C0A]">
                    {otpSent ? 'Verify Phone OTP' : 'Enter Mobile Number'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7C4A22]">
                    {otpSent
                      ? `We have sent a 6-digit OTP to +91 ${phoneMobile}`
                      : 'Sign in securely with real Firebase Phone OTP'}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F5E6D3] shadow-sm space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1.5">
                          Mobile Number * (+91 India)
                        </label>
                        <div className="flex gap-2">
                          <div className="bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-3 text-xs sm:text-sm font-extrabold text-[#3D1C0A] flex items-center justify-center shrink-0">
                            🇮🇳 +91
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phoneMobile}
                            onChange={(e) => setPhoneMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="Enter 10-digit mobile"
                            required
                            className="w-full min-h-[48px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-4 py-3 text-sm sm:text-base font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm p-3.5 rounded-2xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span className="font-semibold">{authError}</span>
                        </div>
                      )}

                      <div id="recaptcha-container" />

                      <button
                        type="submit"
                        disabled={authLoading || phoneMobile.replace(/\D/g, '').length !== 10}
                        id="auth-send-otp-btn"
                        className="w-full min-h-[52px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 disabled:opacity-50 text-white font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1.5">
                          Enter 6-Digit OTP Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="• • • • • •"
                          required
                          className="w-full min-h-[52px] text-center tracking-[0.75em] text-xl sm:text-2xl font-black bg-[#FFF8F0] border border-orange-200 rounded-xl px-4 py-3 text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                        />
                      </div>

                      {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm p-3.5 rounded-2xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span className="font-semibold">{authError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs font-bold text-[#7C4A22]">
                        <span>
                          {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Did not receive code?'}
                        </span>
                        <button
                          type="button"
                          disabled={!canResend || authLoading}
                          onClick={handleSendOtp}
                          className={`cursor-pointer ${canResend ? 'text-[#FF6B00] underline font-black' : 'text-stone-400 cursor-not-allowed'}`}
                        >
                          Resend OTP
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading || otpCode.length !== 6}
                        id="auth-verify-otp-btn"
                        className="w-full min-h-[52px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 disabled:opacity-50 text-white font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <>
                            <span>Verify &amp; Continue</span>
                            <CheckCircle2 className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setAuthError(null);
                        }}
                        className="w-full text-center text-xs text-[#7C4A22] hover:text-[#FF6B00] font-bold py-1 cursor-pointer"
                      >
                        ← Change Mobile Number
                      </button>
                    </form>
                  )}

                  <div className="bg-[#FFF8F0] rounded-2xl p-3.5 border border-[#F5E6D3] text-xs text-[#7C4A22] leading-relaxed">
                    Powered by Firebase Phone Authentication. Ensure SMS phone authentication provider is enabled in your Firebase Console.
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: GMAIL VERIFIED SUCCESS */}
            {step === 'verified' && (
              <motion.div
                key="verified"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 text-center space-y-5 bg-white rounded-3xl p-6 border border-[#F5E6D3] shadow-sm"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-11 h-11" />
                </div>
                <div>
                  <h2 className="font-display font-black text-2xl text-[#3D1C0A]">
                    Google Account Connected!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7C4A22] mt-1">
                    Signed in via Firebase as{' '}
                    <strong className="text-[#3D1C0A]">
                      {verifiedEmail || currentUser?.email}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Complete Profile Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* SCREEN 4: PROFILE SETUP */}
            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="font-display font-black text-xl sm:text-2xl text-[#3D1C0A]">
                    Complete Foodie Profile
                  </h2>
                  {(verifiedEmail || currentUser?.email) && (
                    <p className="text-xs text-emerald-700 font-bold mt-0.5">
                      Gmail: {verifiedEmail || currentUser?.email}
                    </p>
                  )}
                </div>

                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-2xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                  <div className="bg-white rounded-2xl p-3.5 border border-[#F5E6D3] flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profilePhotoUrl ? (
                        <img
                          src={profilePhotoUrl}
                          alt="Avatar preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#FF6B00]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-[#3D1C0A]">
                        Profile Photo
                      </div>
                      <div className="text-[11px] text-[#7C4A22]">
                        {uploadingField === 'avatar'
                          ? 'Uploading...'
                          : 'Synced from Google or upload custom'}
                      </div>
                    </div>
                    <label className="min-h-[40px] flex items-center bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer shrink-0">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload('avatar', e.target.files?.[0])
                        }
                      />
                    </label>
                  </div>

                  <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] space-y-3.5 shadow-xs">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1">
                        {selectedRole === 'Restaurant'
                          ? 'Owner Name *'
                          : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Satyam Singh"
                        required
                        className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1">
                          Phone (For Delivery)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#FF6B00] absolute left-3 top-3" />
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) =>
                              setPhoneInput(
                                e.target.value.replace(/\D/g, '').slice(0, 10)
                              )
                            }
                            placeholder="10 digits"
                            className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-bold text-[#3D1C0A]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1">
                          City Hub
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#3D1C0A]"
                        >
                          <option value="Gopalganj">Gopalganj</option>
                          <option value="Siwan">Siwan</option>
                        </select>
                      </div>
                    </div>

                    {selectedRole === 'Rider' && (
                      <div className="pt-2 border-t border-orange-100 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {(['Bike', 'Scooter', 'Bicycle'] as const).map((vt) => (
                            <button
                              key={vt}
                              type="button"
                              onClick={() => setVehicleType(vt)}
                              className={`min-h-[44px] py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                                vehicleType === vt
                                  ? 'bg-[#FF6B00] text-white border-[#FF6B00]'
                                  : 'bg-[#FFF8F0] text-[#3D1C0A] border-orange-200'
                              }`}
                            >
                              {vt}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                            placeholder="Vehicle No (BR-28-...)"
                            required
                            className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                          />
                          <input
                            type="text"
                            value={drivingLicenceNumber}
                            onChange={(e) =>
                              setDrivingLicenceNumber(e.target.value)
                            }
                            placeholder="DL Number *"
                            required
                            className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2.5 text-center cursor-pointer text-[11px] font-bold">
                            <Upload className="w-4 h-4 text-[#FF6B00] mx-auto mb-0.5" />
                            {dlDoc ? `✓ ${dlDoc.name}` : 'Upload DL'}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload('dl', e.target.files?.[0])
                              }
                            />
                          </label>
                          <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2.5 text-center cursor-pointer text-[11px] font-bold">
                            <FileText className="w-4 h-4 text-[#FF6B00] mx-auto mb-0.5" />
                            {rcDoc ? `✓ ${rcDoc.name}` : 'Upload RC'}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload('rc', e.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedRole === 'Restaurant' && (
                      <div className="pt-2 border-t border-orange-100 space-y-3">
                        <input
                          type="text"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          placeholder="Restaurant / Kitchen Name *"
                          required
                          className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3D1C0A]"
                        />
                        <input
                          type="text"
                          value={restaurantAddress}
                          onChange={(e) =>
                            setRestaurantAddress(e.target.value)
                          }
                          placeholder="Full Kitchen Address *"
                          required
                          className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#3D1C0A]"
                        />
                        <input
                          type="text"
                          value={fssaiNumber}
                          onChange={(e) => setFssaiNumber(e.target.value)}
                          placeholder="14-digit FSSAI Number *"
                          required
                          className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {FOOD_CATEGORY_OPTIONS.map((cat) => {
                            const active = restaurantCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() =>
                                  setRestaurantCategories((prev) =>
                                    active
                                      ? prev.filter((c) => c !== cat)
                                      : [...prev, cat]
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                  active
                                    ? 'bg-[#FF6B00] text-white'
                                    : 'bg-[#FFF8F0] text-[#3D1C0A] border border-orange-200'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2.5 text-center cursor-pointer text-[11px] font-bold">
                            <FileText className="w-4 h-4 text-[#FF6B00] mx-auto mb-0.5" />
                            {fssaiDoc
                              ? `✓ ${fssaiDoc.name}`
                              : 'FSSAI Certificate'}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload('fssai', e.target.files?.[0])
                              }
                            />
                          </label>
                          <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2.5 text-center cursor-pointer text-[11px] font-bold">
                            <Camera className="w-4 h-4 text-[#FF6B00] mx-auto mb-0.5" />
                            {kitchenPhoto
                              ? `✓ ${kitchenPhoto.name}`
                              : 'Kitchen Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload('kitchen', e.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || uploadingField !== null}
                    className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Save Profile &amp; Set Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* SCREEN 5: LOCATION PERMISSION SCREEN */}
            {step === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-lg mb-3">
                    <Navigation className="w-8 h-8" />
                  </div>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-[#3D1C0A]">
                    Set Your Delivery Location
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7C4A22] mt-1">
                    Used for GPS delivery pricing &amp; live rider tracking
                  </p>
                </div>

                <button
                  type="button"
                  disabled={locLoading}
                  onClick={handleDetectGpsLocation}
                  className="w-full min-h-[48px] bg-[#3D1C0A] hover:bg-[#542911] text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {locLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  ) : (
                    <Navigation className="w-4 h-4 text-orange-400" />
                  )}
                  <span>
                    {locLoading ? 'Detecting GPS...' : 'Detect Current Location'}
                  </span>
                </button>

                {locError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3 rounded-2xl">
                    {locError}
                  </div>
                )}

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-[#3D1C0A]">
                          {detectedAddressLabel}
                        </div>
                        <div className="text-xs text-[#7C4A22] tabular-nums">
                          {dynamicFeePreview.nearestHubName} ·{' '}
                          {dynamicFeePreview.distanceKm.toFixed(1)} km (
                          {dynamicFeePreview.isServiceable
                            ? `₹${dynamicFeePreview.calculatedFee} delivery`
                            : 'Outside radius'}
                          )
                        </div>
                      </div>
                    </div>
                    {locVerified && (
                      <span className="text-[11px] font-black text-emerald-700">
                        GPS Lock
                      </span>
                    )}
                  </div>

                  {onOpenInteractiveMap && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenInteractiveMap();
                      }}
                      className="w-full min-h-[44px] bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-bold text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-orange-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Open Interactive Google Map</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleFinishLocationSetup}
                  className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm sm:text-base py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirm &amp; Enter Hello Bite</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
