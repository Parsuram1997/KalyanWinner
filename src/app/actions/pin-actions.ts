
'use server';

import { firestore, auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';

const PIN_SALT_ROUNDS = 10;

// Action to set or update a user's PIN
export async function setLoginPin(userId: string, pin: string) {
    if (!userId || !pin || !/^\d{4}$/.test(pin)) {
        throw new Error('A 4-digit PIN is required.');
    }

    try {
        const pinHash = await bcrypt.hash(pin, PIN_SALT_ROUNDS);
        const userRef = firestore.collection('users').doc(userId);
        await userRef.update({ pin: pinHash });
        return { success: true, message: 'PIN has been set successfully.' };
    } catch (error: any) {
        console.error('Error setting PIN:', error);
        throw new Error('Failed to set PIN.');
    }
}

// Action to verify PIN and create a login session
export async function verifyPinAndLogin(userId: string, pin: string) {
    if (!userId || !pin) {
        throw new Error('User ID and PIN are required.');
    }

    try {
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new Error('User not found.');
        }

        const userData = userDoc.data();
        const pinHash = userData?.pin;

        if (!pinHash) {
            throw new Error('No PIN is set for this user. Please log in with your password to set one.');
        }

        const isPinValid = await bcrypt.compare(pin, pinHash);

        if (!isPinValid) {
            return { success: false, message: 'Invalid PIN.' };
        }

        // If PIN is valid, create a custom token to sign in the user
        const customToken = await auth.createCustomToken(userId);
        
        return { success: true, token: customToken, message: 'PIN verified.' };

    } catch (error: any) {
        console.error('Error verifying PIN:', error);
        throw new Error(error.message || 'Failed to verify PIN.');
    }
}
