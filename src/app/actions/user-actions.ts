'use server';

import { revalidatePath } from 'next/cache';
import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { auth } from '@/lib/firebase-admin';

// Function to generate a unique custom ID
async function generateUniqueCustomId() {
    let customId;
    let isUnique = false;
    while (!isUnique) {
        // Generate a random 6-digit number
        customId = Math.floor(100000 + Math.random() * 900000).toString();
        const userQuery = await firestore.collection('users').where('customId', '==', customId).get();
        if (userQuery.empty) {
            isUnique = true;
        }
    }
    return customId;
}


export async function createUser(userData: {
    name: string;
    mobile: string;
    email: string;
    state: string;
    district: string;
    password?: string;
    role: 'User';
    createdBy: 'Admin';
}) {
    if (!userData.email || !userData.password) {
        throw new Error('Email and password are required to create a user.');
    }

    try {
        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            disabled: false,
        });

        // Generate a unique custom ID
        const customId = await generateUniqueCustomId();

        // Prepare user data for Firestore
        const userDocData = {
            ...userData,
            uid: userRecord.uid,
            customId: customId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            status: 'Active',
            depositBalance: 0,
            winningBalance: 0,
            creditBalance: 0,
        };
        
        // Remove password from the data to be stored in Firestore
        delete userDocData.password;

        // Add user to Firestore
        await firestore.collection('users').doc(userRecord.uid).set(userDocData);

        revalidatePath('/admin/users');

        return {
            success: true,
            message: 'User created successfully.',
            user: {
                id: userRecord.uid,
                ...userDocData,
            },
        };
    } catch (error: any) {
        console.error('Error creating user:', error);
        throw new Error(error.message || 'An unknown error occurred while creating the user.');
    }
}


export async function updateUser(userId: string, updatedData: {
    name?: string;
    email?: string;
    state?: string;
    district?: string;
}) {
    if (!userId) {
        throw new Error('User ID is required to update a user.');
    }

    const userRef = firestore.collection('users').doc(userId);

    try {
        await firestore.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found.');
            }

            const updatePayload: { [key: string]: any } = {
                ...updatedData,
                updatedAt: FieldValue.serverTimestamp(),
            };

            t.update(userRef, updatePayload);
        });

        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}`);

        return {
            success: true,
            message: 'User details updated successfully.',
        };
    } catch (error: any) {
        console.error('Error updating user:', error);
        throw new Error(error.message || 'An unknown error occurred while updating the user.');
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
    const { userId, paymentMethod, ...paymentData } = data;

    if (!userId) {
        throw new Error('User ID is required.');
    }

    const userRef = firestore.collection('users').doc(userId);

    try {
        await firestore.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found.');
            }

            const updatePayload: { [key: string]: any } = {
                ...paymentData,
                paymentMethod: paymentMethod,
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (paymentMethod === 'bank') {
                updatePayload.upiId = null;
            } else if (paymentMethod === 'upi') {
                updatePayload.bankName = null;
                updatePayload.accountHolderName = null;
                updatePayload.accountNumber = null;
                updatePayload.ifscCode = null;
            }

            t.update(userRef, updatePayload);
        });

        revalidatePath('/wallet/account');
        revalidatePath('/wallet/withdraw');

        return { success: true, message: 'Payment details updated successfully.' };
    } catch (error: any) {
        console.error('Error updating payment details:', error);
        throw new Error(error.message || 'An unknown error occurred while updating payment details.');
    }
}


export async function deleteUser(userId: string) {
    if (!userId) {
        throw new Error('User ID is required to delete a user.');
    }

    const userRef = firestore.collection('users').doc(userId);

    try {
        // First, delete the user from Firebase Authentication
        await auth.deleteUser(userId);

        // Then, delete the user's document from Firestore
        await firestore.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                // If the user doc doesn't exist, it might have been deleted already.
                // We can consider this a success for idempotency.
                return;
            }
            t.delete(userRef);
        });
        
        revalidatePath('/admin/users');

        return {
            success: true,
            message: 'User has been permanently deleted.',
        };
    } catch (error: any) {
        // If the user is not found in Auth, it might have been already deleted.
        // We can proceed to delete from Firestore.
        if (error.code === 'auth/user-not-found') {
            await userRef.delete();
            revalidatePath('/admin/users');
            return {
                success: true,
                message: 'User was not found in authentication, but deleted from database.',
            };
        }
        console.error('Failed to delete user:', error);
        throw new Error(error.message || 'An unknown error occurred during user deletion.');
    }
}


export async function updateUserStatus(userId: string, newStatus: 'Active' | 'Inactive') {
  if (!userId || !newStatus) {
    throw new Error('User ID and new status are required.');
  }

  const userRef = firestore.collection('users').doc(userId);

  try {
    await userRef.update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);

    return {
      success: true,
      message: `User status has been updated to ${newStatus}.`,
    };
  } catch (error: any) {
    console.error('Failed to update user status:', error);
    throw new Error(error.message || 'An unknown error occurred while updating user status.');
  }
}
