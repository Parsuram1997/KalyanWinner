
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function initializeAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
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
