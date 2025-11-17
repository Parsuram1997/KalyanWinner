
'use server';

import { firestore } from "@/lib/firebase-admin";

const settingsRef = firestore.collection("payment_settings").doc("main");

type PaymentSettings = {
    upiId?: string;
    bankAccountHolder?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    bankAccountType?: 'Current' | 'Savings';
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
    try {
        const doc = await settingsRef.get();
        if (!doc.exists) {
            return null;
        }
        return doc.data() as PaymentSettings;
    } catch (error: any) {
        console.error("Error getting payment settings:", error);
        throw new Error("Could not retrieve payment settings.");
    }
}

export async function updatePaymentSettings(settings: PaymentSettings) {
    try {
        await settingsRef.set(settings, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating payment settings:", error);
        throw new Error("Could not update payment settings.");
    }
}
