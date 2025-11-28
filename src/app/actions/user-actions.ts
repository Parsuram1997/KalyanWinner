
'use server';

import { auth, firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";


export async function createUser(userData: {
  name: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  password: any;
  role?: 'User' | 'Enroller' | 'Admin';
  enrollerId?: string; // This is now expected to be the enroller's custom ID
  createdBy?: 'Admin' | 'Enroller' | 'Self';
}) {
  
  const mobileQuery = await firestore.collection("users").where("mobile", "==", userData.mobile).get();
  if (!mobileQuery.empty) {
      throw new Error("A user with this mobile number already exists.");
  }

  const authEmail = userData.email;
  
  const userRecord = await auth.createUser({
    email: authEmail,
    password: userData.password,
    displayName: userData.name,
    phoneNumber: `+91${userData.mobile}`
  });

  try {
    await firestore.runTransaction(async (transaction) => {
      // --- ALL READS FIRST ---
      const counterRef = firestore.collection('counters').doc('user_ids');
      const counterDoc = await transaction.get(counterRef);
      
      let enrollerDoc: FirebaseFirestore.DocumentSnapshot | null = null;
      let enrollerCustomId: string | null = userData.enrollerId || null; // Use the passed enrollerId directly
      
      if (enrollerCustomId) {
          // Find the enroller by their customId
          const enrollerQuery = firestore.collection('users').where('customId', '==', enrollerCustomId);
          const enrollerSnapshot = await transaction.get(enrollerQuery);
          if (!enrollerSnapshot.empty) {
              enrollerDoc = enrollerSnapshot.docs[0];
          }
      }

      // --- ALL WRITES AFTER READS ---
      const role = userData.role || 'User';

      let nextNumber;
      let fieldToUpdate;
      let prefix;

      const counterData = counterDoc.exists ? counterDoc.data() : {};

      if (role === 'Enroller') {
          nextNumber = (counterData?.lastEnrollerNumber || 0) + 1;
          fieldToUpdate = 'lastEnrollerNumber';
          prefix = 'KWENR';
      } else if (role === 'Admin') {
          nextNumber = (counterData?.lastAdminNumber || 0) + 1;
          fieldToUpdate = 'lastAdminNumber';
          prefix = 'KWADM';
      } else { // 'User'
          nextNumber = (counterData?.lastUserNumber || 0) + 1;
          fieldToUpdate = 'lastUserNumber';
          prefix = 'KWUSR';
      }

      if (counterDoc.exists) {
          transaction.update(counterRef, { [fieldToUpdate]: FieldValue.increment(1) });
      } else {
          const initialCounters = { lastUserNumber: 0, lastEnrollerNumber: 0, lastAdminNumber: 0 };
          initialCounters[fieldToUpdate as keyof typeof initialCounters] = 1;
          transaction.set(counterRef, initialCounters);
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
        depositBalance: 0,
        winningBalance: 0,
        commissionBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        status: "Active",
        role: role, 
        createdAt: new Date().toISOString(),
        commissionPaid: false, 
        enrollerId: enrollerCustomId, 
        createdBy: enrollerDoc ? 'Enroller' : (userData.createdBy || 'Self'),
      };

      transaction.set(firestore.collection("users").doc(userRecord.uid), userProfile);
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin/enrollers');
    revalidatePath('/enroller/users'); // Revalidate enroller's user list
    return { success: true, userId: userRecord.uid };

  } catch (error: any) {
    await auth.deleteUser(userRecord.uid);
    console.error("Error creating user profile in transaction:", error);
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
    
    if (userData.email) {
      updateData.email = userData.email;
      await auth.updateUser(userId, { email: userData.email, displayName: userData.name });
    } else if (userData.name) {
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

export async function updateUserPaymentDetails(paymentDetails: {
  userId: string;
  paymentMethod: 'bank' | 'upi';
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}) {
  try {
    const { userId, paymentMethod, ...details } = paymentDetails;
    const userRef = firestore.collection("users").doc(userId);
    let updateData: any;

    if (paymentMethod === 'bank') {
      updateData = {
        paymentMethod: 'bank',
        bankName: details.bankName,
        accountHolderName: details.accountHolderName,
        accountNumber: details.accountNumber,
        ifscCode: details.ifscCode,
        upiId: FieldValue.delete()
      };
    } else if (paymentMethod === 'upi') {
      updateData = {
        paymentMethod: 'upi',
        upiId: details.upiId,
        bankName: FieldValue.delete(),
        accountHolderName: FieldValue.delete(),
        accountNumber: FieldValue.delete(),
        ifscCode: FieldValue.delete()
      };
    } else {
        throw new Error("Invalid payment method specified.");
    }

    await userRef.update(updateData);
    revalidatePath('/wallet/account');
    revalidatePath('/wallet/withdraw');

    return { success: true };
  } catch (error: any) {
    console.error("Error updating payment details:", error);
    throw new Error(error.message || "Failed to update payment details.");
  }
}


export async function deleteUser(userId: string) {
    try {
        const deletePromise = auth.deleteUser(userId);
        const firestorePromise = firestore.collection("users").doc(userId).delete();

        await Promise.all([deletePromise, firestorePromise]);

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        if (error.code === 'auth/user-not-found') {
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

export async function saveFcmToken(userId: string, token: string) {
  try {
    if (!userId || !token) {
      throw new Error("User ID and token are required.");
    }

    const userRef = firestore.collection("users").doc(userId);
    // Using FieldValue.arrayUnion ensures that we don't add duplicate tokens.
    await userRef.update({
      fcmTokens: FieldValue.arrayUnion(token),
    });

    return { success: true, message: "FCM token saved." };
  } catch (error: any) {
    console.error("Error saving FCM token:", error);
    throw new Error(error.message || "Failed to save FCM token.");
  }
}
