
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length
  ? getApp()
  : initializeApp();

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
