
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This function attempts to initialize the Firebase Admin SDK.
// It's designed to be robust for different server-side environments.
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    // In environments like Firebase App Hosting or Cloud Functions,
    // initializeApp() can be called without arguments. It automatically
    // discovers the necessary configuration and service account credentials.
    return initializeApp();
  } catch (error) {
    console.warn("Automatic Firebase Admin initialization failed. Falling back to Application Default Credentials.", error);
    // If automatic initialization fails (e.g., in a local dev environment
    // where GOOGLE_APPLICATION_CREDENTIALS is set), fall back to using ADC.
    return initializeApp({
      credential: applicationDefault(),
    });
  }
}

const app = initializeAdminApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
