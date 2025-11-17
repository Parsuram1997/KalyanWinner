
import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  serviceAccountId: "firebase-adminsdk-g2y8r@studio-7786701397-58781.iam.gserviceaccount.com"
});

exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
  const firestore = getFirestore();
  const userRef = firestore.collection("users").doc(user.uid);

  try {
    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        transaction.delete(userRef);
      }
    });
    console.log(`Successfully cleaned up data for user ${user.uid}`);
  } catch (error) {
    console.error(`Error cleaning up data for user ${user.uid}:`, error);
  }
});
