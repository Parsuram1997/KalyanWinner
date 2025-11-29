
'use server';

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";


// Action to approve a deposit transaction
export async function approveDeposit(transactionId: string, userId: string, amount: number) {
  const transactionRef = firestore.collection("transactions").doc(transactionId);
  const userRef = firestore.collection("users").doc(userId);

  try {
    // --- TRANSACTION 1: CORE DEPOSIT APPROVAL ---
    // This transaction's only job is to credit the user. It's simple and reliable.
    await firestore.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User to be credited does not exist.");
      }
      
      // Update user's balance and transaction status.
      t.update(userRef, { 
        depositBalance: FieldValue.increment(amount),
        totalDeposits: FieldValue.increment(amount)
      });
      t.update(transactionRef, { status: "Completed" });
    });

    console.log(`Deposit transaction ${transactionId} for user ${userId} completed successfully.`);

    // --- POST-TRANSACTION: BONUS LOGIC ---
    // Now that the main deposit is safely committed, we can handle the bonus logic.
    // This runs outside the main transaction to avoid complexity and rule violations.
    
    // 1. Get the latest user data after the deposit.
    const userDocAfterDeposit = await userRef.get();
    if (!userDocAfterDeposit.exists) {
        console.warn(`User document ${userId} disappeared after deposit. Skipping bonus check.`);
        return { success: true, message: "Deposit approved, but could not re-verify user for bonus." };
    }
    const userData = userDocAfterDeposit.data()!;
    const { enrollerId, commissionPaid, totalDeposits } = userData;
    
    // 2. Get bonus settings.
    const settingsDoc = await firestore.collection('payment_settings').doc('main').get();
    const minDepositForBonus = settingsDoc.data()?.minDepositForBonus || 500;
    const referralBonusAmount = settingsDoc.data()?.referralBonusAmount || 5;

    // 3. Check for bonus eligibility.
    const isEligibleForBonus = enrollerId && !commissionPaid && totalDeposits >= minDepositForBonus;

    if (isEligibleForBonus) {
        console.log(`User ${userId} is eligible for a referral bonus. Finding enroller with customId: ${enrollerId}`);

        // 4. Find the enroller by their custom ID.
        const enrollerQuery = firestore.collection('users').where('customId', '==', enrollerId).limit(1);
        const enrollerSnapshot = await enrollerQuery.get();

        if (enrollerSnapshot.empty) {
            console.warn(`Enroller with customId ${enrollerId} not found. Bonus cannot be awarded.`);
            return { success: true, message: `Deposit approved, but enroller ${enrollerId} not found for bonus.` };
        }

        // 5. Award the bonus in a new, separate transaction.
        const enrollerDoc = enrollerSnapshot.docs[0];
        const enrollerRef = enrollerDoc.ref;
        
        await firestore.runTransaction(async (t) => {
             // Read enroller data inside this new transaction
            const enrollerData = (await t.get(enrollerRef)).data();
            
            console.log(`Awarding bonus of ${referralBonusAmount} to enroller ${enrollerId} (UID: ${enrollerDoc.id})`);
            
            // Update enroller's commission balance
            t.update(enrollerRef, { commissionBalance: FieldValue.increment(referralBonusAmount) });
            
            // Mark commission as paid for the depositing user
            t.update(userRef, { commissionPaid: true });

            // Create a bonus transaction record for the enroller
            const bonusTransactionRef = firestore.collection('transactions').doc();
            t.set(bonusTransactionRef, {
                userId: enrollerDoc.id, // Use the enroller's actual UID
                userName: enrollerData?.name || 'Enroller',
                customId: enrollerId,
                type: "Referral Bonus",
                amount: referralBonusAmount,
                status: "Completed",
                date: new Date().toISOString(),
                description: `Referral bonus for user ${userData.name} (${userData.customId || userId})`,
            });
        });
        console.log(`Bonus transaction for enroller ${enrollerId} completed.`);
    }

    // Revalidation paths
    revalidatePath("/admin/transactions", 'page');
    revalidatePath("/admin/cash-ledger", 'page');
    revalidatePath("/admin/users/" + userId, 'page');
    revalidatePath("/enroller/users", 'page');
    revalidatePath("/enroller/wallet", 'page');
    revalidatePath("/wallet", 'page');

    return { success: true, message: "Deposit approved and balance updated." };

  } catch (error: any) {
    console.error("FATAL: Error during core deposit approval transaction: ", error);
    return { success: false, message: error.message || "Failed to approve deposit." };
  }
}


// Action for an admin to approve a withdrawal transaction
export async function approveWithdrawal(transactionId: string, userId: string, amount: number, utr?: string) {
    const transactionRef = firestore.collection("transactions").doc(transactionId);
    const userRef = firestore.collection("users").doc(userId);

    try {
        await firestore.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }

            const userData = userDoc.data()!;
            const { role, winningBalance, commissionBalance } = userData;

            let balanceToDeductFrom: 'winningBalance' | 'commissionBalance';
            let currentBalance: number;

            if (role === 'Enroller') {
                balanceToDeductFrom = 'commissionBalance';
                currentBalance = commissionBalance || 0;
            } else {
                balanceToDeductFrom = 'winningBalance';
                currentBalance = winningBalance || 0;
            }

            if (currentBalance < amount) {
                throw new Error(`User has insufficient ${balanceToDeductFrom} for this withdrawal.`);
            }
            
            const updateData: {status: string, utr?: string} = { status: "Completed" };
            if (utr) {
                updateData.utr = utr;
            }
            t.update(transactionRef, updateData);

            t.update(userRef, {
                [balanceToDeductFrom]: FieldValue.increment(-amount),
                totalWithdrawals: FieldValue.increment(amount)
            });
        });

        revalidatePath("/admin/transactions", 'page');
        revalidatePath("/admin/cash-ledger", 'page');
        revalidatePath("/admin/users/" + userId, 'page');
        revalidatePath("/enroller/wallet", 'page');
        revalidatePath("/wallet", 'page');

        return { success: true, message: "Withdrawal approved and balance updated." };

    } catch (error: any) {
        console.error("Error approving withdrawal: ", error);
        return { success: false, message: error.message || "Failed to approve withdrawal." };
    }
}

// Action for an admin to reject a transaction (deposit or withdrawal)
export async function rejectTransaction(transactionId: string) {
    try {
        await firestore.collection("transactions").doc(transactionId).set({ status: 'Rejected' }, { merge: true });
        revalidatePath('/admin/transactions', 'page');
        revalidatePath("/wallet", 'page');
        revalidatePath("/enroller/wallet", 'page');
        return { success: true, message: "Transaction rejected." };
    } catch (error: any) {
        console.error("Error rejecting transaction: ", error);
        return { success: false, message: error.message || "Failed to reject transaction." };
    }
}

export async function updateTransactionStatus(data: { txnId: string, userId: string, amount: number, status: 'Approved' | 'Rejected', utr?: string }) {
  const { txnId, userId, amount, status, utr } = data;
  const transactionDoc = await firestore.collection("transactions").doc(txnId).get();
  const transactionData = transactionDoc.data();

  if (!transactionData) {
    throw new Error("Transaction not found");
  }

  if (status === 'Approved') {
    if (transactionData.type === 'Deposit') {
      return await approveDeposit(txnId, userId, amount);
    } else {
      return await approveWithdrawal(txnId, userId, amount, utr);
    }
  } else { // status === 'Rejected'
    return await rejectTransaction(txnId);
  }
}

export async function createTransaction(transactionData: {
  userId: string;
  userName: string;
  amount: number;
  type: "Deposit" | "Withdrawal";
  description: string;
  status: "Pending" | "Completed" | "Failed";
  utr?: string;
}) {
  try {
    const userRef = firestore.collection("users").doc(transactionData.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error("User not found.");
    }
    const customId = userDoc.data()?.customId;

    const transaction = {
      ...transactionData,
      customId: customId,
      date: new Date().toISOString(),
    };
    await firestore.collection("transactions").add(transaction);
    
    revalidatePath("/wallet", 'page');
    revalidatePath("/enroller/wallet", 'page');
    revalidatePath("/admin/transactions", 'page');

    return { success: true, message: "Transaction created successfully." };

  } catch (error: any) {
    console.error("Error creating transaction: ", error);
    return { success: false, message: error.message || "Failed to create transaction." };
  }
}

export async function deleteTransaction(transactionId: string) {
    const transactionRef = firestore.collection("transactions").doc(transactionId);

    try {
        await firestore.runTransaction(async (t) => {
            const transactionDoc = await t.get(transactionRef);
            if (!transactionDoc.exists) {
                throw new Error("Transaction not found.");
            }

            const transactionData = transactionDoc.data()!;
            const { userId, type, amount, status } = transactionData as { userId: string, type: 'Deposit' | 'Withdrawal' | 'Referral Bonus', amount: number, status: string };

            const userRef = firestore.collection("users").doc(userId);

            if (status === 'Completed') {
                if (type === 'Deposit') {
                    const userDoc = await t.get(userRef);
                    const userData = userDoc.data();
                    
                    t.update(userRef, { 
                        depositBalance: FieldValue.increment(-amount),
                        totalDeposits: FieldValue.increment(-amount)
                    });

                    // Check if this deposit had triggered a bonus that needs to be reverted
                    if (userData?.commissionPaid && userData?.enrollerId) {
                        const enrollerQuery = firestore.collection('users').where('customId', '==', userData.enrollerId).limit(1);
                        const enrollerSnapshot = await t.get(enrollerQuery);

                        if (!enrollerSnapshot.empty) {
                            const enrollerDoc = enrollerSnapshot.docs[0];
                            const bonusTransactionQuery = firestore.collection('transactions')
                                .where('type', '==', 'Referral Bonus')
                                .where('description', '>=', `Referral bonus for user ${userData.name} (${userData.customId || userId})`)
                                .where('description', '<', `Referral bonus for user ${userData.name} (${userData.customId || userId})` + '\uf8ff')
                                .limit(1);

                            const bonusTxSnapshot = await t.get(bonusTransactionQuery);
                            if(!bonusTxSnapshot.empty) {
                                const bonusTxDoc = bonusTxSnapshot.docs[0];
                                const bonusAmount = bonusTxDoc.data().amount;

                                // Revert enroller's balance and delete bonus transaction
                                t.update(enrollerDoc.ref, { commissionBalance: FieldValue.increment(-bonusAmount) });
                                t.delete(bonusTxDoc.ref);
                                
                                // Reset user's commission status
                                t.update(userRef, { commissionPaid: false });
                            }
                        }
                    }

                } else if (type === 'Withdrawal') {
                    const userData = (await t.get(userRef)).data();
                    if (userData?.role === 'Enroller') {
                         t.update(userRef, { 
                            commissionBalance: FieldValue.increment(amount),
                            totalWithdrawals: FieldValue.increment(-amount)
                        });
                    } else {
                         t.update(userRef, { 
                            winningBalance: FieldValue.increment(amount),
                            totalWithdrawals: FieldValue.increment(-amount)
                        });
                    }
                }
            }
            
            t.delete(transactionRef);
        });

        revalidatePath('/admin/transactions', 'page');
        revalidatePath('/admin/cash-ledger', 'page');
        revalidatePath('/wallet', 'page');
        revalidatePath('/enroller/users', 'page');
        revalidatePath('/enroller/wallet', 'page');
        
        return { success: true, message: "Transaction deleted and all associated balances reverted." };

    } catch (error: any) {
        console.error("Error deleting transaction:", error);
        throw new Error(error.message || "Failed to delete transaction.");
    }
}
    

    
