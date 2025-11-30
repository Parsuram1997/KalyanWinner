import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { auth } from "firebase-functions/v2";

admin.initializeApp();
const db = getFirestore();

// V2 onDelete function to clean up user data from Firestore when a user is deleted from Auth
export const cleanupuser = auth.onUserDeleted(async (event: auth.AuthEvent) => {
    const user = event.data;
    const userRef = db.collection("users").doc(user.uid);
    try {
        await userRef.delete();
        functions.logger.log(`Successfully deleted user data for UID: ${user.uid}`);
    } catch (err) {
        functions.logger.error(`Error deleting user data for UID: ${user.uid}`, err);
    }
});
