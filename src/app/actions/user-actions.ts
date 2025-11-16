
'use server';

import { auth, firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";


export async function createUser(userData: {
  name: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  password: any;
  role: 'User' | 'Enroller';
  enrollerId?: string;
}) {
  
  // Check if a user with the same mobile number already exists in Firestore
  const mobileQuery = await firestore.collection("users").where("mobile", "==", userData.mobile).get();
  if (!mobileQuery.empty) {
      throw new Error("A user with this mobile number already exists.");
  }

  // Use the REAL email provided by the user for Firebase Authentication
  const authEmail = userData.email;
  
  const userRecord = await auth.createUser({
    email: authEmail,
    password: userData.password,
    displayName: userData.name,
    phoneNumber: `+91${userData.mobile}`
  });

  try {
    const counterRef = firestore.collection('counters').doc('user_ids');
    
    // Run a transaction to get the next sequential ID
    const customId = await firestore.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber;
      let fieldToUpdate;
      let prefix;

      if (!counterDoc.exists) {
        // Initialize the counter document if it doesn't exist
        if (userData.role === 'Enroller') {
            nextNumber = 1;
            fieldToUpdate = 'lastEnrollerNumber';
            prefix = 'KWENR';
            transaction.set(counterRef, { lastEnrollerNumber: 1, lastUserNumber: 0 });
        } else {
            nextNumber = 1;
            fieldToUpdate = 'lastUserNumber';
            prefix = 'KWUSR';
            transaction.set(counterRef, { lastUserNumber: 1, lastEnrollerNumber: 0 });
        }
      } else {
        if (userData.role === 'Enroller') {
            nextNumber = (counterDoc.data()?.lastEnrollerNumber || 0) + 1;
            fieldToUpdate = 'lastEnrollerNumber';
            prefix = 'KWENR';
        } else {
            nextNumber = (counterDoc.data()?.lastUserNumber || 0) + 1;
            fieldToUpdate = 'lastUserNumber';
            prefix = 'KWUSR';
        }
        transaction.update(counterRef, { [fieldToUpdate]: FieldValue.increment(1) });
      }
      
      return `${prefix}${String(nextNumber).padStart(4, '0')}`;
    });

    // Create user profile in Firestore
    const userProfile: any = {
      id: userRecord.uid,
      customId: customId,
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
    
    if (userData.enrollerId) {
        userProfile.enrollerId = userData.enrollerId;
    }
    
    await firestore.collection("users").doc(userRecord.uid).set(userProfile);

    return { success: true, userId: userRecord.uid };

  } catch (error: any) {
    // If we failed to create the user in Firestore, delete the auth user to prevent orphaned accounts.
    await auth.deleteUser(userRecord.uid);
    console.error("Error creating user profile:", error);
    let errorMessage = "An unexpected error occurred during profile creation.";
    if (error.message) {
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
    const updateData: any = {};
    if (userData.name) updateData.name = userData.name;
    
    // If email is being updated, update it in both Firestore and Auth
    if (userData.email) {
      updateData.email = userData.email;
      await auth.updateUser(userId, { email: userData.email, displayName: userData.name });
    } else if (userData.name) {
      // If only name is updated, update it in Auth as well
      await auth.updateUser(userId, { displayName: userData.name });
    }

    if (Object.keys(updateData).length > 0) {
      await firestore.collection("users").doc(userId).update(updateData);
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
        // Delete user from Firebase Authentication
        await auth.deleteUser(userId);

        // Delete user profile from Firestore is now handled by a Cloud Function trigger
        // So we don't need to delete it from here explicitly.

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        throw new Error(error.message || "Failed to delete user.");
    }
}
