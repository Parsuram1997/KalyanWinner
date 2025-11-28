import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Transaction } from "firebase-admin/firestore";
import { onTaskDispatched, Request } from "firebase-functions/v2/tasks";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";

initializeApp();
const db = getFirestore();

interface User {
  enrollerId?: string;
  commissionPaid?: boolean;
  totalDeposits?: number;
  name?: string;
  customId?: string;
}

// V1 onDelete function to clean up user data from Firestore when a user is deleted from Auth
export const cleanupuser = functions.auth.user().onDelete(async (user: functions.auth.UserRecord) => {
  const userRef = db.collection("users").doc(user.uid);

  try {
    await db.runTransaction(async (transaction: Transaction) => {
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        transaction.delete(userRef);
      }
    });
    logger.log(`Successfully cleaned up data for user ${user.uid}`);
  } catch (error) {
    logger.error(`Error cleaning up data for user ${user.uid}:`, error);
  }
});

export const processReferralBonus = onTaskDispatched(async (request: Request<{ userId: string, transactionId: string }>) => {
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

    const userData = userDoc.data() as User;
    const { enrollerId, commissionPaid, totalDeposits } = userData;

    if (!enrollerId || commissionPaid) {
      logger.log(`User ${userId}: No enroller or referral bonus already paid. Exiting.`);
      return;
    }

    logger.log(`User ${userId}: Checking referral bonus criteria. Total Deposits: ${totalDeposits}, Min Required: ${MIN_DEPOSIT_FOR_BONUS}`);

    if (typeof totalDeposits === 'number' && totalDeposits >= MIN_DEPOSIT_FOR_BONUS) {
      logger.log(`User ${userId} has met the threshold! Paying referral bonus of ${BONUS_AMOUNT} to enroller ${enrollerId}.`);
      const enrollerQuery = db.collection('users').where('customId', '==', enrollerId);

      return db.runTransaction(async (t: Transaction) => {
        const enrollerSnapshot = await t.get(enrollerQuery);
        if (enrollerSnapshot.empty) {
          throw new Error(`Enroller with customId ${enrollerId} not found.`);
        }

        const enrollerDoc = enrollerSnapshot.docs[0];
        const enrollerRef = enrollerDoc.ref;

        // Credit the enroller's WINNING BALANCE
        t.update(enrollerRef, { winningBalance: FieldValue.increment(BONUS_AMOUNT) });

        // Mark commission as paid for the user
        t.update(userRef, { commissionPaid: true });

        const bonusTransactionRef = db.collection('transactions').doc();
        t.set(bonusTransactionRef, {
          userId: enrollerDoc.id,
          userName: (enrollerDoc.data() as User)?.name || 'Enroller',
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
      }).catch((err: any) => {
        logger.error(`Referral bonus transaction failed for user ${userId}:`, err);
        throw err;
      });
    } else {
      logger.log(`User ${userId}: Deposit amount has not yet reached the threshold.`);
      return;
    }
  } catch (error) {
    logger.error(`Error in processReferralBonus for user ${userId}:`, error);
    throw error;
  }
});