
'use server';

import { getApp, initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  // Initialize without arguments to use Application Default Credentials
  return initializeApp();
}

// This function is no longer needed as password reset will be handled via email.
// We can remove it to keep the code clean.
/*
export async function resetPassword(mobileNumber: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
        const adminApp = getFirebaseAdminApp();
        const adminAuth = getAuth(adminApp);

        // This logic is flawed because we need the user's real email, not a dummy one.
        // The client-side will now handle password resets directly via Firebase SDK.

        // const email = `+91${mobileNumber}@kalyanwinner.app`;
        // const user = await adminAuth.getUserByEmail(email);
        // await adminAuth.updateUser(user.uid, {
        //     password: newPassword,
        // });

        // return { success: true, message: "Password updated successfully." };

        return { success: false, message: "This function is deprecated." };


    } catch (error: any) {
        console.error("Error resetting password:", error);
        let message = "Failed to reset password.";
        if (error.code === 'auth/user-not-found') {
            message = "No user found with this mobile number.";
        }
        return { success: false, message };
    }
}
*/

export async function getEmailForMobile(mobileNumber: string): Promise<{ success: boolean, email?: string, message: string }> {
    if (!mobileNumber || mobileNumber.length !== 10) {
        return { success: false, message: "Invalid mobile number provided." };
    }

    try {
        const adminFirestore = getFirestore(getFirebaseAdminApp());
        const usersRef = adminFirestore.collection('users');
        const snapshot = await usersRef.where('mobile', '==', mobileNumber).limit(1).get();

        if (snapshot.empty) {
            return { success: false, message: "No user found with this mobile number." };
        }

        const userData = snapshot.docs[0].data();
        if (!userData.email) {
            return { success: false, message: "No email associated with this mobile number." };
        }
        
        return { success: true, email: userData.email, message: "Email retrieved successfully." };

    } catch (error: any) {
        console.error("Error fetching email for mobile:", error);
        return { success: false, message: "An server error occurred while trying to find the user." };
    }
}
