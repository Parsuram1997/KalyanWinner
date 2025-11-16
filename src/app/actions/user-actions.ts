
'use server';

import { getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

// Initialize Firebase Admin SDK
function getFirebaseAdminApp() {
  if (getApp.length > 0) {
    return getApp();
  }
  return initializeApp({
    credential: undefined, // Let Firebase find credentials from environment
    projectId: firebaseConfig.projectId
  });
}

export async function createUser(userData: {
  name: string;
  mobile: string;
  state: string;
  district: string;
  password: any;
}) {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    // Create user in Firebase Authentication
    // We'll use a placeholder email, as mobile number is the primary identifier
    const email = `${userData.mobile}@kalyanwinner.app`;
    
    const userRecord = await adminAuth.createUser({
      email,
      password: userData.password,
      displayName: userData.name,
      // Firebase Admin SDK does not support phone number directly on creation
      // We will store it in Firestore
    });

    // Create user profile in Firestore
    const userProfile = {
      id: userRecord.uid,
      name: userData.name,
      mobile: userData.mobile,
      email: email, // Store the generated email
      state: userData.state,
      district: userData.district,
      balance: 0,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    await adminFirestore.collection("users").doc(userRecord.uid).set(userProfile);

    return { success: true, userId: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Provide a more specific error message
    let errorMessage = "An unexpected error occurred.";
    if (error.code === 'auth/email-already-exists') {
        errorMessage = "A user with this mobile number already exists.";
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = "Password must be at least 6 characters long.";
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
