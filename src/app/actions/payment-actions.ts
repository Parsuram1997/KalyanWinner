
"use server";

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

const SETTINGS_PATH = "config/payment";

export async function getPaymentSettings() {
  try {
    const settingsDoc = await firestore.doc(SETTINGS_PATH).get();

    if (!settingsDoc.exists) {
      return { success: false, message: "Payment settings have not been configured in the admin panel." };
    }

    const settings = settingsDoc.data();

    if (!settings?.upiId || !settings?.payeeName) {
        return { success: false, message: "UPI ID or Payee Name is missing. Please complete the configuration." };
    }

    return {
      success: true,
      data: {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
      },
    };
  } catch (error: any) {
    console.error("Error fetching payment settings: ", error);
    return { success: false, message: "An unexpected error occurred while fetching settings." };
  }
}

export async function updatePaymentSettings(settings: { upiId: string; payeeName: string }) {
    try {
        const { upiId, payeeName } = settings;
        
        if (!upiId || !payeeName) {
            return { success: false, message: "Both UPI ID and Payee Name are required." };
        }

        await firestore.doc(SETTINGS_PATH).set({
            upiId,
            payeeName
        }, { merge: true });

        // Revalidate relevant paths after updating
        revalidatePath("/admin/manage-payments");
        revalidatePath("/wallet/deposit");

        return { success: true, message: "Payment settings updated successfully!" };

    } catch (error: any) {
        console.error("Error updating payment settings: ", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
}
