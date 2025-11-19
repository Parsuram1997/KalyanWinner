
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
        const userData = userDoc.data()!;

        const transactionDoc = await transaction.get(transactionRef);
        if (!transactionDoc.exists || transactionDoc.data()?.status !== 'Pending') {
            throw new Error("Transaction is not pending or does not exist.");
        }
        
        const txnData = transactionDoc.data();
        let finalStatus: 'Completed' | 'Rejected' = status === 'Approved' ? 'Completed' : 'Rejected';
        
        if (status === 'Approved') {
            if (txnData?.type === 'Deposit') {
                 transaction.update(userRef, { balance: FieldValue.increment(amount) });

                 // Check for enroller commission logic
                 if (userData.enrollerId && !userData.commissionPaid && amount >= 500) {
                    const enrollerRef = firestore.collection('users').doc(userData.enrollerId);
                    const commissionAmount = 100;

                    // Credit enroller and create a commission transaction for them
                    transaction.update(enrollerRef, { balance: FieldValue.increment(commissionAmount) });
                    const commissionTxnRef = firestore.collection('transactions').doc(); // New transaction for enroller
                    transaction.set(commissionTxnRef, {
                        userId: userData.enrollerId,
                        amount: commissionAmount,
                        type: 'Commission',
                        status: 'Completed',
                        date: new Date().toISOString(),
                        description: `Commission for enrolling user ${userData.name} (${userData.customId})`,
                    });
                    
                    // Mark commission as paid for the user
                    transaction.update(userRef, { commissionPaid: true });
                 }
            } else if (txnData?.type === 'Withdrawal') {
                 // The balance for withdrawal is already decremented when the request is made by enroller/user
                 // So we don't need to do anything here for balance.
            }
        } else { // Rejected
             if (txnData?.type === 'Withdrawal') {
                // Return funds to user if withdrawal is rejected. Note: withdrawal amount is positive.
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

