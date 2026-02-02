
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  auth: Auth;
  firestore: Firestore;
}

function initializeAdmin(): FirebaseAdmin {
  if (getApps().length > 0) {
    const defaultApp = getApps()[0];
    return {
      auth: getAuth(defaultApp),
      firestore: getFirestore(defaultApp),
    };
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    return {
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }
}

const { auth, firestore } = initializeAdmin();

export { auth, firestore };
