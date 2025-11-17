
'use server';

import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

type UpdateTransactionStatusParams = {
    txnId: string;
    userId: string;
    amount: number;
    status: 'Approved' | 'Rejected';
}

export async function updateTransactionStatus(params: UpdateTransactionStatusParams) {
    const { txnId, userId, amount, status } = params;

    const transactionRef = firestore.collection('transactions').doc(txnId);
    const userRef = firestore.collection('users').doc(userId);

    // Use a transaction to ensure atomicity
    await firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new Error("User not found.");
        }

        const transactionDoc = await transaction.get(transactionRef);
        if (!transactionDoc.exists || transactionDoc.data()?.status !== 'Pending') {
            throw new Error("Transaction is not pending or does not exist.");
        }
        
        const txnData = transactionDoc.data();
        let finalStatus: 'Completed' | 'Rejected' = 'Rejected';
        
        if (status === 'Approved') {
            finalStatus = 'Completed';
            if (txnData?.type === 'Deposit') {
                 transaction.update(userRef, { balance: FieldValue.increment(amount) });
            } else if (txnData?.type === 'Withdrawal') {
                 transaction.update(userRef, { balance: FieldValue.increment(-amount) });
            }
        } else { // Rejected
             if (txnData?.type === 'Withdrawal') {
                // Return funds to user if withdrawal is rejected
                transaction.update(userRef, { balance: FieldValue.increment(amount) });
            }
            // No balance change if deposit is rejected.
        }

        // Update transaction status
        transaction.update(transactionRef, { status: finalStatus });
    });

    // Revalidate the path to refresh the data on the client
    revalidatePath('/admin/transactions');
}
