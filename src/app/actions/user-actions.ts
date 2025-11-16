
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

export async function createUser(userData: {
  name: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  password: any;
  role: 'User' | 'Enroller';
}) {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);
    
    // Check if a user with the same mobile number already exists in Firestore
    const mobileQuery = await adminFirestore.collection("users").where("mobile", "==", userData.mobile).get();
    if (!mobileQuery.empty) {
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

export async function updateUser(userId: string, userData: {
  name?: string;
  email?: string;
}) {
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);
    
    const updateData: any = {};
    if (userData.name) updateData.name = userData.name;
    
    // If email is being updated, update it in both Firestore and Auth
    if (userData.email) {
      updateData.email = userData.email;
      await adminAuth.updateUser(userId, { email: userData.email, displayName: userData.name });
    } else if (userData.name) {
      // If only name is updated, update it in Auth as well
      await adminAuth.updateUser(userId, { displayName: userData.name });
    }

    if (Object.keys(updateData).length > 0) {
      await adminFirestore.collection("users").doc(userId).update(updateData);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating user:", error);
    let errorMessage = "An unexpected error occurred while updating the user.";
     if (error.code === 'auth/email-already-exists') {
        errorMessage = "A user with this email address already exists.";
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
