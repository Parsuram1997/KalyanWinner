
'use server';

import { getApp, initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { firebaseConfig } from "@/firebase/config";

// Initialize Firebase Admin SDK
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  // Pass the projectId to initializeApp
  return initializeApp({
    projectId: firebaseConfig.projectId
  });
}

export async function resetPassword(mobileNumber: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
        const adminApp = getFirebaseAdminApp();
        const adminAuth = getAuth(adminApp);

        const email = `+91${mobileNumber}@kalyanwinner.app`;

        const user = await adminAuth.getUserByEmail(email);
        
        await adminAuth.updateUser(user.uid, {
            password: newPassword,
        });

        return { success: true, message: "Password updated successfully." };

    } catch (error: any) {
        console.error("Error resetting password:", error);
        let message = "Failed to reset password.";
        if (error.code === 'auth/user-not-found') {
            message = "No user found with this mobile number.";
        }
        return { success: false, message };
    }
}
