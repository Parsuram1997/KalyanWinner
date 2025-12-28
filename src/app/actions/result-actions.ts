
'use server';

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

const getDigit = (panna: string): string | null => {
  if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return null;
  return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
};

const getISTDateString = (dateInput: string): string => {
    return dateInput;
};

// Fetches market-specific and default rates and creates a payout multiplier map.
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

export async function createKalyanResult(resultData: KalyanResult) {
  try {
    const istDate = getISTDateString(resultData.date);
    const finalResultData = { ...resultData, date: istDate };

    finalResultData.marketName = finalResultData.marketName.trim();
    if (finalResultData.openPanna && finalResultData.openPanna.length !== 3 && finalResultData.openPanna !== 'H') {
        throw new Error("Open Panna must be exactly 3 digits.");
    }

    await firestore.runTransaction(async (transaction) => {
      const resultsRef = firestore.collection("kalyan_results");
      const existingResultQuery = resultsRef.where("marketName", "==", finalResultData.marketName).where("date", "==", finalResultData.date);
      const existingResultSnapshot = await transaction.get(existingResultQuery);
      if (!existingResultSnapshot.empty) {
          throw new Error(`A result for ${finalResultData.marketName} on ${finalResultData.date} already exists.`);
      }
      
      const payoutMultipliers = await createPayoutMultipliers(transaction, finalResultData.marketName);
      
      const marketBetsQuery = firestore.collection('kalyan_bets').where('market', '==', finalResultData.marketName).where('status', '==', 'Placed');
      const betsSnapshot = await transaction.get(marketBetsQuery);
      
       const serverDate = new Date(finalResultData.date);
       const startOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate());
       const endOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate() + 1);

      const todaysBets = betsSnapshot.docs.filter(doc => {
          const betTimestamp = doc.data().createdAt;
          return betTimestamp && betTimestamp.toDate() >= startOfDay && betTimestamp.toDate() < endOfDay;
      });

      const userIds = [...new Set(todaysBets.map(doc => doc.data().userId))];
      const userRefs = userIds.map(id => firestore.collection('users').doc(id));
      const userDocs = userIds.length > 0 ? await transaction.getAll(...userRefs) : [];
      const userDocsCache: { [userId: string]: FirebaseFirestore.DocumentSnapshot } = {};
      userDocs.forEach(doc => { if(doc.exists) userDocsCache[doc.id] = doc; });

      const openDigit = getDigit(finalResultData.openPanna);
      const closeDigit = finalResultData.closePanna ? getDigit(finalResultData.closePanna) : null;
      const jodi = openDigit ? (closeDigit ? openDigit + closeDigit : `${openDigit}*`) : null;

      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      const newResultRef = resultsRef.doc();
      transaction.set(newResultRef, { ...finalResultData, jodi: jodi || '--' });
      
      todaysBets.forEach(doc => {
        const bet = doc.data();
        if (bet.session !== 'Open') return;

        let winningAmount = 0;
        let isWinner = false;
        const multiplier = payoutMultipliers.get(bet.gameType);

        if (multiplier) {
             switch (bet.gameType) {
                case 'Single Digit':
                    if (bet.session === 'Open' && openDigit && String(bet.number) === openDigit) {
                        isWinner = true;
                    }
                    break;
                case 'Single Panna':
                case 'Double Panna':
                case 'Triple Panna':
                    if (bet.session === 'Open' && finalResultData.openPanna && String(bet.number) === finalResultData.openPanna) {
                         isWinner = true;
                    }
                    break;
            }
        }

        if (isWinner && multiplier) winningAmount = bet.amount * multiplier;

        const newStatus = isWinner ? 'Won' : 'Lost';
        transaction.update(doc.ref, { status: newStatus, winningAmount });

        if (bet.transactionId) {
            transaction.update(firestore.collection('transactions').doc(bet.transactionId), { status: newStatus });
        }

        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            if (!userWinnings[bet.userId]) userWinnings[bet.userId] = { amount: 0, userName, customId };
            userWinnings[bet.userId].amount += winningAmount;
            
            const winTransactionRef = firestore.collection('transactions').doc();
            transaction.set(winTransactionRef, {
                userId: bet.userId, userName, customId,
                type: 'Win', amount: winningAmount, status: 'Completed',
                date: new Date().toISOString(),
                description: `Won ${bet.gameType} on ${bet.market} with number ${bet.number}`,
                betId: doc.id
            });
        }
      });

      for (const userId in userWinnings) {
        transaction.update(firestore.collection('users').doc(userId), { winningBalance: FieldValue.increment(userWinnings[userId].amount) });
      }
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/play", 'page');
    return { success: true };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}

export async function updateKalyanResult(resultId: string, resultData: Partial<KalyanResult>) {
  try {
    if (resultData.closePanna && resultData.closePanna.length !== 3) {
        throw new Error("Close Panna must be exactly 3 digits.");
    }

    await firestore.runTransaction(async (transaction) => {
      const resultRef = firestore.collection("kalyan_results").doc(resultId);
      const fullResultDoc = await transaction.get(resultRef);
      if (!fullResultDoc.exists) throw new Error("Result to update not found.");
      
      const originalData = fullResultDoc.data() as KalyanResult;
      const finalDate = resultData.date ? getISTDateString(resultData.date) : originalData.date;
      const mergedData: KalyanResult = { ...originalData, ...resultData, date: finalDate };

      const payoutMultipliers = await createPayoutMultipliers(transaction, mergedData.marketName);
      
      const marketBetsQuery = firestore.collection('kalyan_bets').where('market', '==', mergedData.marketName).where('status', 'in', ['Placed', 'Lost']);
      const betsSnapshot = await transaction.get(marketBetsQuery);
      
      const serverDate = new Date(mergedData.date);
      const startOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate());
      const endOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate() + 1);

      const todaysBets = betsSnapshot.docs.filter(doc => {
          const betTimestamp = doc.data().createdAt;
          return betTimestamp && betTimestamp.toDate() >= startOfDay && betTimestamp.toDate() < endOfDay;
      });
          
      const userIds = [...new Set(todaysBets.map(doc => doc.data().userId))];
      const userRefs = userIds.map(id => firestore.collection('users').doc(id));
      const userDocs = userIds.length > 0 ? await transaction.getAll(...userRefs) : [];
      const userDocsCache: { [userId: string]: FirebaseFirestore.DocumentSnapshot } = {};
      userDocs.forEach(doc => { if(doc.exists) userDocsCache[doc.id] = doc; });

      const openDigit = getDigit(mergedData.openPanna);
      const closeDigit = mergedData.closePanna ? getDigit(mergedData.closePanna) : null;
      const jodi = (openDigit && closeDigit) ? openDigit + closeDigit : null;

      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      transaction.update(resultRef, { ...resultData, jodi: jodi || '--' });

      todaysBets.forEach(doc => {
        const bet = doc.data();
        
        if (bet.session !== 'Close' && bet.session !== 'Jodi') return;

        let winningAmount = 0;
        let isWinner = false;
        const multiplier = payoutMultipliers.get(bet.gameType);

        if (multiplier) {
            switch (bet.gameType) {
                case 'Single Digit':
                    if (bet.session === 'Close' && closeDigit && String(bet.number) === closeDigit) {
                        isWinner = true;
                    }
                    break;
                case 'Single Panna': case 'Double Panna': case 'Triple Panna':
                    if (bet.session === 'Close' && mergedData.closePanna && String(bet.number) === mergedData.closePanna) isWinner = true;
                    break;
                case 'Jodi':
                    if (bet.session === 'Jodi' && jodi && String(bet.number) === jodi) isWinner = true;
                    break;
                case 'Open Sangam':
                    if (bet.session === 'Jodi' && jodi) {
                        const [panna, digit] = String(bet.number).split('x');
                        if (panna === mergedData.openPanna && digit === closeDigit) isWinner = true;
                    }
                    break;
                case 'Close Sangam':
                    if (bet.session === 'Jodi' && jodi) {
                        const [digit, panna] = String(bet.number).split('x');
                        if (digit === openDigit && panna === mergedData.closePanna) isWinner = true;
                    }
                    break;
                case 'Full Sangam':
                    if (bet.session === 'Jodi' && jodi) {
                        const [openPannaSangam, closePannaSangam] = String(bet.number).split('x');
                        if (openPannaSangam === mergedData.openPanna && closePannaSangam === mergedData.closePanna) isWinner = true;
                    }
                    break;
            }
        }
        
        if (isWinner && multiplier) winningAmount = bet.amount * multiplier;

        const newStatus = isWinner ? 'Won' : (bet.status === 'Placed' ? 'Lost' : bet.status);
        if (bet.status !== newStatus) {
            transaction.update(doc.ref, { status: newStatus, winningAmount });
            if (bet.transactionId) {
                transaction.update(firestore.collection('transactions').doc(bet.transactionId), { status: newStatus });
            }
        }

        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            if (!userWinnings[bet.userId]) userWinnings[bet.userId] = { amount: 0, userName, customId };
            userWinnings[bet.userId].amount += winningAmount;
            
            const winTransactionRef = firestore.collection('transactions').doc();
            transaction.set(winTransactionRef, {
                userId: bet.userId, userName, customId,
                type: 'Win', amount: winningAmount, status: 'Completed',
                date: new Date().toISOString(),
                description: `Won ${bet.gameType} on ${bet.market} with number ${bet.number}`,
                betId: doc.id
            });
        }
      });

      for (const userId in userWinnings) {
        transaction.update(firestore.collection('users').doc(userId), { winningBalance: FieldValue.increment(userWinnings[userId].amount) });
      }
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/play", 'page');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating kalyan result:", error);
    throw new Error(error.message || "Failed to update kalyan result.");
  }
}

export async function deleteKalyanResult(resultId: string) {
    const resultRef = firestore.collection("kalyan_results").doc(resultId);
    try {
        await firestore.runTransaction(async (t) => {
            const resultDoc = await t.get(resultRef);
            if (!resultDoc.exists) throw new Error("Result to be deleted not found.");
            const resultData = resultDoc.data() as KalyanResult;

            const marketBetsQuery = firestore.collection('kalyan_bets').where('market', '==', resultData.marketName).where('status', '==', 'Won');
            const wonBetsSnapshot = await t.get(marketBetsQuery);
            
            const resultDate = new Date(resultData.date);
            const startOfDay = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate());
            const endOfDay = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate() + 1);

            const wonBetsOnDate = wonBetsSnapshot.docs.filter(doc => doc.data().createdAt.toDate() >= startOfDay && doc.data().createdAt.toDate() < endOfDay);
            const wonBetIds = wonBetsOnDate.map(doc => doc.id);

            if (wonBetIds.length === 0) {
                 t.delete(resultRef);
                 return;
            }

            const winTransactionsQuery = firestore.collection('transactions').where('type', '==', 'Win').where('betId', 'in', wonBetIds);
            const winTransactionsSnapshot = await t.get(winTransactionsQuery);

            const userBalanceReverts = new Map<string, number>();

            winTransactionsSnapshot.forEach(doc => {
                const winTx = doc.data();
                const currentRevert = userBalanceReverts.get(winTx.userId) || 0;
                userBalanceReverts.set(winTx.userId, currentRevert + winTx.amount);
                t.delete(doc.ref);
            });
            
            wonBetsOnDate.forEach(doc => {
                t.update(doc.ref, { status: "Placed", winningAmount: FieldValue.delete() });
            });

            for (const [userId, amountToRevert] of userBalanceReverts.entries()) {
                t.update(firestore.collection('users').doc(userId), { winningBalance: FieldValue.increment(-amountToRevert) });
            }

            t.delete(resultRef);
        });

        revalidatePath("/admin/manage-results", 'page');
        revalidatePath("/play", 'page');
        return { success: true, message: "Result deleted and all winnings have been reverted." };
    } catch (error: any) {
        console.error("Error deleting kalyan result and reverting winnings:", error);
        throw new Error(error.message || "Failed to delete kalyan result.");
    }
}
