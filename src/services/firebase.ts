import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
  UserCredential,
} from 'firebase/auth';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = firebaseAppletConfig;

export const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(firebaseAppletConfig)
  : getApp();

export const firestoreDbId =
  firebaseAppletConfig.firestoreDatabaseId || undefined;

export const auth: Auth = getAuth(firebaseApp);

if (typeof window !== 'undefined') {
  auth.useDeviceLanguage();
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase Auth persistence notice:', err);
  });
}

export const storage: FirebaseStorage = getStorage(firebaseApp);

export const db: Firestore = (() => {
  try {
    return initializeFirestore(
      firebaseApp,
      {
        experimentalForceLongPolling: true,
      },
      firestoreDbId
    );
  } catch {
    return firestoreDbId
      ? getFirestore(firebaseApp, firestoreDbId)
      : getFirestore(firebaseApp);
  }
})();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export async function signInWithGooglePopup(): Promise<UserCredential> {
  const provider = createGoogleProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithGoogleRedirect(): Promise<void> {
  const provider = createGoogleProvider();
  await signInWithRedirect(auth, provider);
}

export async function consumeGoogleRedirectResult(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.warn('Google redirect result notice:', err);
    return null;
  }
}

export function formatGoogleAuthError(err: unknown): {
  code: string;
  message: string;
  canOfferRedirect: boolean;
} {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const rawMessage = err instanceof Error ? err.message : String(err || '');

  if (code === 'auth/popup-blocked' || rawMessage.includes('popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      message:
        'Your browser blocked the Google sign-in window. Allow popups for this site and tap Retry, or use browser redirect sign-in below.',
      canOfferRedirect: true,
    };
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    rawMessage.includes('popup-closed-by-user')
  ) {
    return {
      code: 'auth/popup-closed-by-user',
      message:
        'Google sign-in window was closed before completing login. Tap Retry Google Sign-In to try again.',
      canOfferRedirect: false,
    };
  }
  if (
    code === 'auth/cancelled-popup-request' ||
    rawMessage.includes('cancelled-popup-request')
  ) {
    return {
      code: 'auth/cancelled-popup-request',
      message:
        'Previous Google sign-in attempt was interrupted. Tap Retry Google Sign-In below.',
      canOfferRedirect: true,
    };
  }
  if (
    code === 'auth/unauthorized-domain' ||
    rawMessage.includes('unauthorized-domain')
  ) {
    const host =
      typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return {
      code: 'auth/unauthorized-domain',
      message: `Domain "${host}" is not authorized in Firebase Auth settings yet. Tap Retry after domain authorization or try opening in a top-level browser tab.`,
      canOfferRedirect: false,
    };
  }
  if (
    code === 'auth/network-request-failed' ||
    rawMessage.includes('network-request-failed')
  ) {
    return {
      code: 'auth/network-request-failed',
      message:
        'Network error reaching Google Authentication. Check your internet connection and tap Retry.',
      canOfferRedirect: false,
    };
  }
  if (
    code === 'auth/operation-not-allowed' ||
    rawMessage.includes('operation-not-allowed')
  ) {
    return {
      code: 'auth/operation-not-allowed',
      message:
        'Google Sign-In provider needs to be enabled in Firebase Authentication. Tap Retry once active.',
      canOfferRedirect: false,
    };
  }
  if (code === 'auth/internal-error' || rawMessage.includes('internal-error')) {
    return {
      code: 'auth/internal-error',
      message:
        'Embedded browser frame restricted popup cookies. Allow third-party cookies/popups and tap Retry, or use browser redirect.',
      canOfferRedirect: true,
    };
  }

  return {
    code: code || 'auth/unknown',
    message:
      rawMessage ||
      'Unable to complete Google Sign-In right now. Please tap Retry.',
    canOfferRedirect: true,
  };
}

export async function signInWithGmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithGmailPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
}

export function subscribeFirebaseAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithBackendCustomToken(
  customToken: string
): Promise<UserCredential | null> {
  if (!customToken) return null;
  try {
    return await signInWithCustomToken(auth, customToken);
  } catch (err) {
    console.warn('Firebase custom token sign-in notice:', err);
    return null;
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
}

function readFileAsCompressedDataUrl(file: File, maxSide = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!file.type.startsWith('image/')) {
        resolve(result);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const scale = Math.min(
          1,
          maxSide / Math.max(img.width || 1, img.height || 1)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPartnerFile(
  storagePath: string,
  file: File
): Promise<{ url: string; fileName: string; storedInCloud: boolean }> {
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await Promise.race([
      uploadBytes(storageRef, file),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timeout')), 6500)
      ),
    ]);
    const url = await getDownloadURL(snapshot.ref);
    return { url, fileName: file.name, storedInCloud: true };
  } catch (err) {
    console.warn('Firebase Storage fallback to optimized local preview:', err);
    const url = await readFileAsCompressedDataUrl(file);
    return { url, fileName: file.name, storedInCloud: false };
  }
}

export async function getMessagingSafe() {
  if (typeof window === 'undefined') return null;
  try {
    const messagingMod = await import('firebase/messaging');
    const supported = await messagingMod.isSupported();
    if (!supported) return null;
    return messagingMod.getMessaging(firebaseApp);
  } catch {
    return null;
  }
}

export async function initAppCheckSafe() {
  if (typeof window === 'undefined') return null;
  const siteKey = (firebaseAppletConfig as { recaptchaSiteKey?: string })
    .recaptchaSiteKey;
  if (!siteKey || !siteKey.trim()) return null;
  try {
    const appCheckMod = await import('firebase/app-check');
    return appCheckMod.initializeAppCheck(firebaseApp, {
      provider: new appCheckMod.ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    return null;
  }
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('the client is offline') ||
        (error as { code?: string }).code === 'unavailable' ||
        error.message.includes('unavailable')
      ) {
        console.warn(
          'Firestore notice: operating in offline-first mode, will sync automatically when server connection is ready.'
        );
      } else if (
        error.message.includes('permission') ||
        (error as { code?: string }).code === 'permission-denied'
      ) {
        handleFirestoreError(error, OperationType.GET, 'test/connection');
      } else {
        console.warn('Firestore initial test notice:', error.message);
      }
    }
    return false;
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testFirestoreConnection().catch(() => {});
    initAppCheckSafe().catch(() => {});
  }, 1000);
}
