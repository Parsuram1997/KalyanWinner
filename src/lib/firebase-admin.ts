
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!getApps().length) {
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: "studio-7786701397-58781",
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to default.", e);
      initializeApp({
        projectId: "studio-7786701397-58781",
      });
    }
  } else {
    // Fallback for environments where the service account is discovered automatically
    initializeApp({
      projectId: "studio-7786701397-58781",
    });
  }
}

const app = getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const messaging = getMessaging(app);

export { app, auth, firestore, messaging };
