
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// When running in a secure server-side environment like Firebase App Hosting,
// initializeApp() can be called without arguments. It will automatically
// discover the service account credentials.
const app = getApps().length
  ? getApp()
  : initializeApp();

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
