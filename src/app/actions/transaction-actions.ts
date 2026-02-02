
'use server';

import { firestore } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { getPaymentSettings } from "./payment-settings-actions";

export async function grantCredit(userId: string, amount: number, remarks: string) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid userId or amount provided.');
  }

  if (!firestore) {
    throw new Error("Firestore is not initialized.");
  }
  const userRef = firestore.collection('users').doc(userId);
  const transactionRef = firestore.collection('transactions').doc();

  try {
    const settings = await getPaymentSettings();
    const depositFeePercentage = parseFloat(String(settings?.depositFeePercentage)) || 0;
    const fee = (amount * depositFeePercentage) / 100;
    const netAmount = amount - fee;

    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found.');
      }
      const userData = userDoc.data();
      if (!userData) {
        throw new Error('User data is missing.');
      }

      // User owes the full amount.
      transaction.update(userRef, {
        creditBalance: FieldValue.increment(amount),
        // But only the net amount after fee is playable.
        depositBalance: FieldValue.increment(netAmount),
      });

      // Record the transaction with fee details.
      transaction.set(transactionRef, {
        userId: userId,
        userName: userData.name || 'Unknown User',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        type: 'Credit',
        method: 'MANUAL',
        status: 'Completed',
        description: remarks || 'Admin credit grant',
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
      message: `Successfully granted ₹${amount} credit to the user. A fee of ₹${fee.toFixed(2)} was applied, and ₹${netAmount.toFixed(2)} was added to the deposit balance.`,
    };

  } catch (error: any) {
    console.error('Grant credit failed:', error);
    throw new Error(error.message || 'An unexpected error occurred during the transaction.');
  }
}

export async function manualDeposit(userId: string, amount: number, remarks: string) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid userId or amount provided.');
  }

  if (!firestore) {
    throw new Error("Firestore is not initialized.");
  }
  const userRef = firestore.collection('users').doc(userId);

  try {
    const settings = await getPaymentSettings();
    const depositFeePercentage = parseFloat(String(settings?.depositFeePercentage)) || 0;
    const fee = (amount * depositFeePercentage) / 100;
    const netAmount = amount - fee;

    let message = '';
    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found.');
      const userData = userDoc.data()!;

      const currentCredit = userData.creditBalance || 0;
      let amountToRepay = 0;
      let amountToDeposit = netAmount; // Use netAmount for calculations

      if (currentCredit > 0) {
        amountToRepay = Math.min(netAmount, currentCredit);
        amountToDeposit = netAmount - amountToRepay;

        if (amountToRepay > 0) {
            transaction.update(userRef, { 
                creditBalance: FieldValue.increment(-amountToRepay)
            });
            if (!firestore) {
                throw new Error("Firestore is not initialized.");
            }
            const creditRepayTxRef = firestore.collection('transactions').doc();
            transaction.set(creditRepayTxRef, {
                userId, userName: userData.name, type: 'Credit Repayment', 
                amount: amountToRepay, status: 'Completed', date: new Date().toISOString(),
                description: `Repaid from manual deposit.`
            });
        }
      }

      if (amountToDeposit > 0) {
          transaction.update(userRef, { depositBalance: FieldValue.increment(amountToDeposit) });
      }
      if (!firestore) {
        throw new Error("Firestore is not initialized.");
      }
      const depositTxRef = firestore.collection('transactions').doc();
      transaction.set(depositTxRef, {
          userId, userName: userData.name, type: 'Deposit', amount, 
          fee: fee,
          netAmount: netAmount,
          method: 'MANUAL', status: 'Completed', date: new Date().toISOString(),
          description: remarks
      });
      
      message = `Deposited ₹${amount} (Net: ₹${netAmount}). ` + (amountToRepay > 0 ? `₹${amountToRepay} was used to repay credit. ` : '') + `Balance updated.`;
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/transactions');

    return { success: true, message };

  } catch (error: any) {
    console.error('Manual deposit failed:', error);
    throw new Error(error.message || 'An unexpected error occurred.');
  }
}

export async function manualWithdrawal(userId: string, amount: number, remarks: string) {
  if (!userId || !amount || amount <= 0) {
    throw new Error('Invalid userId or amount provided.');
  }

  if (!firestore) {
    throw new Error("Firestore is not initialized.");
  }
  const userRef = firestore.collection('users').doc(userId);
  const transactionRef = firestore.collection('transactions').doc();

  try {
    const settings = await getPaymentSettings();
    const withdrawalFeePercentage = parseFloat(String(settings?.withdrawalFeePercentage)) || 0;
    const fee = (amount * withdrawalFeePercentage) / 100;
    const netAmount = amount - fee;

    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found.');
      }
      const userData = userDoc.data();
      if (!userData) {
        throw new Error('User data is missing.');
      }

      if (userData.winningBalance < amount) {
        throw new Error('Insufficient winning balance for this withdrawal.');
      }

      transaction.update(userRef, {
        winningBalance: FieldValue.increment(-amount),
      });

      transaction.set(transactionRef, {
        userId: userId,
        userName: userData.name || 'Unknown User',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        type: 'Withdrawal',
        method: 'CASH',
        status: 'Completed',
        description: remarks || 'Admin manual withdrawal',
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
      message: `Withdrew ₹${amount}. Fee: ₹${fee.toFixed(2)}. Net Paid: ₹${netAmount.toFixed(2)}. Balance updated.`,
    };

  } catch (error: any) {
    console.error('Manual withdrawal failed:', error);
    throw new Error(error.message || 'An unexpected error occurred during the transaction.');
  }
}

export async function createTransaction(data: {
    userId: string;
    userName: string;
    amount: number;
    type: 'Deposit' | 'Withdrawal';
    status: 'Pending';
    description: string;
    utr?: string;
    fee?: number;
    netAmount?: number;
}) {
    const { userId, userName, amount, type, status, description, utr } = data;

    if (!userId || !amount || amount <= 0) {
        throw new Error('Invalid data provided for transaction.');
    }
    
    if (type === 'Deposit' && !utr) {
        throw new Error('UTR is required for deposit transactions.');
    }

    if (!firestore) {
      throw new Error("Firestore is not initialized.");
    }
    const userRef = firestore.collection('users').doc(userId);
    const transactionRef = firestore.collection('transactions').doc();

    try {
        const settings = await getPaymentSettings();
        let fee = 0;
        let netAmount = amount;

        if (type === 'Deposit') {
            const depositFeePercentage = settings?.depositFeePercentage || 0;
            fee = (amount * depositFeePercentage) / 100;
            netAmount = amount - fee;
        } else if (type === 'Withdrawal') {
            const withdrawalFeePercentage = settings?.withdrawalFeePercentage || 0;
            fee = (amount * withdrawalFeePercentage) / 100;
            netAmount = amount - fee;
        }

        if (type === 'Withdrawal') {
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                throw new Error('User not found.');
            }
            const userData = userDoc.data();
            if (!userData || userData.winningBalance < amount) {
                throw new Error('Insufficient winning balance for this withdrawal request.');
            }
        }

        await transactionRef.set({
            userId,
            userName,
            amount,
            type,
            status,
            utr: utr || null,
            method: type === 'Deposit' ? 'UPI' : 'Bank/UPI',
            description,
            fee,
            netAmount,
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

export async function updateTransactionStatus(transactionId: string, status: 'Completed' | 'Rejected') {
    if (!transactionId || !status) {
        throw new Error('Invalid transactionId or status provided.');
    }

    if (!firestore) {
      throw new Error("Firestore is not initialized.");
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
            if (!firestore) {
                throw new Error("Firestore is not initialized.");
            }
            const userRef = firestore.collection('users').doc(transactionData.userId);
            
            if (status === 'Completed') {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User associated with the transaction not found.');
                }
                const userData = userDoc.data()!;

                if (transactionData.type === 'Withdrawal') {
                    const withdrawalAmount = transactionData.amount;
                    if (userData.winningBalance < withdrawalAmount) {
                        throw new Error("User has insufficient winning balance for this withdrawal.");
                    }
                    t.update(userRef, { winningBalance: FieldValue.increment(-withdrawalAmount) });

                } else if (transactionData.type === 'Deposit') {
                    const netDepositAmount = transactionData.netAmount;
                    const currentCredit = userData.creditBalance || 0;
                    let amountToRepay = 0;
                    let amountToDeposit = netDepositAmount;

                    if (currentCredit > 0) {
                        amountToRepay = Math.min(netDepositAmount, currentCredit);
                        amountToDeposit = netDepositAmount - amountToRepay;

                        if (amountToRepay > 0) {
                            t.update(userRef, { 
                                creditBalance: FieldValue.increment(-amountToRepay)
                            });
                            if (!firestore) {
                                throw new Error("Firestore is not initialized.");
                            }
                            const creditRepayTxRef = firestore.collection('transactions').doc();
                            t.set(creditRepayTxRef, {
                                userId: transactionData.userId, userName: userData.name, type: 'Credit Repayment', 
                                amount: amountToRepay, status: 'Completed', date: new Date().toISOString(),
                                description: `Repaid from user deposit (UTR: ${transactionData.utr}).`
                            });
                        }
                    }

                    if (amountToDeposit > 0) {
                        t.update(userRef, { depositBalance: FieldValue.increment(amountToDeposit) });
                    }
                }
            }
            
            t.update(transactionRef, {
                status: status,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        revalidatePath('/admin/transactions');
        revalidatePath('/wallet');
        revalidatePath('/admin/users');

        return {
            success: true,
            message: `Transaction has been successfully ${status.toLowerCase()}.`
        };

    } catch (error: any) {
        console.error('Update transaction status failed:', error);
        throw new Error(error.message || 'An unexpected error occurred.');
    }
}

export async function deleteTransaction(transactionId: string) {
    if (!transactionId) {
        throw new Error('Transaction ID is required.');
    }

    if (!firestore) {
      throw new Error("Firestore is not initialized.");
    }
    const transactionRef = firestore.collection('transactions').doc(transactionId);

    try {
        await firestore.runTransaction(async (t) => {
            const transDoc = await t.get(transactionRef);
            if (!transDoc.exists) {
                return;
            }
            
            const transactionData = transDoc.data();
            if (!transactionData) return;

            if (transactionData.status === 'Completed') {
                if (!firestore) {
                    throw new Error("Firestore is not initialized.");
                }
                const userRef = firestore.collection('users').doc(transactionData.userId);
                if (transactionData.type === 'Deposit') {
                    // Fallback for older transactions that may not have netAmount
                    const amountToRevert = transactionData.netAmount ?? transactionData.amount;
                    if (typeof amountToRevert === 'number') {
                        t.update(userRef, { depositBalance: FieldValue.increment(-amountToRevert) });
                    }
                } else if (transactionData.type === 'Withdrawal') {
                     if (typeof transactionData.amount === 'number') {
                        t.update(userRef, { winningBalance: FieldValue.increment(transactionData.amount) });
                    }
                }
            }

            t.delete(transactionRef);
        });
        
        revalidatePath('/admin/transactions');
        revalidatePath('/wallet');
        revalidatePath('/admin/users');

        return {
            success: true,
            message: 'Transaction record successfully deleted and balance reverted if applicable.',
        };
    } catch (error: any) {
        console.error('Delete transaction failed:', error);
        throw new Error(error.message || 'Failed to delete the transaction.');
    }
}
