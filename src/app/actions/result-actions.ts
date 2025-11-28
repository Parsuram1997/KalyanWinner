
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


async function calculateAndDistributeWinnings(transaction: FirebaseFirestore.Transaction, result: KalyanResult) {
    console.log(`Processing wins for ${result.marketName} on ${result.date}. Open declared: ${!!result.openPanna}, Close declared: ${!!result.closePanna}`);

    // --- (1) ALL READS FIRST ---

    // Read all game rates
    const ratesSnapshot = await transaction.get(firestore.collection('game_rates'));
    const betsSnapshot = await transaction.get(firestore.collection('kalyan_bets')
        .where('market', '==', result.marketName)
        .where('status', '==', 'Placed'));

    if (betsSnapshot.empty) {
        console.log('No placed bets found for this market.');
        return;
    }

    // Read all unique user documents involved in the bets
    const userIds = [...new Set(betsSnapshot.docs.map(doc => doc.data().userId))];
    const userRefs = userIds.map(id => firestore.collection('users').doc(id));
    const userDocs = await transaction.getAll(...userRefs);
    const userDocsCache: { [userId: string]: FirebaseFirestore.DocumentSnapshot } = {};
    userDocs.forEach(doc => {
        if(doc.exists) {
            userDocsCache[doc.id] = doc;
        }
    });

    // --- (2) PREPARE DATA AND CALCULATIONS (NO MORE READS) ---

    const payoutMultipliers = new Map<string, number>();
    if (!ratesSnapshot.empty) {
        ratesSnapshot.docs.forEach(doc => {
            const rateData = doc.data();
            if (rateData.name && rateData.payoutAmount && rateData.betAmount > 0) {
                payoutMultipliers.set(rateData.name, rateData.payoutAmount / rateData.betAmount);
            }
        });
    }

    const openDigit = getDigit(result.openPanna);
    const closeDigit = result.closePanna ? getDigit(result.closePanna) : null;
    const jodi = openDigit && closeDigit ? openDigit + closeDigit : null;

    console.log('Winning Numbers:', { openPanna: result.openPanna, openDigit, closePanna: result.closePanna, closeDigit, jodi });
    
    const userWinnings: { [userId: string]: { amount: number, userName: string, customId?: string } } = {};

    // --- (3) ALL WRITES LAST ---

    for (const doc of betsSnapshot.docs) {
        const bet = doc.data();
        const betNumberAsString = String(bet.number);

        let winningAmount = 0;
        let isWinner = false;

        switch (bet.gameType) {
            case 'Single Digit':
                if (bet.session === 'Open' && openDigit) {
                    if (betNumberAsString === openDigit) {
                        isWinner = true;
                        const multiplier = payoutMultipliers.get('Open') ?? payoutMultipliers.get('Single Digit') ?? 9;
                        winningAmount = bet.amount * multiplier;
                    }
                } else if (bet.session === 'Close' && closeDigit) {
                    if (betNumberAsString === closeDigit) {
                        isWinner = true;
                        const multiplier = payoutMultipliers.get('Close') ?? payoutMultipliers.get('Single Digit') ?? 9;
                        winningAmount = bet.amount * multiplier;
                    }
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

                let updated = false;
                if (bet.session === 'Open' && result.openPanna) {
                    if (betNumberAsString === result.openPanna) {
                        isWinner = true;
                        winningAmount = bet.amount * pannaMultiplier;
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                    updated = true;
                }
                if (bet.session === 'Close' && result.closePanna) {
                     if (betNumberAsString === result.closePanna) {
                        isWinner = true;
                        winningAmount = bet.amount * pannaMultiplier;
                    }
                    // If it was already updated for open, don't update again unless it also won close
                    if (updated && !isWinner) { 
                        // It didn't win close, so it's a loss. Status is already set.
                    } else {
                        transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                    }
                }
                break;

            case 'Jodi':
                if (jodi) {
                    if (betNumberAsString === jodi) {
                        isWinner = true;
                        winningAmount = bet.amount * (payoutMultipliers.get('Jodi') || 90);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;
            
            case 'Open Sangam':
            case 'Close Sangam':
                if (jodi) { 
                    let sangamWinner = false;
                    
                    if (bet.gameType === 'Open Sangam') {
                        const [panna, digit] = betNumberAsString.split(/\s?x\s?/);
                        if (panna === result.openPanna && digit === closeDigit) {
                           sangamWinner = true;
                        }
                    } else if (bet.gameType === 'Close Sangam') {
                        const [digit, panna] = betNumberAsString.split(/\s?x\s?/);
                        if (digit === openDigit && panna === result.closePanna) {
                          sangamWinner = true;
                        }
                    }

                    if(sangamWinner){
                        isWinner = true;
                        winningAmount = bet.amount * (payoutMultipliers.get(bet.gameType) || 1200);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;

            case 'Full Sangam':
                 if (jodi) { 
                    const [openPannaSangam, closePannaSangam] = betNumberAsString.split(/\s?x\s?/);
                    if (openPannaSangam === result.openPanna && closePannaSangam === result.closePanna) {
                       isWinner = true;
                       winningAmount = bet.amount * (payoutMultipliers.get('Full Sangam') || 12000);
                    }
                    transaction.update(doc.ref, { status: isWinner ? 'Won' : 'Lost', winningAmount });
                }
                break;
        }

        if (isWinner) {
            console.log(`Winner found! Bet ID: ${doc.id}, Type: ${bet.gameType}, Session: ${bet.session}, Amount: ${winningAmount}`);
            
            const userDoc = userDocsCache[bet.userId];
            const customId = userDoc?.exists ? userDoc.data()?.customId : undefined;
            const userName = userDoc?.exists ? userDoc.data()?.name : bet.userName;

            if (!userWinnings[bet.userId]) {
                userWinnings[bet.userId] = { amount: 0, userName: userName, customId };
            }
            userWinnings[bet.userId].amount += winningAmount;

            const transactionRef = firestore.collection('transactions').doc();
            transaction.set(transactionRef, {
                userId: bet.userId,
                userName: userName,
                customId: customId,
                type: 'Win',
                amount: winningAmount,
                status: 'Completed',
                date: new Date().toISOString(),
                description: `Won ${bet.gameType} on ${bet.market} with number ${bet.number}`,
                market: bet.market,
                gameType: bet.gameType,
                betId: doc.id
            });
        }
    };

    for (const userId in userWinnings) {
        console.log(`Crediting user ${userId} with ${userWinnings[userId].amount}`);
        const userRef = firestore.collection('users').doc(userId);
        transaction.update(userRef, { winningBalance: FieldValue.increment(userWinnings[userId].amount) });
    }

    console.log('Transaction batch prepared.');
}


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
      
      const snapshot = await transaction.get(existingResultQuery);
      if (!snapshot.empty) {
          throw new Error(`A result for ${resultData.marketName} on ${resultData.date} already exists.`);
      }

      const docRef = resultsRef.doc(); 
      transaction.set(docRef, resultData);

      await calculateAndDistributeWinnings(transaction, resultData);
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
      
      // Read must be before write
      const fullResultDoc = await transaction.get(resultRef);
      const originalData = fullResultDoc.data() as KalyanResult | undefined;
      
      if (!originalData) {
          throw new Error("Result to update not found.");
      }

      // Perform write
      transaction.update(resultRef, resultData);

      // Pass merged data to calculation function
      const mergedData: KalyanResult = { ...originalData, ...resultData };

      if (!mergedData.date || !mergedData.marketName || !mergedData.openPanna) {
        throw new Error("Result data is incomplete. Cannot calculate winnings.");
      }

      await calculateAndDistributeWinnings(transaction, mergedData);
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
    
