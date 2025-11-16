
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
  return initializeApp({ 
    credential: undefined,
    projectId: firebaseConfig.projectId 
  });
}

export async function handleAdminLoginOrFirstTimeSetup(credentials: {
  mobile: string;
  password: any;
  email: string;
}): Promise<{ success: boolean; isFirstAdmin?: boolean; error?: string }> {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    const listUsersResult = await adminAuth.listUsers(1);

    if (listUsersResult.users.length === 0) {
      // --- FIRST TIME SETUP: No users exist, create the first admin ---
      const { password, email, mobile } = credentials;

      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      
      // Create user in Auth with email
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
        mobile: mobile,
        email,
        state: 'N/A',
        district: 'N/A',
        balance: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      await adminFirestore.collection('users').doc(userRecord.uid).set(userProfile);

      // Grant admin role
      await adminFirestore.collection('roles_admin').doc(userRecord.uid).set({});

      return { success: true, isFirstAdmin: true };

    } else {
      // --- NORMAL LOGIN: Users exist, attempt to sign in ---
      // This is a placeholder. Real client-side sign-in is needed.
      return { success: true, isFirstAdmin: false };
    }
  } catch (error: any) {
    console.error("Admin login/setup error:", error);
    if (error.code === 'auth/email-already-exists') {
        return { success: false, error: "A user with this email already exists." };
    }
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
