import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = firebaseAppletConfig;

export const firebaseApp: FirebaseApp = !getApps().length 
  ? initializeApp(firebaseAppletConfig) 
  : getApp();

export const firestoreDbId = firebaseAppletConfig.firestoreDatabaseId || undefined;

export const db: Firestore = firestoreDbId 
  ? getFirestore(firebaseApp, firestoreDbId)
  : getFirestore(firebaseApp);

// Test connection on boot as mandated by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
    }
    return false;
  }
}

// Trigger initial test check
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}
