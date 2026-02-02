
'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to get the role prefix
const getRolePrefix = (role: string) => {
    switch (role) {
        case 'User': return 'USR';
        case 'Enroller': return 'ENR';
        case 'Admin': return 'ADM';
        default: return 'USR';
    }
};

// IMPORTANT: This function is now transactional to prevent ghost users.
// It ensures that both the Firebase Auth user and the Firestore user document are created successfully.
export async function createUser(userData: any) {
  const { email, password, name, mobile, role, createdBy, state, district } = userData;

  // 1. Basic input validation
  if (!email || !password || !name || !mobile) {
    throw new Error('Missing required fields: email, password, name, and mobile are required.');
  }

  if (!firestore || !auth) {
    throw new Error("Firebase services are not initialized.");
  }
  let firebaseUser: any = null;

  try {
    // 2. Create the user in Firebase Authentication
    firebaseUser = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      phoneNumber: `+91${mobile}` // Ensure country code is included
    });

    const userDocRef = firestore.collection('users').doc(firebaseUser.uid);
    const counterRef = firestore.collection('counters').doc('user_counter');

    // Use a transaction to ensure atomic counter increment and user creation.
    const customId = await firestore.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let newCount = 1;
        if (counterDoc.exists) {
            newCount = (counterDoc.data()?.count || 0) + 1;
        }
        
        // Format the new custom ID
        const rolePrefix = getRolePrefix(role);
        const formattedId = `KW${rolePrefix}${String(newCount).padStart(4, '0')}`;

        const newUser = {
          id: firebaseUser.uid,
          customId: formattedId,
          name,
          mobile,
          email,
          role,
          status: 'Active',
          depositBalance: 0,
          winningBalance: 0,
          commissionBalance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          createdBy,
          state,
          district,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Set the user document
        transaction.set(userDocRef, newUser);
        
        // Update the counter
        if (counterDoc.exists) {
            transaction.update(counterRef, { count: newCount });
        } else {
            transaction.set(counterRef, { count: newCount });
        }

        return formattedId;
    });


    return { success: true, uid: firebaseUser.uid, customId: customId };

  } catch (error: any) {
    // 4. If any step fails, attempt to clean up to prevent ghost users.
    // If the Firebase Auth user was created but the Firestore doc failed, delete the Auth user.
    if (firebaseUser && firebaseUser.uid) {
      try {
        if (!auth) {
            throw new Error("Auth is not initialized.");
        }
        await auth.deleteUser(firebaseUser.uid);
        console.log(`Cleaned up orphaned Firebase Auth user: ${firebaseUser.uid}`);
      } catch (cleanupError) {
        console.error(`CRITICAL: Failed to clean up orphaned Firebase Auth user ${firebaseUser.uid}. Please manually delete.`, cleanupError);
        // Even if cleanup fails, we must throw the original error to the user.
      }
    }

    // Re-throw the original error to be caught by the calling function.
    throw new Error(error.message || 'An unexpected error occurred during signup.');
  }
}


export async function updateUser(userId: string, userData: any) {
    try {
        if (!firestore) {
          throw new Error("Firestore is not initialized.");
        }
        const userDocRef = firestore.collection('users').doc(userId);
        await userDocRef.update({
            ...userData,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId}:`, error);
        throw new Error(error.message || "Failed to update user.");
    }
}

export async function deleteUser(userId: string) {
    try {
        if (!auth) {
            throw new Error("Auth is not initialized.");
        }
        // This will trigger the onDelete cloud function to clean up firestore data
        await auth.deleteUser(userId);
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting user ${userId}:`, error);
        throw new Error(error.message || "Failed to delete user.");
    }
}

export async function updateUserStatus(userId: string, status: 'Active' | 'Inactive') {
    try {
        if (!firestore) {
          throw new Error("Firestore is not initialized.");
        }
        const userDocRef = firestore.collection('users').doc(userId);
        await userDocRef.update({
            status: status,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating status for user ${userId}:`, error);
        throw new Error(error.message || "Failed to update user status.");
    }
}


export async function updateUserPaymentDetails(data: {
  userId: string;
  paymentMethod: 'bank' | 'upi';
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}) {
  const { userId, paymentMethod, ...details } = data;
  if (!userId) {
    throw new Error('User ID is required.');
  }

  try {
    if (!firestore) {
      throw new Error("Firestore is not initialized.");
    }
    const userDocRef = firestore.collection('users').doc(userId);
    const updateData: { [key: string]: any } = {
        paymentMethod,
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Clear old data and set new data
    if (paymentMethod === 'bank') {
        updateData.upiId = FieldValue.delete();
        updateData.bankName = details.bankName;
        updateData.accountHolderName = details.accountHolderName;
        updateData.accountNumber = details.accountNumber;
        updateData.ifscCode = details.ifscCode;
    } else if (paymentMethod === 'upi') {
        updateData.bankName = FieldValue.delete();
        updateData.accountHolderName = FieldValue.delete();
        updateData.accountNumber = FieldValue.delete();
        updateData.ifscCode = FieldValue.delete();
        updateData.upiId = details.upiId;
    }

    await userDocRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating payment details for user ${userId}:`, error);
    throw new Error(error.message || "Failed to update payment details.");
  }
}
