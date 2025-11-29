
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

export async function createKalyanResult(resultData: KalyanResult) {
  try {
    resultData.marketName = resultData.marketName.trim();
    if (resultData.openPanna && resultData.openPanna.length !== 3 && resultData.openPanna !== 'H') {
        throw new Error("Open Panna must be exactly 3 digits.");
    }
    if (resultData.closePanna && resultData.closePanna.length !== 3 && resultData.closePanna !== 'O') {
        throw new Error("Close Panna must be exactly 3 digits.");
    }

    await firestore.runTransaction(async (transaction) => {
      const resultsRef = firestore.collection("kalyan_results");
      const existingResultQuery = resultsRef
          .where("marketName", "==", resultData.marketName)
          .where("date", "==", resultData.date);

      // --- (1) ALL READS FIRST ---
      const existingResultSnapshot = await transaction.get(existingResultQuery);
      if (!existingResultSnapshot.empty) {
          throw new Error(`A result for ${resultData.marketName} on ${resultData.date} already exists.`);
      }

      // Read all game rates and relevant bets
      const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));
      const betsSnapshot = await transaction.get(firestore.collection('kalyan_bets')
          .where('market', '==', resultData.marketName)
          .where('status', '==', 'Placed'));

      // Read all unique user documents involved in the bets
      const userIds = [...new Set(betsSnapshot.docs.map(doc => doc.data().userId))];
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

      const openDigit = getDigit(resultData.openPanna);
      const closeDigit = resultData.closePanna ? getDigit(resultData.closePanna) : null;
      const jodi = openDigit && closeDigit ? openDigit + closeDigit : null;

      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      // --- (3) ALL WRITES LAST ---

      // Write 1: Create the new result document
      const newResultRef = resultsRef.doc();
      transaction.set(newResultRef, { ...resultData, jodi: jodi || '--' });
      
      // Writes 2: Update bets and create win transactions
      betsSnapshot.forEach(doc => {
        const bet = doc.data();
        const betNumberAsString = String(bet.number);
        let winningAmount = 0;
        let isWinner = false;

        switch (bet.gameType) {
             case 'Single Digit':
                if (bet.session === 'Open' && openDigit && betNumberAsString === openDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                } else if (bet.session === 'Close' && closeDigit && betNumberAsString === closeDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;
            
            case 'Single Panna':
            case 'Double Panna':
            case 'Triple Panna':
                let pannaMultiplier = 0;
                if (bet.gameType === 'Single Panna') pannaMultiplier = payoutMultipliers.get('Single Panna') || 140;
                if (bet.gameType === 'Double Panna') pannaMultiplier = payoutMultipliers.get('Double Panna') || 280;
                if (bet.gameType === 'Triple Panna') pannaMultiplier = payoutMultipliers.get('Triple Panna') || 700;

                if ((bet.session === 'Open' && resultData.openPanna && betNumberAsString === resultData.openPanna) ||
                    (bet.session === 'Close' && resultData.closePanna && betNumberAsString === resultData.closePanna)) {
                    isWinner = true;
                    winningAmount = bet.amount * pannaMultiplier;
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;

            case 'Jodi':
                if (jodi && betNumberAsString === jodi) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Jodi') || 90);
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;
            
            case 'Open Sangam':
                 if (jodi) { 
                    const [panna, digit] = betNumberAsString.split('x');
                    if (panna === resultData.openPanna && digit === closeDigit) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Open Sangam') || 1200);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;

            case 'Close Sangam':
                 if (jodi) {
                    const [digit, panna] = betNumberAsString.split('x');
                    if (digit === openDigit && panna === resultData.closePanna) {
                      isWinner = true;
                      winningAmount = bet.amount * (payoutMultipliers.get('Close Sangam') || 1200);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;

            case 'Full Sangam':
                 if (jodi) { 
                    const [openPannaSangam, closePannaSangam] = betNumberAsString.split('x');
                    if (openPannaSangam === resultData.openPanna && closePannaSangam === resultData.closePanna) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Full Sangam') || 12000);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;
        }

        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            
            if (!userWinnings[bet.userId]) {
                userWinnings[bet.userId] = { amount: 0, userName, customId };
            }
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
      const mergedData: KalyanResult = { ...originalData, ...resultData };

      const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));
      const betsSnapshot = await transaction.get(firestore.collection('kalyan_bets')
          .where('market', '==', mergedData.marketName)
          .where('status', '==', 'Placed'));
          
      const userIds = [...new Set(betsSnapshot.docs.map(doc => doc.data().userId))];
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
      const jodi = openDigit && closeDigit ? openDigit + closeDigit : null;

      const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

      // --- (3) ALL WRITES LAST ---

      // Write 1: Update the result
      transaction.update(resultRef, { ...resultData, jodi: jodi || '--' });

      // Writes 2: Update bets and create win transactions
      betsSnapshot.forEach(doc => {
        const bet = doc.data();
        const betNumberAsString = String(bet.number);
        let winningAmount = 0;
        let isWinner = false;

        switch (bet.gameType) {
            case 'Single Digit':
                if (bet.session === 'Open' && openDigit && betNumberAsString === openDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                } else if (bet.session === 'Close' && closeDigit && betNumberAsString === closeDigit) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Single Digit') || 9);
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;
            
            case 'Single Panna':
            case 'Double Panna':
            case 'Triple Panna':
                let pannaMultiplier = 0;
                if (bet.gameType === 'Single Panna') pannaMultiplier = payoutMultipliers.get('Single Panna') || 140;
                if (bet.gameType === 'Double Panna') pannaMultiplier = payoutMultipliers.get('Double Panna') || 280;
                if (bet.gameType === 'Triple Panna') pannaMultiplier = payoutMultipliers.get('Triple Panna') || 700;

                if ((bet.session === 'Open' && mergedData.openPanna && betNumberAsString === mergedData.openPanna) ||
                    (bet.session === 'Close' && mergedData.closePanna && betNumberAsString === mergedData.closePanna)) {
                    isWinner = true;
                    winningAmount = bet.amount * pannaMultiplier;
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;

            case 'Jodi':
                if (jodi && betNumberAsString === jodi) {
                    isWinner = true;
                    winningAmount = bet.amount * (payoutMultipliers.get('Jodi') || 90);
                }
                transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                break;

            case 'Open Sangam':
                 if (jodi) { 
                    const [panna, digit] = betNumberAsString.split('x');
                    if (panna === mergedData.openPanna && digit === closeDigit) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Open Sangam') || 1200);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;

            case 'Close Sangam':
                 if (jodi) {
                    const [digit, panna] = betNumberAsString.split('x');
                    if (digit === openDigit && panna === mergedData.closePanna) {
                      isWinner = true;
                      winningAmount = bet.amount * (payoutMultipliers.get('Close Sangam') || 1200);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;

            case 'Full Sangam':
                 if (jodi) { 
                    const [openPannaSangam, closePannaSangam] = betNumberAsString.split('x');
                    if (openPannaSangam === mergedData.openPanna && closePannaSangam === mergedData.closePanna) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Full Sangam') || 12000);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;
        }

        if (isWinner) {
            const userDoc = userDocsCache[bet.userId];
            const userName = userDoc?.data()?.name || bet.userName;
            const customId = userDoc?.data()?.customId;
            
            if (!userWinnings[bet.userId]) {
                userWinnings[bet.userId] = { amount: 0, userName, customId };
            }
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
            if (!resultDoc.exists) {
                throw new Error("Result to be deleted not found.");
            }
            const resultData = resultDoc.data() as KalyanResult;
            const { marketName, date } = resultData;

            const winTransactionsQuery = firestore.collection('transactions')
                .where('market', '==', marketName)
                .where('type', '==', 'Win');
                
            const winTransactionsSnapshot = await t.get(winTransactionsQuery);

            const userBalanceUpdates = new Map<string, number>();
            const betsToUpdate: {ref: FirebaseFirestore.DocumentReference, data: any}[] = [];
            const transactionsToDelete: FirebaseFirestore.DocumentReference[] = [];

            for (const doc of winTransactionsSnapshot.docs) {
                 const winTx = doc.data();
                 const betId = winTx.betId;
                 
                 const betRef = firestore.collection('kalyan_bets').doc(betId);
                 const betDoc = await t.get(betRef);
                 if (betDoc.exists) {
                     const betDate = betDoc.data()?.createdAt.toDate();
                     const resultDate = new Date(date);
                     if (betDate.toDateString() === resultDate.toDateString()) {
                        const currentAmount = userBalanceUpdates.get(winTx.userId) || 0;
                        userBalanceUpdates.set(winTx.userId, currentAmount + winTx.amount);

                        transactionsToDelete.push(doc.ref);
                        betsToUpdate.push({ ref: betRef, data: { status: "Placed", winningAmount: FieldValue.delete() } });
                     }
                 }
            }
            
            // Now, perform all writes
            for (const [userId, amountToRevert] of userBalanceUpdates.entries()) {
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
        return { success: true, message: "Result deleted and all winnings have been reverted." };
    } catch (error: any) {
        console.error("Error deleting kalyan result and reverting winnings:", error);
        throw new Error(error.message || "Failed to delete kalyan result.");
    }
}
    
