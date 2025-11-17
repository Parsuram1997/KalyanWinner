
import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// It is safe to store service account credentials in the code because this file is only
// ever executed in a secure, server-side environment.
const serviceAccount: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

const app = getApps().length
  ? getApp()
  : initializeApp({
    credential: cert(serviceAccount)
  });

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };

