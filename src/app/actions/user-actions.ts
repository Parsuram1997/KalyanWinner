
'use server';

import { getApp, initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

// Initialize Firebase Admin SDK
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp({
    projectId: firebaseConfig.projectId
  });
}

export async function createUser(userData: {
  name: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  password: any;
  role: 'User' | 'Enroller';
  commissionRate?: number;
}) {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);
    
    // Check if a user with the same mobile number already exists in Firestore
    const mobileQuery = await adminFirestore.collection("users").where("mobile", "==", userData.mobile).get();
    if (!mobileQuery.empty && userData.role === 'User') { // Only check for users, not enrollers with same number if needed
        throw new Error("A user with this mobile number already exists.");
    }

    // Use the REAL email provided by the user for Firebase Authentication
    const authEmail = userData.email;

    // Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: authEmail,
      password: userData.password,
      displayName: userData.name,
      phoneNumber: `+91${userData.mobile}`
    });

    // Create user profile in Firestore
    const userProfile: any = {
      id: userRecord.uid,
      name: userData.name,
      mobile: userData.mobile,
      email: authEmail, // Store the real email
      state: userData.state,
      district: userData.district,
      balance: 0,
      status: "Active",
      role: userData.role, 
      createdAt: new Date().toISOString(),
    };
    
    if (userData.role === 'Enroller') {
        userProfile.commissionRate = userData.commissionRate || 5; // Default commission rate
        userProfile.totalEarnings = 0;
    }


    await adminFirestore.collection("users").doc(userRecord.uid).set(userProfile);

    return { success: true, userId: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error.code === 'auth/email-already-exists') {
        errorMessage = "A user with this email address already exists.";
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = "Password must be at least 6 characters long.";
    } else if (error.message) {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
}

export async function deleteUser(userId: string) {
    try {
        const adminApp = getFirebaseAdminApp();
        const adminAuth = getAuth(adminApp);
        const adminFirestore = getFirestore(adminApp);

        // Delete user from Firebase Authentication
        await adminAuth.deleteUser(userId);

        // Delete user profile from Firestore
        await adminFirestore.collection("users").doc(userId).delete();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        throw new Error(error.message || "Failed to delete user.");
    }
}
