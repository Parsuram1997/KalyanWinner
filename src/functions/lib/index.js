"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processReferralBonus = exports.cleanupuser = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const tasks_1 = require("firebase-functions/v2/tasks");
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions/v1");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// V1 onDelete function to clean up user data from Firestore when a user is deleted from Auth
exports.cleanupuser = functions.auth.user().onDelete(async (user) => {
    const userRef = db.collection("users").doc(user.uid);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists) {
                transaction.delete(userRef);
            }
        });
        logger.log(`Successfully cleaned up data for user ${user.uid}`);
    }
    catch (error) {
        logger.error(`Error cleaning up data for user ${user.uid}:`, error);
    }
});
exports.processReferralBonus = (0, tasks_1.onTaskDispatched)(async (request) => {
    const { userId, transactionId } = request.data;
    if (!userId) {
        logger.log("Function called without a userId. Exiting.");
        return;
    }
    try {
        // Fetch payment settings first to get bonus rules.
        const settingsRef = db.collection('payment_settings').doc('main');
        const settingsDoc = await settingsRef.get();
        // Use settings from DB or fall back to defaults if not found.
        const settingsData = settingsDoc.data();
        const BONUS_AMOUNT = (settingsData === null || settingsData === void 0 ? void 0 : settingsData.referralBonusAmount) || 5;
        const MIN_DEPOSIT_FOR_BONUS = (settingsData === null || settingsData === void 0 ? void 0 : settingsData.minDepositForBonus) || 500;
        if (!settingsDoc.exists) {
            logger.warn("Payment settings not found. Using default bonus rules.");
        }
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            logger.log(`User ${userId} not found. Cannot process referral bonus.`);
            return;
        }
        const userData = userDoc.data();
        const { enrollerId, commissionPaid, totalDeposits } = userData;
        if (!enrollerId || commissionPaid) {
            logger.log(`User ${userId}: No enroller or referral bonus already paid. Exiting.`);
            return;
        }
        logger.log(`User ${userId}: Checking referral bonus criteria. Total Deposits: ${totalDeposits}, Min Required: ${MIN_DEPOSIT_FOR_BONUS}`);
        if (typeof totalDeposits === 'number' && totalDeposits >= MIN_DEPOSIT_FOR_BONUS) {
            logger.log(`User ${userId} has met the threshold! Paying referral bonus of ${BONUS_AMOUNT} to enroller ${enrollerId}.`);
            const enrollerQuery = db.collection('users').where('customId', '==', enrollerId);
            return db.runTransaction(async (t) => {
                var _a;
                const enrollerSnapshot = await t.get(enrollerQuery);
                if (enrollerSnapshot.empty) {
                    throw new Error(`Enroller with customId ${enrollerId} not found.`);
                }
                const enrollerDoc = enrollerSnapshot.docs[0];
                const enrollerRef = enrollerDoc.ref;
                // Credit the enroller's WINNING BALANCE
                t.update(enrollerRef, { winningBalance: firestore_1.FieldValue.increment(BONUS_AMOUNT) });
                // Mark commission as paid for the user
                t.update(userRef, { commissionPaid: true });
                const bonusTransactionRef = db.collection('transactions').doc();
                t.set(bonusTransactionRef, {
                    userId: enrollerDoc.id,
                    userName: ((_a = enrollerDoc.data()) === null || _a === void 0 ? void 0 : _a.name) || 'Enroller',
                    customId: enrollerId,
                    type: "Referral Bonus",
                    amount: BONUS_AMOUNT,
                    status: "Completed",
                    date: new Date().toISOString(),
                    description: `Referral bonus for user ${userData.name} (${userData.customId || userId}) reaching deposit goal.`,
                    relatedUserId: userId,
                    originalTransactionId: transactionId,
                });
            }).then(() => {
                logger.log(`Successfully paid referral bonus to enroller ${enrollerId} for user ${userId}.`);
            }).catch((err) => {
                logger.error(`Referral bonus transaction failed for user ${userId}:`, err);
                throw err;
            });
        }
        else {
            logger.log(`User ${userId}: Deposit amount has not yet reached the threshold.`);
            return;
        }
    }
    catch (error) {
        logger.error(`Error in processReferralBonus for user ${userId}:`, error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map