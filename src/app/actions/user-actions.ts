
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
  role?: 'User' | 'Enroller' | 'Admin';
  enrollerId?: string;
  createdBy?: 'Admin' | 'Enroller' | 'Self';
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
    await firestore.runTransaction(async (transaction) => {
      const counterRef = firestore.collection('counters').doc('user_ids');
      const role = userData.role || 'User';
      
      const counterDoc = await transaction.get(counterRef);
      
      let nextNumber;
      let fieldToUpdate;
      let prefix;

      if (!counterDoc.exists) {
        if (role === 'Enroller') {
            nextNumber = 1;
            fieldToUpdate = 'lastEnrollerNumber';
            prefix = 'KWENR';
            transaction.set(counterRef, { lastEnrollerNumber: 1, lastUserNumber: 0, lastAdminNumber: 0 });
        } else if (role === 'Admin') {
            nextNumber = 1;
            fieldToUpdate = 'lastAdminNumber';
            prefix = 'KWADM';
            transaction.set(counterRef, { lastEnrollerNumber: 0, lastUserNumber: 0, lastAdminNumber: 1 });
        } else { // 'User'
            nextNumber = 1;
            fieldToUpdate = 'lastUserNumber';
            prefix = 'KWUSR';
            transaction.set(counterRef, { lastEnrollerNumber: 0, lastUserNumber: 1, lastAdminNumber: 0 });
        }
      } else {
        const data = counterDoc.data() || {};
        if (role === 'Enroller') {
            nextNumber = (data.lastEnrollerNumber || 0) + 1;
            fieldToUpdate = 'lastEnrollerNumber';
            prefix = 'KWENR';
        } else if (role === 'Admin') {
            nextNumber = (data.lastAdminNumber || 0) + 1;
            fieldToUpdate = 'lastAdminNumber';
            prefix = 'KWADM';
        } else { // 'User'
            nextNumber = (data.lastUserNumber || 0) + 1;
            fieldToUpdate = 'lastUserNumber';
            prefix = 'KWUSR';
        }
        transaction.update(counterRef, { [fieldToUpdate]: FieldValue.increment(1) });
      }
      
      const customId = `${prefix}${String(nextNumber).padStart(4, '0')}`;

      const userProfile: any = {
        id: userRecord.uid,
        customId: customId,
        name: userData.name,
        mobile: userData.mobile,
        email: authEmail,
        state: userData.state,
        district: userData.district,
        balance: 0,
        status: "Active",
        role: role, 
        createdAt: new Date().toISOString(),
        createdBy: userData.createdBy || 'Self',
        commissionPaid: false, // Always initialize commission status
      };
      
      if (userData.enrollerId) {
          userProfile.enrollerId = userData.enrollerId;
          userProfile.createdBy = 'Enroller';
      }
      
      transaction.set(firestore.collection("users").doc(userRecord.uid), userProfile);
    });

    return { success: true, userId: userRecord.uid };

  } catch (error: any) {
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
  state?: string;
  district?: string;
}) {
  try {
    const updateData: any = {};
    if (userData.name) updateData.name = userData.name;
    if (userData.state) updateData.state = userData.state;
    if (userData.district) updateData.district = userData.district;
    
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
        // Start a batch write to delete from Auth and Firestore
        const deletePromise = auth.deleteUser(userId);
        const firestorePromise = firestore.collection("users").doc(userId).delete();

        await Promise.all([deletePromise, firestorePromise]);

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        // If the user does not exist in Auth, it might have been already deleted.
        // We can choose to ignore this specific error if needed.
        if (error.code === 'auth/user-not-found') {
            // Optionally, try to delete from Firestore anyway
            try {
                await firestore.collection("users").doc(userId).delete();
                return { success: true, message: "User already deleted from Auth, cleaned up Firestore." };
            } catch (firestoreError: any) {
                console.error("Error deleting user from Firestore after Auth-not-found error:", firestoreError);
                throw new Error(firestoreError.message || "Failed to delete user from Firestore.");
            }
        }
        throw new Error(error.message || "Failed to delete user.");
    }
}

