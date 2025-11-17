
import { initializeApp, getApps, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // Explicitly providing the project ID and using Application Default Credentials
  // is a robust way to initialize, covering both local (with GOOGLE_APPLICATION_CREDENTIALS)
  // and hosted environments like App Hosting.
  return initializeApp({
    credential: applicationDefault(),
    projectId: 'studio-7786701397-58781',
  });
}

const app = initializeAdminApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
