import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  MapPin,
  Navigation,
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
  Bike,
  Car,
  Store,
  Utensils,
  LogOut,
  FileText,
  Phone,
  Eye,
  EyeOff,
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
  signInWithGmailPassword,
  signUpWithGmailPassword,
  uploadPartnerFile,
} from '../../services/firebase';
import {
  GeoCoordinates,
  getLocalityFromCoords,
  calculateDynamicDeliveryPricing,
} from '../../utils/geoUtils';
import { reverseGeocodeCoords } from '../../utils/mapsClient';
import { HelloBiteLogo } from './HelloBiteLogo';

import welcomeFeastImg from '../../assets/images/hellobite_welcome_feast_1794635220422.jpg';
import roleFoodImg from '../../assets/images/role_food_bowl_1794635221244.jpg';

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

  // Firebase Gmail Auth State
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [gmailInput, setGmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedUid, setVerifiedUid] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  // Profile / Role Setup Form
  const [fullName, setFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [city, setCity] = useState('Gopalganj');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Rider fields
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooter' | 'Cab'>(
    'Bike'
  );
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState('');
  const [dlDoc, setDlDoc] = useState<{ url: string; name: string } | null>(null);
  const [rcDoc, setRcDoc] = useState<{ url: string; name: string } | null>(null);

  // Restaurant fields
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>([
    'North Indian',
    'Fast Food',
  ]);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [fssaiDoc, setFssaiDoc] = useState<{ url: string; name: string } | null>(
    null
  );
  const [kitchenPhoto, setKitchenPhoto] = useState<{
    url: string;
    name: string;
  } | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    setAuthError(null);

    if (currentUser && !initialStep) {
      setStep('account');
      setSelectedRole(
        currentUser.role === 'Admin'
          ? 'Customer'
          : (currentUser.role as UserRole)
      );
      setFullName(currentUser.name || '');
      setVerifiedEmail(currentUser.email || '');
      setGmailInput(currentUser.email || '');
      setPhoneInput(currentUser.phoneNumber || '');
      setCity(currentUser.city || 'Gopalganj');
      setProfilePhotoUrl(currentUser.profileImage || '');
    } else {
      setStep(initialStep || 'welcome');
    }
  }, [isOpen, currentUser, initialStep]);

  if (!isOpen) return null;

  const cleanDigitsPhone = phoneInput.replace(/\D/g, '').slice(-10);
  const dynamicFeePreview: DynamicDeliveryFee =
    calculateDynamicDeliveryPricing(detectedCoords);

  const handleGoogleGmailLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithGooglePopup();
      const gUser = cred.user;
      const email = gUser.email || '';
      const name =
        gUser.displayName || (email ? email.split('@')[0] : 'Hello Bite User');

      setVerifiedUid(gUser.uid);
      setVerifiedEmail(email);
      setGmailInput(email);
      setFullName(name);
      setProfilePhotoUrl(gUser.photoURL || '');
      if (gUser.phoneNumber) {
        setPhoneInput(gUser.phoneNumber.replace(/\D/g, '').slice(-10));
      }

      // Immediately persist Firebase Gmail user profile to Firestore
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

      setStep('verified');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.55 } });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Google Sign-In failed.';
      if (msg.includes('popup-closed-by-user')) {
        setAuthError(
          'Google sign-in popup was closed before finishing. Tap Continue with Google to retry.'
        );
      } else if (msg.includes('popup-blocked')) {
        setAuthError(
          'Browser blocked the Google sign-in popup. Please allow popups or sign in below with Gmail & Password.'
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!gmailInput.trim() || !gmailInput.includes('@')) {
      setAuthError('Please enter a valid Gmail or email address.');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);
    try {
      const cred =
        emailMode === 'signup'
          ? await signUpWithGmailPassword(
              gmailInput,
              passwordInput,
              fullName || gmailInput.split('@')[0]
            )
          : await signInWithGmailPassword(gmailInput, passwordInput);

      const fUser = cred.user;
      const resolvedName =
        fUser.displayName || fullName || gmailInput.split('@')[0];

      setVerifiedUid(fUser.uid);
      setVerifiedEmail(fUser.email || gmailInput.trim());
      setFullName(resolvedName);
      setProfilePhotoUrl(fUser.photoURL || '');

      await storeService.saveUserProfile({
        uid: fUser.uid,
        phoneNumber: cleanDigitsPhone || '0000000000',
        name: resolvedName,
        email: fUser.email || gmailInput.trim(),
        role: selectedRole,
        city,
      });

      setStep('verified');
      confetti({ particleCount: 65, spread: 60, origin: { y: 0.55 } });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Email authentication failed.';
      if (msg.includes('operation-not-allowed')) {
        setAuthError(
          'Email/Password sign-in is not enabled in Firebase Console yet. Tap "Continue with Google (Gmail)" above for instant 1-tap login!'
        );
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setAuthError('Incorrect email or password. Try again or use Continue with Google.');
      } else if (msg.includes('email-already-in-use')) {
        setAuthError('This Gmail already has an account. Switch to "Sign In" tab.');
      } else {
        setAuthError(msg);
      }
    } finally {
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
        email: verifiedEmail || gmailInput.trim() || currentUser?.email,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-linear-to-b from-[#FFF8F0] via-white to-[#FFEBD6] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col border border-orange-200/80 relative"
          >
            {/* Warm Curved Orange Accent Header Band (matches Hello Bite App Experience design) */}
            <div className="bg-linear-to-br from-[#FF6B00] via-[#FF851B] to-[#FFB347] px-4 pt-3.5 pb-6 rounded-b-[28px] relative shrink-0">
              <div className="flex items-center justify-between">
                {step !== 'welcome' &&
                step !== 'account' &&
                step !== 'verified' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      if (step === 'login') setStep('welcome');
                      else if (step === 'profile')
                        setStep(currentUser ? 'account' : 'login');
                      else if (step === 'location') setStep('profile');
                    }}
                    className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/35 text-white flex items-center justify-center cursor-pointer"
                    aria-label="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-9" />
                )}

                <div className="bg-white/95 px-3.5 py-1.5 rounded-2xl shadow-sm">
                  <HelloBiteLogo size="sm" />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/25 hover:bg-white/35 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-6 pt-4 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {/* =================================================== */}
                {/* ACCOUNT VIEW (WHEN LOGGED IN WITH GMAIL)            */}
                {/* =================================================== */}
                {step === 'account' && currentUser && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-white rounded-3xl p-4 border border-orange-100 shadow-sm flex items-center gap-3.5">
                      {currentUser.profileImage ? (
                        <img
                          src={currentUser.profileImage}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#FF6B00] to-amber-500 text-white font-black text-2xl flex items-center justify-center">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display font-black text-base text-[#3D1C0A] truncate">
                            {currentUser.name}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-xs text-stone-500 font-medium truncate">
                          {currentUser.email ||
                            (currentUser.phoneNumber &&
                            currentUser.phoneNumber !== '0000000000'
                              ? `+91 ${currentUser.phoneNumber}`
                              : 'Verified Hello Bite Account')}
                        </p>
                        <div className="mt-1 text-[11px] font-extrabold text-[#FF6B00]">
                          Role: {currentUser.role} ·{' '}
                          <span className="text-emerald-700 uppercase">
                            {currentUser.accountStatus || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
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
                            className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
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
                        onClick={() => {
                          if (onOpenInteractiveMap) {
                            onClose();
                            onOpenInteractiveMap();
                          } else {
                            setStep('location');
                          }
                        }}
                        className="w-full bg-white hover:bg-orange-50 text-[#3D1C0A] font-bold text-xs py-3 rounded-2xl border border-orange-200 flex items-center justify-center gap-2 cursor-pointer"
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
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-3 rounded-2xl border border-red-200 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of Gmail Account</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* =================================================== */}
                {/* SCREEN 1: WELCOME SCREEN                            */}
                {/* =================================================== */}
                {step === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    className="space-y-4 text-center"
                  >
                    <div>
                      <h2 className="font-display font-black text-xl text-[#3D1C0A]">
                        Good Food. Great Rides. Better Life.
                      </h2>
                    </div>

                    <div className="relative rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                      <img
                        src={welcomeFeastImg}
                        alt="Hello Bite Signature Burger and Feast"
                        className="w-full h-48 object-cover"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-xs flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mb-1.5">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-extrabold text-[#3D1C0A]">
                          Fresh Food Delivery
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl p-3 border border-orange-100 shadow-xs flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#FF6B00] flex items-center justify-center mb-1.5">
                          <Car className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-extrabold text-[#3D1C0A]">
                          Quick Rides &amp; Tiffins
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('Customer');
                        setStep('login');
                      }}
                      id="auth-welcome-get-started"
                      className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-base py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Sign In with Gmail</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="text-[11px] font-bold text-[#7C4A22] tracking-wider">
                      Fast Delivery · Live Map Tracking
                    </div>
                  </motion.div>
                )}

                {/* =================================================== */}
                {/* SCREEN 3: WELCOME BACK! FIREBASE GMAIL AUTH         */}
                {/* =================================================== */}
                {step === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <h2 className="font-display font-black text-2xl text-[#3D1C0A]">
                        Welcome Back!
                      </h2>
                      <p className="text-xs text-[#7C4A22] mt-0.5">
                        Sign in with Gmail via Firebase to continue as{' '}
                        <strong className="text-[#FF6B00]">{selectedRole}</strong>
                      </p>
                    </div>

                    {authError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-2xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {/* Primary 1-Tap Google / Gmail Firebase Auth Button */}
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={handleGoogleGmailLogin}
                      id="auth-google-gmail-btn"
                      className="w-full bg-white hover:bg-orange-50 active:scale-99 text-[#3D1C0A] font-black text-sm py-3.5 px-4 rounded-2xl border-2 border-orange-200 shadow-md flex items-center justify-center gap-3 cursor-pointer transition-all"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-[#FF6B00]" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.4 1.8 14.9 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.8z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                          />
                        </svg>
                      )}
                      <span>
                        {authLoading
                          ? 'Connecting to Gmail...'
                          : 'Continue with Gmail / Google'}
                      </span>
                    </button>

                    <div className="flex items-center gap-3 px-2">
                      <div className="flex-1 h-px bg-orange-200" />
                      <span className="text-[11px] font-bold text-[#7C4A22]">
                        or use Gmail &amp; Password
                      </span>
                      <div className="flex-1 h-px bg-orange-200" />
                    </div>

                    {/* Secondary Gmail + Password Card */}
                    <form
                      onSubmit={handleGmailPasswordAuth}
                      className="bg-white rounded-3xl p-4 border border-orange-100 shadow-xs space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-1 bg-[#FFF8F0] p-1 rounded-xl border border-orange-100">
                        <button
                          type="button"
                          onClick={() => setEmailMode('signin')}
                          className={`py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                            emailMode === 'signin'
                              ? 'bg-[#FF6B00] text-white'
                              : 'text-[#7C4A22]'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailMode('signup')}
                          className={`py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                            emailMode === 'signup'
                              ? 'bg-[#FF6B00] text-white'
                              : 'text-[#7C4A22]'
                          }`}
                        >
                          New Account
                        </button>
                      </div>

                      {emailMode === 'signup' && (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                        />
                      )}

                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#FF6B00] absolute left-3 top-3" />
                        <input
                          type="email"
                          value={gmailInput}
                          onChange={(e) => setGmailInput(e.target.value)}
                          placeholder="yourname@gmail.com"
                          required
                          className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                        />
                      </div>

                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#FF6B00] absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Password (min 6 chars)"
                          required
                          className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl pl-9 pr-9 py-2.5 text-xs font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-stone-400 hover:text-[#3D1C0A] cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-sm py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>
                          {emailMode === 'signup'
                            ? 'Create Account with Gmail'
                            : 'Sign In with Gmail'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Good Food, Good Mood bottom accent */}
                    <div className="flex items-center justify-between bg-white/80 rounded-2xl p-2.5 border border-orange-100">
                      <span className="font-display font-black text-sm text-[#3D1C0A] pl-1">
                        Good Food, Good Mood
                      </span>
                      <img
                        src={roleFoodImg}
                        alt="Good Food"
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    </div>
                  </motion.div>
                )}

                {/* =================================================== */}
                {/* SCREEN 4: GMAIL VERIFIED SUCCESS                    */}
                {/* =================================================== */}
                {step === 'verified' && (
                  <motion.div
                    key="verified"
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4 text-center space-y-4"
                  >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-linear-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <CheckCircle2 className="w-11 h-11" />
                    </div>
                    <div>
                      <h2 className="font-display font-black text-2xl text-[#3D1C0A]">
                        Gmail Connected!
                      </h2>
                      <p className="text-xs text-[#7C4A22] mt-1">
                        Signed in via Firebase as{' '}
                        <strong className="text-[#3D1C0A]">
                          {verifiedEmail || gmailInput}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('profile')}
                      className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue {selectedRole} Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* =================================================== */}
                {/* SCREEN 5: ROLE-SPECIFIC PROFILE & KYC SETUP         */}
                {/* =================================================== */}
                {step === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <h2 className="font-display font-black text-xl text-[#3D1C0A]">
                        {selectedRole === 'Customer'
                          ? 'Complete Foodie Profile'
                          : selectedRole === 'Rider'
                            ? 'Rider KYC & Vehicle Setup'
                            : 'Restaurant Partner Onboarding'}
                      </h2>
                      {verifiedEmail && (
                        <p className="text-xs text-emerald-700 font-bold mt-0.5">
                          Gmail: {verifiedEmail}
                        </p>
                      )}
                    </div>

                    {authError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-2xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                      <div className="bg-white rounded-2xl p-3 border border-orange-100 flex items-center gap-3">
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
                          <div className="text-xs font-extrabold text-[#3D1C0A]">
                            Profile Photo
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {uploadingField === 'avatar'
                              ? 'Uploading...'
                              : 'Synced from Gmail or upload custom'}
                          </div>
                        </div>
                        <label className="bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer shrink-0">
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

                      <div className="bg-white rounded-3xl p-4 border border-orange-100 space-y-3 shadow-xs">
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
                            className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-extrabold text-[#3D1C0A] uppercase mb-1">
                              Phone (For Delivery)
                            </label>
                            <div className="relative">
                              <Phone className="w-3.5 h-3.5 text-[#FF6B00] absolute left-2.5 top-2.5" />
                              <input
                                type="tel"
                                value={phoneInput}
                                onChange={(e) =>
                                  setPhoneInput(
                                    e.target.value.replace(/\D/g, '').slice(0, 10)
                                  )
                                }
                                placeholder="10 digits"
                                className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl pl-8 pr-2 py-2 text-xs font-bold text-[#3D1C0A]"
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
                              className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-2.5 py-2 text-xs font-bold text-[#3D1C0A]"
                            >
                              <option value="Gopalganj">Gopalganj</option>
                              <option value="Siwan">Siwan</option>
                            </select>
                          </div>
                        </div>

                        {/* RIDER KYC */}
                        {selectedRole === 'Rider' && (
                          <div className="pt-2 border-t border-orange-100 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {(['Bike', 'Scooter', 'Cab'] as const).map((vt) => (
                                <button
                                  key={vt}
                                  type="button"
                                  onClick={() => setVehicleType(vt)}
                                  className={`py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
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
                                className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                              />
                              <input
                                type="text"
                                value={drivingLicenceNumber}
                                onChange={(e) =>
                                  setDrivingLicenceNumber(e.target.value)
                                }
                                placeholder="DL Number *"
                                required
                                className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2 text-center cursor-pointer text-[11px] font-bold">
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
                              <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2 text-center cursor-pointer text-[11px] font-bold">
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

                        {/* RESTAURANT PARTNER */}
                        {selectedRole === 'Restaurant' && (
                          <div className="pt-2 border-t border-orange-100 space-y-3">
                            <input
                              type="text"
                              value={restaurantName}
                              onChange={(e) => setRestaurantName(e.target.value)}
                              placeholder="Restaurant / Kitchen Name *"
                              required
                              className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3D1C0A]"
                            />
                            <input
                              type="text"
                              value={restaurantAddress}
                              onChange={(e) =>
                                setRestaurantAddress(e.target.value)
                              }
                              placeholder="Full Kitchen Address *"
                              required
                              className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#3D1C0A]"
                            />
                            <input
                              type="text"
                              value={fssaiNumber}
                              onChange={(e) => setFssaiNumber(e.target.value)}
                              placeholder="14-digit FSSAI Number *"
                              required
                              className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#3D1C0A]"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {FOOD_CATEGORY_OPTIONS.map((cat) => {
                                const active =
                                  restaurantCategories.includes(cat);
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
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
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
                              <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2 text-center cursor-pointer text-[11px] font-bold">
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
                              <label className="bg-[#FFF8F0] border border-dashed border-orange-300 rounded-xl p-2 text-center cursor-pointer text-[11px] font-bold">
                                <Camera className="w-4 h-4 text-[#FF6B00] mx-auto mb-0.5" />
                                {kitchenPhoto
                                  ? `✓ ${kitchenPhoto.name}`
                                  : 'Kitchen Photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileUpload(
                                      'kitchen',
                                      e.target.files?.[0]
                                    )
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
                        className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Save Profile &amp; Set Location</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* =================================================== */}
                {/* SCREEN 6: LOCATION PERMISSION SCREEN                */}
                {/* =================================================== */}
                {step === 'location' && (
                  <motion.div
                    key="location"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-linear-to-br from-[#FF6B00] to-amber-500 text-white flex items-center justify-center shadow-lg mb-2">
                        <Navigation className="w-7 h-7" />
                      </div>
                      <h2 className="font-display font-black text-xl text-[#3D1C0A]">
                        Set Your Delivery Location
                      </h2>
                      <p className="text-xs text-[#7C4A22] mt-1">
                        Used for GPS delivery pricing &amp; live rider tracking
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={locLoading}
                      onClick={handleDetectGpsLocation}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {locLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                      ) : (
                        <Navigation className="w-4 h-4 text-orange-400" />
                      )}
                      <span>
                        {locLoading
                          ? 'Detecting GPS...'
                          : 'Detect Current Location'}
                      </span>
                    </button>

                    {locError && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-2.5 rounded-xl">
                        {locError}
                      </div>
                    )}

                    <div className="bg-white rounded-3xl p-4 border border-orange-100 space-y-2.5 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-extrabold text-[#3D1C0A]">
                              {detectedAddressLabel}
                            </div>
                            <div className="text-[11px] text-stone-500">
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
                          <span className="text-[10px] font-black text-emerald-700">
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
                          className="w-full bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-bold text-xs py-2.5 px-3 rounded-xl border border-orange-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Open Interactive Google Map</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleFinishLocationSetup}
                      className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Confirm &amp; Enter Hello Bite</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
