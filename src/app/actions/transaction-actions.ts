
'use server';

import { firestore, app } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";

// Action to approve a deposit transaction
export async function approveDeposit(transactionId: string, userId: string, amount: number) {
  const transactionRef = firestore.collection("transactions").doc(transactionId);
  const userRef = firestore.collection("users").doc(userId);

  try {
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

    // Revalidation paths
    revalidatePath("/admin/transactions", 'page');
    revalidatePath("/admin/cash-ledger", 'page');
    revalidatePath("/admin/users/" + userId, 'page');
    revalidatePath("/wallet", 'page');

    return { success: true, message: "Deposit approved." };

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
            const { winningBalance } = userData;

            if ((winningBalance || 0) < amount) {
                throw new Error(`User has insufficient winning balance for this withdrawal. Current: ${winningBalance || 0}, Required: ${amount}`);
            }
            t.update(userRef, {
                winningBalance: FieldValue.increment(-amount),
                totalWithdrawals: FieldValue.increment(amount)
            });
            
            const updateData: {status: string, utr?: string} = { status: "Completed" };
            if (utr) {
                updateData.utr = utr;
            }
            t.update(transactionRef, updateData);
        });

        revalidatePath("/admin/transactions", 'page');
        revalidatePath("/admin/cash-ledger", 'page');
        revalidatePath("/admin/users/" + userId, 'page');
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
        return { success: true, message: "Transaction rejected." };
    } catch (error: any) {
        console.error("Error rejecting transaction: ", error);
        return { success: false, message: error.message || "Failed to reject transaction." };
    }
}

export async function updateTransactionStatus(data: { txnId: string, status: 'Approved' | 'Rejected', utr?: string }) {
  const { txnId, status, utr } = data;
  const transactionDoc = await firestore.collection("transactions").doc(txnId).get();
  const transactionData = transactionDoc.data();

  if (!transactionData) {
    throw new Error("Transaction not found");
  }
  
  const { userId, amount, type } = transactionData;

  if (status === 'Approved') {
    if (type === 'Deposit') {
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
                    t.update(userRef, { 
                        depositBalance: FieldValue.increment(-amount),
                        totalDeposits: FieldValue.increment(-amount)
                    });
                } else if (type === 'Withdrawal') {
                    t.update(userRef, { 
                        winningBalance: FieldValue.increment(amount),
                        totalWithdrawals: FieldValue.increment(-amount)
                    });
                }
            }
            
            t.delete(transactionRef);
        });

        revalidatePath('/admin/transactions', 'page');
        revalidatePath('/admin/cash-ledger', 'page');
        revalidatePath('/wallet', 'page');
        
        return { success: true, message: "Transaction deleted and all associated balances reverted." };

    } catch (error: any) {
        console.error("Error deleting transaction:", error);
        throw new Error(error.message || "Failed to delete transaction.");
    }
}
