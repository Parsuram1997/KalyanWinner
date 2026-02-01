
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  // Explicitly providing the Project ID makes the initialization more robust in
  // Google Cloud environments, preventing potential ambiguity in credential discovery.
  initializeApp({
    projectId: "studio-7786701397-58781",
  });
}

const app = getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const messaging = getMessaging(app);

export { app, auth, firestore, messaging };
