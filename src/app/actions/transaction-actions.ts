
"use server";

import { firestore } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";

// Action to create a new transaction (e.g., for a deposit or withdrawal request)
export async function createTransaction(transactionData: {
  userId: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  status: "Pending" | "Completed" | "Failed";
  utr?: string;
}) {
  try {
    const transaction = {
      ...transactionData,
      // Map credit/debit to more descriptive types
      type: transactionData.type === 'credit' ? 'Deposit' : 'Withdrawal',
      date: new Date().toISOString(),
    };
    await firestore.collection("transactions").add(transaction);
    
    revalidatePath("/wallet");
    revalidatePath("/admin/transactions");

    return { success: true, message: "Transaction created successfully." };

  } catch (error: any) {
    console.error("Error creating transaction: ", error);
    return { success: false, message: error.message || "Failed to create transaction." };
  }
}

// Action for an admin to approve a deposit transaction
export async function approveDeposit(transactionId: string, userId: string, amount: number) {
  const transactionRef = firestore.collection("transactions").doc(transactionId);
  const userRef = firestore.collection("users").doc(userId);

  try {
    await firestore.runTransaction(async (t) => {
      // No need to read the user doc for deposits, just increment
      t.update(transactionRef, { status: "Completed" });
      t.update(userRef, {
         depositBalance: FieldValue.increment(amount),
         balance: FieldValue.increment(amount) 
        });
    });

    revalidatePath("/admin/transactions");
    revalidatePath("/admin/users/" + userId);
    revalidatePath("/wallet");

    return { success: true, message: "Deposit approved and balance updated." };

  } catch (error: any) {
    console.error("Error approving deposit: ", error);
    return { success: false, message: error.message || "Failed to approve deposit." };
  }
}

// Action for an admin to approve a withdrawal transaction
export async function approveWithdrawal(transactionId: string, userId: string, amount: number) {
    const transactionRef = firestore.collection("transactions").doc(transactionId);
    const userRef = firestore.collection("users").doc(userId);

    try {
        await firestore.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }

            const userData = userDoc.data()!;
            const currentWinningBalance = userData.winningBalance || 0;

            if (currentWinningBalance < amount) {
                throw new Error("User has insufficient winning balance for this withdrawal.");
            }
            
            // 1. Update the transaction status
            t.update(transactionRef, { status: "Completed" });

            // 2. Decrement the user's balances
            t.update(userRef, {
                winningBalance: FieldValue.increment(-amount),
                balance: FieldValue.increment(-amount),
            });
        });

        revalidatePath("/admin/transactions");
        revalidatePath("/admin/users/" + userId);
        revalidatePath("/wallet");

        return { success: true, message: "Withdrawal approved and balance updated." };

    } catch (error: any) {
        console.error("Error approving withdrawal: ", error);
        // If the transaction fails, mark the transaction as 'Failed'
        await transactionRef.update({ status: "Failed", failureReason: error.message });
        return { success: false, message: error.message || "Failed to approve withdrawal." };
    }
}

// Action for an admin to reject a transaction (deposit or withdrawal)
export async function rejectTransaction(transactionId: string) {
    try {
        await firestore.collection("transactions").doc(transactionId).update({ status: 'Failed' });

        revalidatePath('/admin/transactions');

        return { success: true, message: "Transaction rejected." };

    } catch (error: any) {
        console.error("Error rejecting transaction: ", error);
        return { success: false, message: error.message || "Failed to reject transaction." };
    }
}
