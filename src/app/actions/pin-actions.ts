

'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function setPinForUser(uid: string, pin: string): Promise<{ success: true } | { success: false, error: string }> {
    if (!uid) {
        return { success: false, error: 'User ID is required to set a PIN.' };
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'Invalid PIN. It must be 4 digits.' };
    }

    try {
        const userDocRef = firestore.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return { success: false, error: 'User account not found. Please log in again.' };
        }
        
        const hashedPin = bcrypt.hashSync(pin, SALT_ROUNDS);

        await userDocRef.update({
            pin: hashedPin,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true };

    } catch (error: any) {
        console.error(`Error setting PIN for user ${uid}:`, error);
        return { 
            success: false, 
            error: error.message || 'An unexpected server error occurred while setting the PIN.' 
        };
    }
}

export async function verifyPinForUser(uid: string, pin: string): Promise<{ success: true, token: string } | { success: false, error: string }> {
    if (!uid || !pin) {
        return { success: false, error: 'User ID and PIN are required.' };
    }
    if (!/^\d{4}$/.test(pin)) {
        return { success: false, error: 'A 4-digit PIN is required.' };
    }

    try {
        const userDocRef = firestore.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return { success: false, error: 'User account not found. Please log in again.' };
        }

        const userData = userDoc.data()!;
        
        if (!userData.pin) {
            return { success: false, error: 'No PIN is set for this account. Please log in with your password to set one.' };
        }
        
        const isPinValid = bcrypt.compareSync(pin, userData.pin);

        if (!isPinValid) {
            return { success: false, error: 'Invalid PIN.' };
        }

        const customToken = await auth.createCustomToken(userDoc.id);

        return { success: true, token: customToken };

    } catch (error: any) {
        console.error(`Error during PIN verification for user ${uid}:`, error);
        return { 
            success: false, 
            error: error.message || 'An unexpected server error occurred during PIN verification.' 
        };
    }
}


export async function clearUserPin(uid: string): Promise<{ success: true } | { success: false, error: string }> {
    if (!uid) {
        return { success: false, error: 'User ID is required to clear a PIN.' };
    }

    try {
        const userDocRef = firestore.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            await userDocRef.update({
                pin: FieldValue.delete(),
                updatedAt: FieldValue.serverTimestamp(),
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error(`Error clearing PIN for user ${uid}:`, error);
        return {
            success: false,
            error: error.message || 'An unexpected server error occurred while clearing the PIN.',
        };
    }
}
