
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app;

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

const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
