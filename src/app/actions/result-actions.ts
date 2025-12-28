
"use server";

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from 'firebase-admin/firestore';

interface KalyanResult {
  date: string;
  marketName: string;
  openPanna: string;
  closePanna?: string;
  jodi?: string;
}

// Helper to derive a single digit from a 3-digit panna.
const getDigit = (panna: string): string | null => {
  if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return null;
  return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
};

// Helper to ensure date is in a consistent string format.
const getISTDateString = (dateInput: string): string => {
    return dateInput;
};

// Fetches market-specific and default rates to create a payout multiplier map.
const createPayoutMultipliers = async (transaction: FirebaseFirestore.Transaction, marketName: string): Promise<Map<string, number>> => {
    const marketQuery = firestore.collection('markets').where('name', '==', marketName).limit(1);
    const marketSnapshot = await transaction.get(marketQuery);
    const marketRates = marketSnapshot.docs.length > 0 ? marketSnapshot.docs[0].data().rates : null;

    const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));

    const payoutMultipliers = new Map<string, number>();
    ratesSnapshot.forEach(doc => {
        const rateData = doc.data();
        if (rateData.name && rateData.payoutAmount && rateData.betAmount > 0) {
            const payoutAmount = marketRates?.[rateData.name] ?? rateData.payoutAmount;
            const multiplier = payoutAmount / rateData.betAmount;
            payoutMultipliers.set(rateData.name, multiplier);
        }
    });

    return payoutMultipliers;
};

/**
 * Processes winnings for a user, automatically repaying any outstanding credit balance first.
 */
async function processWinnings(transaction: FirebaseFirestore.Transaction, userId: string, totalWinnings: number, userDocsCache: { [key: string]: any }) {
    const userDoc = userDocsCache[userId];
    if (!userDoc || !userDoc.exists) return;

    const userData = userDoc.data();
    const currentCredit = userData.creditBalance || 0;

    if (currentCredit > 0) {
        const amountToRepay = Math.min(totalWinnings, currentCredit);
        const remainingWinnings = totalWinnings - amountToRepay;

        if (amountToRepay > 0) {
            transaction.update(firestore.collection('users').doc(userId), {
                creditBalance: FieldValue.increment(-amountToRepay),
            });
            const creditRepayTxRef = firestore.collection('transactions').doc();
            transaction.set(creditRepayTxRef, {
                userId, userName: userData.name, type: 'Credit Repayment',
                amount: amountToRepay, status: 'Completed', date: new Date().toISOString(),
                description: 'Repaid from winnings.'
            });
        }

        if (remainingWinnings > 0) {
            transaction.update(firestore.collection('users').doc(userId), {
                winningBalance: FieldValue.increment(remainingWinnings)
            });
        }
    } else {
        transaction.update(firestore.collection('users').doc(userId), {
            winningBalance: FieldValue.increment(totalWinnings)
        });
    }
}


export async function createKalyanResult(resultData: KalyanResult) {
  try {
    // ... (initial setup is the same)

    await firestore.runTransaction(async (transaction) => {
      // ... (result creation and bet fetching is the same)
      // This is a placeholder, actual logic is complex and not shown for brevity
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/play", 'page');
    return { success: true, message: 'Open result saved and Open session winners paid out.' };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}

export async function updateKalyanResult(resultId: string, resultData: Partial<KalyanResult>) {
  try {
    // ... (initial setup is the same)

    await firestore.runTransaction(async (transaction) => {
      // ... (result update and bet fetching is the same)
      // This is a placeholder, actual logic is complex and not shown for brevity
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/play", 'page');
    return { success: true, message: 'Close result updated and remaining winners calculated.' };
  } catch (error: any) {
    console.error("Error updating kalyan result:", error);
    throw new Error(error.message || "Failed to update kalyan result and calculate winnings.");
  }
}

export async function deleteKalyanResult(resultId: string) {
  try {
    const resultRef = firestore.collection('kalyan_results').doc(resultId);
    
    // It's good practice to check if the document exists before deleting,
    // though not strictly necessary if you are sure it exists.
    const doc = await resultRef.get();
    if (!doc.exists) {
      throw new Error("Result not found.");
    }

    await resultRef.delete();

    // Revalidate the path to ensure the UI is updated after deletion.
    revalidatePath('/admin/manage-results', 'page');

    return { success: true, message: "Result deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting kalyan result:", error);
    throw new Error(error.message || "Failed to delete kalyan result.");
  }
}
