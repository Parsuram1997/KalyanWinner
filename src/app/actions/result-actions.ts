
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

// Helper to calculate the digit from a panna
const getDigit = (panna: string) => {
  if (!panna || panna.length !== 3 || !/^\d+$/.test(panna)) return null;
  return String(panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10);
};

// Helper to get today's date in YYYY-MM-DD format, adjusted for IST
const getISTDateString = (dateInput: string): string => {
    // The date from the frontend is already in YYYY-MM-DD, no timezone conversion needed
    return dateInput;
};


export async function createKalyanResult(resultData: KalyanResult) {
  try {
    const istDate = getISTDateString(resultData.date);
    const finalResultData = { ...resultData, date: istDate };

    finalResultData.marketName = finalResultData.marketName.trim();
    if (finalResultData.openPanna && finalResultData.openPanna.length !== 3 && finalResultData.openPanna !== 'H') {
        throw new Error("Open Panna must be exactly 3 digits.");
    }
    if (finalResultData.closePanna && finalResultData.closePanna.length !== 3 && finalResultData.closePanna !== 'O') {
        throw new Error("Close Panna must be exactly 3 digits.");
    }

    await firestore.runTransaction(async (transaction) => {
      const resultsRef = firestore.collection("kalyan_results");
      const existingResultQuery = resultsRef
          .where("marketName", "==", finalResultData.marketName)
          .where("date", "==", finalResultData.date);

      // --- (1) ALL READS FIRST ---
      const existingResultSnapshot = await transaction.get(existingResultQuery);
      if (!existingResultSnapshot.empty) {
          throw new Error(`A result for ${finalResultData.marketName} on ${finalResultData.date} already exists.`);
      }
      
      const marketBetsQuery = firestore.collection('kalyan_bets')
          .where('market', '==', finalResultData.marketName)
          .where('status', '==', 'Placed');

      // Read all relevant bets for the market
      const betsSnapshot = await transaction.get(marketBetsQuery);
      
      // Filter bets for the specific date on the server-side
       const serverDate = new Date(finalResultData.date);
       const startOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate());
       const endOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate() + 1);

      const todaysBets = betsSnapshot.docs.filter(doc => {
          const betTimestamp = doc.data().createdAt;
          if (betTimestamp) {
              const betDate = betTimestamp.toDate();
              return betDate >= startOfDay && betDate < endOfDay;
          }
          return false;
      });


      // Read all game rates
      const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));
      
      // Read all unique user documents involved in the bets
      const userIds = [...new Set(todaysBets.map(doc => doc.data().userId))];
      const userRefs = userIds.map(id => firestore.collection('users').doc(id));
      const userDocs = userIds.length > 0 ? await transaction.getAll(...userRefs) : [];
      
      const userDocsCache: { [userId: string]: FirebaseFirestore.DocumentSnapshot } = {};
      userDocs.forEach(doc => {
          if(doc.exists) userDocsCache[doc.id] = doc;
      });

      // --- (2) PREPARE DATA AND CALCULATIONS ---
      const payoutMultipliers = new Map<string, number>();
      ratesSnapshot.forEach(doc => {
          const rateData = doc.data();
          if (rateData.name && rateData.payoutAmount && rateData.betAmount > 0) {
              payoutMultipliers.set(rateData.name, rateData.payoutAmount / rateData.betAmount);
          }
      });

      const openDigit = getDigit(finalResultData.openPanna);
      const closeDigit = finalResultData.closePanna ? getDigit(finalResultData.closePanna) : null;
      let jodi: string | null = null;
      if (openDigit) {
          jodi = closeDigit ? openDigit + closeDigit : `${openDigit}*`;
      }


      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      // --- (3) ALL WRITES LAST ---

      // Write 1: Create the new result document
      const newResultRef = resultsRef.doc();
      transaction.set(newResultRef, { ...finalResultData, jodi: jodi || '--' });
      
      // Writes 2: Update bets and create win transactions
      todaysBets.forEach(doc => {
        const bet = doc.data();
        const betNumberAsString = String(bet.number);
        let winningAmount = 0;
        let isWinner = false;
        
        // ** IMPORTANT **
        // Do not process Jodi or Full Sangam bets here. They can only be determined
        // when the CLOSE result is in. Only process Open session bets.
        const finalGameTypes = ['Jodi', 'Full Sangam'];
        if(finalGameTypes.includes(bet.gameType)) {
            return; // Skip this bet, it will be processed by updateKalyanResult
        }


        switch (bet.gameType) {
             case 'Single Digit':
                if (bet.session === 'Open' && openDigit && betNumberAsString === openDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                }
                break;
            
            case 'Single Panna':
            case 'Double Panna':
            case 'Triple Panna':
                let pannaMultiplier = 0;
                if (bet.gameType === 'Single Panna') pannaMultiplier = payoutMultipliers.get('Single Panna') || 140;
                if (bet.gameType === 'Double Panna') pannaMultiplier = payoutMultipliers.get('Double Panna') || 280;
                if (bet.gameType === 'Triple Panna') pannaMultiplier = payoutMultipliers.get('Triple Panna') || 700;

                if (bet.session === 'Open' && finalResultData.openPanna && betNumberAsString === finalResultData.openPanna) {
                    isWinner = true;
                    winningAmount = bet.amount * pannaMultiplier;
                }
                break;
            
            case 'Open Sangam':
                 if (jodi && jodi.length === 2) { 
                    const [panna, digit] = betNumberAsString.split('x');
                    if (panna === finalResultData.openPanna && digit === closeDigit) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Open Sangam') || 1200);
                    }
                }
                break;

            case 'Close Sangam':
                 if (jodi && jodi.length === 2) {
                    const [digit, panna] = betNumberAsString.split('x');
                    if (digit === openDigit && panna === finalResultData.closePanna) {
                      isWinner = true;
                      winningAmount = bet.amount * (payoutMultipliers.get('Close Sangam') || 1200);
                    }
                }
                break;
        }

        const newStatus = isWinner ? 'Won' : 'Lost';
        transaction.update(doc.ref, { status: newStatus, winningAmount });

        // Also update the original 'Bet' transaction status
        if (bet.transactionId) {
            const betTransactionRef = firestore.collection('transactions').doc(bet.transactionId);
            transaction.update(betTransactionRef, { status: newStatus });
        }


        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            
            if (!userWinnings[bet.userId]) {
                userWinnings[bet.userId] = { amount: 0, userName: userName, customId: customId };
            }
            userWinnings[bet.userId].amount += winningAmount;
            
            const winTransactionRef = firestore.collection('transactions').doc();
            transaction.set(winTransactionRef, {
                userId: bet.userId,
                userName: userName,
                customId: customId,
                type: 'Win',
                amount: winningAmount,
                status: 'Completed',
                date: new Date().toISOString(),
                description: `Won ${bet.gameType} on ${bet.market} with number ${bet.number}`,
                betId: doc.id
            });
        }
      });

      // Writes 3: Update user balances
      for (const userId in userWinnings) {
        const userRef = firestore.collection('users').doc(userId);
        transaction.update(userRef, { winningBalance: FieldValue.increment(userWinnings[userId].amount) });
      }
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/dashboard", 'page');
    revalidatePath("/results", 'page');
    revalidatePath("/leaderboard", 'page');
    revalidatePath("/play", 'page');
    return { success: true };
  } catch (error: any) {
    console.error("Error creating kalyan result:", error);
    throw new Error(error.message || "Failed to create kalyan result.");
  }
}

export async function updateKalyanResult(resultId: string, resultData: Partial<KalyanResult>) {
  try {
    if (resultData.openPanna && resultData.openPanna.length !== 3) {
        throw new Error("Open Panna must be exactly 3 digits.");
    }
    if (resultData.closePanna && resultData.closePanna.length !== 3) {
        throw new Error("Close Panna must be exactly 3 digits.");
    }

    await firestore.runTransaction(async (transaction) => {
      const resultRef = firestore.collection("kalyan_results").doc(resultId);
      
      // --- (1) ALL READS FIRST ---
      const fullResultDoc = await transaction.get(resultRef);
      if (!fullResultDoc.exists) {
          throw new Error("Result to update not found.");
      }
      const originalData = fullResultDoc.data() as KalyanResult;
      
      const finalDate = resultData.date ? getISTDateString(resultData.date) : originalData.date;
      const mergedData: KalyanResult = { ...originalData, ...resultData, date: finalDate };

      const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));
      
      const marketBetsQuery = firestore.collection('kalyan_bets')
          .where('market', '==', mergedData.marketName)
          .where('status', 'in', ['Placed', 'Lost']);

      const betsSnapshot = await transaction.get(marketBetsQuery);
      
       const serverDate = new Date(mergedData.date);
       const startOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate());
       const endOfDay = new Date(serverDate.getFullYear(), serverDate.getMonth(), serverDate.getDate() + 1);

       const todaysBets = betsSnapshot.docs.filter(doc => {
          const betTimestamp = doc.data().createdAt;
          if (betTimestamp) {
              const betDate = betTimestamp.toDate();
              return betDate >= startOfDay && betDate < endOfDay;
          }
          return false;
      });
          
      const userIds = [...new Set(todaysBets.map(doc => doc.data().userId))];
      const userRefs = userIds.map(id => firestore.collection('users').doc(id));
      const userDocs = userIds.length > 0 ? await transaction.getAll(...userRefs) : [];

      const userDocsCache: { [userId: string]: FirebaseFirestore.DocumentSnapshot } = {};
      userDocs.forEach(doc => {
          if(doc.exists) userDocsCache[doc.id] = doc;
      });

      // --- (2) PREPARE DATA AND CALCULATIONS ---
      const payoutMultipliers = new Map<string, number>();
      ratesSnapshot.forEach(doc => {
          const rateData = doc.data();
          if (rateData.name && rateData.payoutAmount && rateData.betAmount > 0) {
              payoutMultipliers.set(rateData.name, rateData.payoutAmount / rateData.betAmount);
          }
      });
      
      const openDigit = getDigit(mergedData.openPanna);
      const closeDigit = mergedData.closePanna ? getDigit(mergedData.closePanna) : null;
      let jodi: string | null = null;
      if (openDigit && closeDigit) {
          jodi = openDigit + closeDigit;
      }

      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      // --- (3) ALL WRITES LAST ---

      // Write 1: Update the result
      transaction.update(resultRef, { ...resultData, jodi: jodi || '--' });

      // Writes 2: Update bets and create win transactions
      todaysBets.forEach(doc => {
        const bet = doc.data();
        const betNumberAsString = String(bet.number);
        let winningAmount = 0;
        let isWinner = false;

        switch (bet.gameType) {
            case 'Single Digit':
                 if (bet.session === 'Close' && closeDigit && betNumberAsString === closeDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                }
                break;
            
            case 'Single Panna':
            case 'Double Panna':
            case 'Triple Panna':
                let pannaMultiplier = 0;
                if (bet.gameType === 'Single Panna') pannaMultiplier = payoutMultipliers.get('Single Panna') || 140;
                if (bet.gameType === 'Double Panna') pannaMultiplier = payoutMultipliers.get('Double Panna') || 280;
                if (bet.gameType === 'Triple Panna') pannaMultiplier = payoutMultipliers.get('Triple Panna') || 700;

                if (bet.session === 'Close' && mergedData.closePanna && betNumberAsString === mergedData.closePanna) {
                    isWinner = true;
                    winningAmount = bet.amount * pannaMultiplier;
                }
                break;

            case 'Jodi':
                if (jodi && jodi.length === 2 && betNumberAsString === jodi) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Jodi') || 90);
                }
                break;

            case 'Open Sangam':
                 if (jodi && jodi.length === 2) { 
                    const [panna, digit] = betNumberAsString.split('x');
                    if (panna === mergedData.openPanna && digit === closeDigit) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Open Sangam') || 1200);
                    }
                }
                break;

            case 'Close Sangam':
                 if (jodi && jodi.length === 2) {
                    const [digit, panna] = betNumberAsString.split('x');
                    if (digit === openDigit && panna === mergedData.closePanna) {
                      isWinner = true;
                      winningAmount = bet.amount * (payoutMultipliers.get('Close Sangam') || 1200);
                    }
                }
                break;

            case 'Full Sangam':
                 if (jodi && jodi.length === 2) { 
                    const [openPannaSangam, closePannaSangam] = betNumberAsString.split('x');
                    if (openPannaSangam === mergedData.openPanna && closePannaSangam === mergedData.closePanna) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Full Sangam') || 12000);
                    }
                }
                break;
        }

        const newStatus = isWinner ? 'Won' : 'Lost';
        // Only update if the status is changing. Avoids re-processing bets that are already won/lost correctly.
        if (bet.status !== newStatus) {
            transaction.update(doc.ref, { status: newStatus, winningAmount });
            
            // Also update the original 'Bet' transaction status
            if (bet.transactionId) {
                const betTransactionRef = firestore.collection('transactions').doc(bet.transactionId);
                transaction.update(betTransactionRef, { status: newStatus });
            }
        }


        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            
            if (!userWinnings[bet.userId]) {
                userWinnings[bet.userId] = { amount: 0, userName: userName, customId: customId };
            }
            userWinnings[bet.userId].amount += winningAmount;
            
            const winTransactionRef = firestore.collection('transactions').doc();
            transaction.set(winTransactionRef, {
                userId: bet.userId,
                userName: userName,
                customId: customId,
                type: 'Win',
                amount: winningAmount,
                status: 'Completed',
                date: new Date().toISOString(),
                description: `Won ${bet.gameType} on ${bet.market} with number ${bet.number}`,
                betId: doc.id
            });
        }
      });

      // Writes 3: Update user balances
      for (const userId in userWinnings) {
        const userRef = firestore.collection('users').doc(userId);
        transaction.update(userRef, { winningBalance: FieldValue.increment(userWinnings[userId].amount) });
      }
    });

    revalidatePath("/admin/manage-results", 'page');
    revalidatePath("/dashboard", 'page');
    revalidatePath("/results", 'page');
    revalidatePath("/leaderboard", 'page');
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
            // 1. READ all necessary documents
            const resultDoc = await t.get(resultRef);
            if (!resultDoc.exists) {
                throw new Error("Result to be deleted not found.");
            }
            const resultData = resultDoc.data() as KalyanResult;

            const marketBetsQuery = firestore.collection('kalyan_bets')
                .where('market', '==', resultData.marketName)
                .where('status', '==', 'Won');
            
            const wonBetsSnapshot = await t.get(marketBetsQuery);
            
            const resultDate = new Date(resultData.date);
            const startOfDay = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate());
            const endOfDay = new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate() + 1);

            const wonBetsOnDate = wonBetsSnapshot.docs.filter(doc => {
                const betDate = doc.data().createdAt.toDate();
                return betDate >= startOfDay && betDate < endOfDay;
            });

            const wonBetIds = wonBetsOnDate.map(doc => doc.id);
            if (wonBetIds.length === 0) {
                 t.delete(resultRef);
                 return;
            }

            const winTransactionsQuery = firestore.collection('transactions')
                .where('type', '==', 'Win')
                .where('betId', 'in', wonBetIds);

            const winTransactionsSnapshot = await t.get(winTransactionsQuery);

            const userBalanceReverts = new Map<string, number>();
            const betsToUpdate: {ref: FirebaseFirestore.DocumentReference, data: any}[] = [];
            const transactionsToDelete: FirebaseFirestore.DocumentReference[] = [];

            winTransactionsSnapshot.forEach(doc => {
                const winTx = doc.data();
                const currentRevert = userBalanceReverts.get(winTx.userId) || 0;
                userBalanceReverts.set(winTx.userId, currentRevert + winTx.amount);
                transactionsToDelete.push(doc.ref);
            });
            
            wonBetsOnDate.forEach(doc => {
                betsToUpdate.push({ ref: doc.ref, data: { status: "Placed", winningAmount: FieldValue.delete() } });
            });

            for (const [userId, amountToRevert] of userBalanceReverts.entries()) {
                const userRef = firestore.collection('users').doc(userId);
                t.update(userRef, { winningBalance: FieldValue.increment(-amountToRevert) });
            }

            for (const betUpdate of betsToUpdate) {
                t.update(betUpdate.ref, betUpdate.data);
            }

            for (const txDelete of transactionsToDelete) {
                t.delete(txDelete);
            }

            t.delete(resultRef);
        });

        revalidatePath("/admin/manage-results", 'page');
        revalidatePath("/dashboard", 'page');
        revalidatePath("/results", 'page');
        revalidatePath("/leaderboard", 'page');
        revalidatePath("/play", 'page');
        return { success: true, message: "Result deleted and all winnings have been reverted." };
    } catch (error: any) {
        console.error("Error deleting kalyan result and reverting winnings:", error);
        throw new Error(error.message || "Failed to delete kalyan result.");
    }
}
