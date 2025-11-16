
'use server';

import { firestore } from "@/lib/firebase-admin";


export async function getEmailForMobile(mobileNumber: string): Promise<{ success: boolean, email?: string, message: string }> {
    if (!mobileNumber || mobileNumber.length !== 10) {
        return { success: false, message: "Invalid mobile number provided." };
    }

    try {
        const usersRef = firestore.collection('users');
        const snapshot = await usersRef.where('mobile', '==', mobileNumber).limit(1).get();

        if (snapshot.empty) {
            return { success: false, message: "No user found with this mobile number." };
        }

        const userData = snapshot.docs[0].data();
        if (!userData.email) {
            return { success: false, message: "No email associated with this mobile number." };
        }
        
        return { success: true, email: userData.email, message: "Email retrieved successfully." };

    } catch (error: any) {
        console.error("Error fetching email for mobile:", error);
        return { success: false, message: "An server error occurred while trying to find the user." };
    }
}
