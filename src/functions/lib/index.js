"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResultNotification = exports.processReferralBonus = exports.cleanupuser = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
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
        const BONUS_AMOUNT = settingsData?.referralBonusAmount || 5;
        const MIN_DEPOSIT_FOR_BONUS = settingsData?.minDepositForBonus || 500;
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
                const enrollerSnapshot = await t.get(enrollerQuery);
                if (enrollerSnapshot.empty) {
                    throw new Error(`Enroller with customId ${enrollerId} not found.`);
                }
                const enrollerDoc = enrollerSnapshot.docs[0];
                const enrollerRef = enrollerDoc.ref;
                // Credit the enroller'''s COMMISSION BALANCE
                t.update(enrollerRef, { commissionBalance: firestore_1.FieldValue.increment(BONUS_AMOUNT) });
                // Mark commission as paid for the user
                t.update(userRef, { commissionPaid: true });
                const bonusTransactionRef = db.collection('transactions').doc();
                t.set(bonusTransactionRef, {
                    userId: enrollerDoc.id,
                    userName: enrollerDoc.data()?.name || 'Enroller',
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
// Helper to calculate the single digit from a panna
const getDigit = (panna) => {
    if (!panna || panna.length !== 3 || !/^\d+$/.test(panna))
        return '*';
    return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
};
exports.sendResultNotification = functions.firestore
    .document('kalyan_results/{resultId}')
    .onWrite(async (change, context) => {
    const resultDataAfter = change.after.data();
    const resultDataBefore = change.before.data();
    // If the document is deleted, do nothing.
    if (!resultDataAfter) {
        logger.log(`Result ${context.params.resultId} was deleted. No notification sent.`);
        return null;
    }
    const { marketName, openPanna, jodi, closePanna } = resultDataAfter;
    let title = '';
    let body = '';
    let shouldSend = false;
    const isNewResult = !resultDataBefore; // Document was just created
    const isCloseResultJustAdded = closePanna && !resultDataBefore?.closePanna;
    const isHolidayJustMarked = jodi === 'L' && resultDataBefore?.jodi !== 'L';
    if (isHolidayJustMarked) {
        title = `${marketName} is on Holiday`;
        body = `No game results will be declared today for ${marketName}.`;
        shouldSend = true;
    }
    else if (isNewResult && openPanna && !closePanna) { // Brand new open result
        const openDigit = getDigit(openPanna);
        title = `${marketName} Open Result!`;
        body = `Open: ${openPanna}-${openDigit}`;
        shouldSend = true;
    }
    else if (isCloseResultJustAdded) { // Close result was just added to an existing document
        title = `${marketName} Final Result!`;
        body = `Final Result: ${openPanna}-${jodi}-${closePanna}`;
        shouldSend = true;
    }
    if (!shouldSend) {
        logger.log('No significant result change detected. No notification sent.');
        return null;
    }
    const usersSnapshot = await db.collection('users').get();
    const tokens = [];
    usersSnapshot.forEach(doc => {
        const user = doc.data();
        if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
            tokens.push(...user.fcmTokens);
        }
    });
    if (tokens.length === 0) {
        logger.log('No registered FCM tokens found. No notifications sent.');
        return null;
    }
    const uniqueTokens = [...new Set(tokens)];
    const payload = {
        notification: {
            title: title,
            body: body,
            icon: '/kalyanwinnerlogo.png',
        },
        webpush: {
            fcmOptions: {
                link: '/results'
            }
        }
    };
    logger.log(`Sending notification to ${uniqueTokens.length} tokens: ${title} - ${body}`);
    try {
        const response = await (0, messaging_1.getMessaging)().sendEachForMulticast({
            tokens: uniqueTokens,
            notification: payload.notification,
            webpush: payload.webpush,
        });
        logger.log(`Successfully sent ${response.successCount} messages.`);
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(uniqueTokens[idx]);
                    logger.warn(`Failed to send to token: ${uniqueTokens[idx]}`, resp.error);
                }
            });
        }
    }
    catch (error) {
        logger.error('Error sending notifications:', error);
    }
    return null;
});
//# sourceMappingURL=index.js.map