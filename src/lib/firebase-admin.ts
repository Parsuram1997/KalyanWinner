
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app: App | undefined;

if (!getApps().length) {
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
      console.error('Error initializing Firebase Admin SDK:', e);
    }
  } else {
    console.warn(
      'Firebase Admin SDK service account key not found. Some features may be disabled.'
    );
  }
}

// Ensure app is defined before using it
const auth = app ? getAuth(app) : undefined;
const firestore = app ? getFirestore(app) : undefined;

export { auth, firestore };
