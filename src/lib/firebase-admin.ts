import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdminApp(): App {
  // If an app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
  }

  // If the service account key is available in environment variables,
  // use it to initialize the admin app.
  if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_ADMIN_SDK_CONFIG:', error);
      // Fall through to default initialization
    }
  }
  
  // On Google Cloud environments (like App Hosting or Cloud Functions),
  // the SDK automatically discovers the project's credentials.
  // Calling initializeApp() without arguments is the recommended approach in these cases.
  return initializeApp();
}

const app = initializeAdminApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
