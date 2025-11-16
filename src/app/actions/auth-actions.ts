
'use server';

import { getApp, initializeApp, getApps, App, AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const options: AppOptions = {};
  if (process.env.GCLOUD_PROJECT) {
    options.projectId = process.env.GCLOUD_PROJECT;
  }
  
  // Initialize with explicit project ID if available, otherwise fall back to default.
  // This is a more robust way to handle credentials in different environments.
  return initializeApp(options);
}


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
