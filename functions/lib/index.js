"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
    const firestore = (0, firestore_1.getFirestore)();
    const userRef = firestore.collection("users").doc(user.uid);
    try {
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists) {
                transaction.delete(userRef);
            }
        });
        console.log(`Successfully cleaned up data for user ${user.uid}`);
    }
    catch (error) {
        console.error(`Error cleaning up data for user ${user.uid}:`, error);
    }
});
//# sourceMappingURL=index.js.map