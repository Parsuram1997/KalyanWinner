

'use server';

import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { getPaymentSettings } from "./payment-settings-actions";

/**
 * Manually deposits a specified amount into a user's account.
 * This is an admin-only operation.
 *
 * @param userId - The ID of the user to deposit funds for.
 * @param amount - The numerical amount to deposit.
 * @param remarks - A string comment or note about the transaction.
 * @returns An object indicating the success status and a message.
 */
export async function manualDeposit(userId: string, amount: number, remarks: string) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid userId or amount provided.');
  }

  const userRef = firestore.collection('users').doc(userId);
  const transactionRef = firestore.collection('transactions').doc();

  try {
    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found.');
      }
      const userData = userDoc.data();
      if (!userData) {
        throw new Error('User data is missing.');
      }


      // Increment the user's deposit balance
      transaction.update(userRef, {
        depositBalance: FieldValue.increment(amount),
      });

      // Create a record of the transaction
      transaction.set(transactionRef, {
        userId: userId,
        userName: userData.name || 'Unknown User',
        amount: amount,
        type: 'Deposit',
        method: 'MANUAL',
        status: 'Completed',
        description: remarks || 'Admin manual deposit',
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/transactions');

    return {
      success: true,
      message: `Successfully deposited ₹${amount} for the user.`,
    };

  } catch (error: any) {
    console.error('Manual deposit failed:', error);
    throw new Error(error.message || 'An unexpected error occurred during the transaction.');
  }
}

/**
 * Updates the status of a transaction, handling balance changes for withdrawals.
 * This is an admin-only operation.
 *
 * @param transactionId - The ID of the transaction to update.
 * @param status - The new status: 'COMPLETED' or 'REJECTED'.
 * @returns An object indicating the success status and a message.
 */
export async function updateTransactionStatus(transactionId: string, status: 'Completed' | 'Rejected') {
    if (!transactionId || !status) {
        throw new Error('Invalid transactionId or status provided.');
    }

    const transactionRef = firestore.collection('transactions').doc(transactionId);

    try {
        await firestore.runTransaction(async (t) => {
            const transDoc = await t.get(transactionRef);
            if (!transDoc.exists) {
                throw new Error('Transaction not found.');
            }

            const transactionData = transDoc.data();
            if (!transactionData || transactionData.status !== 'Pending') {
                 throw new Error('Only PENDING requests can be updated.');
            }

            const userRef = firestore.collection('users').doc(transactionData.userId);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User associated with the transaction not found.');
            }
            
            const userData = userDoc.data();
            if (!userData) {
                throw new Error("Could not retrieve user data.");
            }
            
            const settings = await getPaymentSettings();

            if (transactionData.type === 'Withdrawal') {
                 if (status === 'Completed') {
                    const feePercentage = settings?.withdrawalFeePercentage || 0;
                    const feeAmount = transactionData.amount * (feePercentage / 100);
                    const totalDeduction = transactionData.amount; // User gets full amount, fee is deducted extra

                    if (userData.winningBalance < totalDeduction + feeAmount) {
                        throw new Error("User has insufficient winning balance for this withdrawal including fees.");
                    }
                    t.update(userRef, { winningBalance: FieldValue.increment(-(totalDeduction + feeAmount)) });
                }
            } else if (transactionData.type === 'Deposit') {
                if (status === 'Completed') {
                    const feePercentage = settings?.depositFeePercentage || 0;
                    const feeAmount = transactionData.amount * (feePercentage / 100);
                    const netAmount = transactionData.amount - feeAmount;

                    t.update(userRef, { depositBalance: FieldValue.increment(netAmount) });
                }
            }
            
            t.update(transactionRef, {
                status: status,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        revalidatePath('/admin/transactions');
        revalidatePath('/wallet');
        revalidatePath(`/admin/users/${transactionRef.path.split('/')[1]}`);
        
        return {
            success: true,
            message: `Transaction has been successfully ${status.toLowerCase()}.`
        };

    } catch (error: any) {
        console.error('Update transaction status failed:', error);
        throw new Error(error.message || 'An unexpected error occurred.');
    }
}


/**
 * Deletes a transaction record from Firestore.
 * IMPORTANT: This action is destructive and does NOT reverse any balance changes.
 * It only removes the transaction record.
 *
 * @param transactionId - The ID of the transaction to delete.
 * @returns An object indicating the success status and a message.
 */
export async function deleteTransaction(transactionId: string) {
    if (!transactionId) {
        throw new Error('Transaction ID is required.');
    }

    const transactionRef = firestore.collection('transactions').doc(transactionId);

    try {
        await transactionRef.delete();
        
        revalidatePath('/admin/transactions');

        return {
            success: true,
            message: 'Transaction record successfully deleted.',
        };
    } catch (error: any) {
        console.error('Delete transaction failed:', error);
        throw new Error(error.message || 'Failed to delete the transaction.');
    }
}

/**
 * Creates a new transaction record for a user deposit request.
 *
 * @param data - The data for the new transaction.
 * @returns An object indicating the success status and a message.
 */
export async function createTransaction(data: {
    userId: string;
    userName: string;
    amount: number;
    type: 'Deposit' | 'Withdrawal';
    status: 'Pending';
    description: string;
    utr?: string;
}) {
    const { userId, userName, amount, type, status, description, utr } = data;

    if (!userId || !amount || amount <= 0) {
        throw new Error('Invalid data provided for transaction.');
    }
    
    if (type === 'Deposit' && !utr) {
        throw new Error('UTR is required for deposit transactions.');
    }

    const transactionRef = firestore.collection('transactions').doc();

    try {
        await transactionRef.set({
            userId,
            userName,
            amount,
            type,
            status,
            utr: utr || null,
            method: type === 'Deposit' ? 'UPI' : 'Bank/UPI',
            description,
            date: new Date().toISOString(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath('/admin/transactions');
        revalidatePath('/wallet');

        return {
            success: true,
            message: 'Request submitted successfully.',
        };
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        throw new Error(error.message || 'An unexpected error occurred while creating the transaction.');
    }
}

    