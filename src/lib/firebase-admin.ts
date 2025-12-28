
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function initializeAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().some(app => app.name === '[DEFAULT]')) {
    return getApp();
  }

  // If the service account key is available in environment variables,
  // use it to initialize the admin app. This is for local development.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      // Fall through to default initialization in case of parsing error
    }
  }
  
  // On Google Cloud environments (like App Hosting or Cloud Functions),
  // the SDK automatically discovers the project's credentials.
  // Calling initializeApp() without arguments is the recommended approach.
  return initializeApp();
}

const app = initializeAdminApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const messaging = getMessaging(app);

export { app, auth, firestore, messaging };
