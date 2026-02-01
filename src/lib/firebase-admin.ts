
import { initializeApp, getApps, getApp, type App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function initializeAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
  }

  // Try to use the service account key from the environment variable if it exists.
  // This is more explicit and can be more reliable in some environments.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }
  
  // On Google Cloud environments (like App Hosting or Cloud Functions),
  // if the service account key isn't provided, the SDK automatically
  // discovers the project's credentials.
  return initializeApp();
}

const app = initializeAdminApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const messaging = getMessaging(app);

export { app, auth, firestore, messaging };
