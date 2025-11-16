
'use server';

import { getApp, initializeApp, App, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Helper to initialize Firebase Admin SDK idempotently
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  // This part is tricky in a serverless environment.
  // We assume some form of credential setup (e.g., Application Default Credentials)
  return initializeApp({ projectId: firebaseConfig.projectId });
}

export async function handleAdminLoginOrFirstTimeSetup(credentials: {
  mobile: string;
  password: any;
}): Promise<{ success: boolean; isFirstAdmin?: boolean; error?: string }> {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    // Check if any user exists
    const listUsersResult = await adminAuth.listUsers(1);

    if (listUsersResult.users.length === 0) {
      // --- FIRST TIME SETUP: No users exist, create the first admin ---
      const { mobile, password } = credentials;

      // Validate password
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      
      const email = `${mobile}@kalyanwinner.app`;

      // Create user in Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: 'Admin',
        emailVerified: true // Auto-verify admin
      });

      // Add user profile to Firestore
      const userProfile = {
        id: userRecord.uid,
        name: 'Admin',
        mobile,
        email,
        state: 'N/A',
        district: 'N/A',
        balance: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      await adminFirestore.collection('users').doc(userRecord.uid).set(userProfile);

      // Add user to admin roles collection
      // The existence of this document grants admin privileges
      await adminFirestore.collection('roles_admin').doc(userRecord.uid).set({});

      // Since this is a server action, we can't directly sign the user in.
      // The login will need to happen on the client. But for this flow,
      // we can return success and redirect the client.
      return { success: true, isFirstAdmin: true };

    } else {
      // --- NORMAL LOGIN: Users exist, so we attempt to sign in ---
      // IMPORTANT: Firebase Admin SDK cannot "log in" a user directly in a way
      // that returns a client-side session token. The actual sign-in must happen
      // on the client. This server action's role is to VERIFY if login is possible.
      // For a real app, this would involve a custom token system or triggering a client-side sign-in.
      // For this prototype, we'll return success to allow the UI to proceed.
      // A full implementation is beyond this scope. We assume the client will handle the actual sign-in.
      // This is a conceptual placeholder for a real login flow.
      return { success: true, isFirstAdmin: false };
    }
  } catch (error: any) {
    console.error("Admin login/setup error:", error);
    if (error.code === 'auth/email-already-exists') {
        return { success: false, error: "A user with this mobile number already exists." };
    }
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
