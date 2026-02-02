
'use server';

import { auth, firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
            return { success: false, error: 'User account not found in the database.' };
        }

        await userDocRef.update({
            pin: pin, // In a real-world scenario, this should be a securely hashed PIN
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

export async function verifyPinAndGetCustomToken(mobile: string, pin: string): Promise<{ success: true, token: string } | { success: false, error: string }> {
    if (!mobile || !pin || pin.length !== 4 || !/^\d{10}$/.test(mobile)) {
        return { success: false, error: 'A valid 10-digit mobile number and 4-digit PIN are required.' };
    }

    try {
        const usersRef = firestore.collection('users');
        const q = usersRef.where('mobile', '==', mobile).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return { success: false, error: 'No account found with this mobile number.' };
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.pin !== pin) {
            return { success: false, error: 'Invalid PIN.' };
        }

        const customToken = await auth.createCustomToken(userDoc.id);

        return { success: true, token: customToken };

    } catch (error: any) {
        console.error(`Error during PIN verification for mobile ${mobile}:`, error);
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
