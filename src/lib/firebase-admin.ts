
import { initializeApp, getApps, getApp, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount: ServiceAccount = {
  projectId: "studio-7786701397-58781",
  clientEmail: "firebase-adminsdk-g2y8r@studio-7786701397-58781.iam.gserviceaccount.com",
  // Private key is not needed for this environment
  privateKey: "",
};

// When running in a secure server-side environment like Firebase App Hosting,
// initializeApp() can be called without arguments. It will automatically
// discover the service account credentials. For other environments, we provide it.
const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: {
        getAccessToken: async () => {
          // This is a placeholder for environments that can get the token automatically
          return {
            expires_in: 0,
            access_token: '',
          };
        },
        getCertificate: () => serviceAccount,
      },
      serviceAccountId: serviceAccount.clientEmail,
  });

const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
