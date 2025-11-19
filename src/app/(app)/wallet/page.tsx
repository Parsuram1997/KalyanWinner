
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Type for user balance data
type UserBalance = {
    deposit: number;
    winning: number;
    balance: number;
}

// Type for a single transaction
type Transaction = {
    id: string;
    amount: number;
    type: 'Deposit' | 'Withdrawal';
    status: 'Pending' | 'Completed' | 'Failed';
    description: string;
    date: string; // Date is stored as an ISO string
}

const BalanceCard = ({ title, amount, isLoading }: { title: string, amount: number, isLoading: boolean }) => (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
        <p className="text-sm text-muted-foreground">{title}</p>
        {isLoading ? (
            <Skeleton className="h-7 w-24 mt-1" />
        ) : (
            <p className="text-2xl font-bold font-mono">₹{amount.toLocaleString('en-IN')}</p>
        )}
    </div>
);

const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return 'success';
        case 'Pending': return 'secondary';
        case 'Failed': return 'destructive';
        default: return 'default';
    }
}

export default function WalletPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    try {
        // Fetch balance
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            setBalance({
                deposit: data.depositBalance || 0,
                winning: data.winningBalance || 0,
                balance: data.balance || 0,
            });
        }

        // Fetch all transactions for the user (will be sorted on client)
        const transQuery = query(
            collection(firestore, "transactions"), 
            where("userId", "==", user.uid)
        );
        const transSnapshot = await getDocs(transQuery);
        const fetchedTransactions = transSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(fetchedTransactions);

    } catch (error) {
        console.error("Failed to fetch wallet data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, firestore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sort transactions on the client-side, exactly like the dashboard
  const sortedTransactions = useMemo(() => {
      return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const recentTransactions = useMemo(() => sortedTransactions.slice(0, 10), [sortedTransactions]);

  return (
    <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>My Wallet</CardTitle>
                <CardDescription>View your account balance and manage your funds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Balance Display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <BalanceCard title="Deposit Balance" amount={balance?.deposit ?? 0} isLoading={isLoading} />
                    <BalanceCard title="Winning Balance" amount={balance?.winning ?? 0} isLoading={isLoading} />
                    <BalanceCard title="Total Balance" amount={balance?.balance ?? 0} isLoading={isLoading} />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                   <Button asChild size="lg">
                        <Link href="/wallet/deposit">Make a Deposit</Link>
                   </Button>
                   <Button asChild size="lg" variant="outline">
                        <Link href="/wallet/withdraw">Request Withdrawal</Link>
                   </Button>
                </div>

                 {/* Recent Transactions */}
                <div className="space-y-2 pt-4">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                     {isLoading ? (
                         <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                         </div>
                     ) : recentTransactions.length > 0 ? (
                        <div className="border rounded-md">
                            {recentTransactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        {tx.type === 'Deposit' ? 
                                            <ArrowDownLeft className="h-5 w-5 text-green-500" /> : 
                                            <ArrowUpRight className="h-5 w-5 text-red-500" />
                                        }
                                        <div className="flex flex-col">
                                            <p className="font-medium">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(tx.date).toLocaleString()} 
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <p className={`font-mono font-semibold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'Deposit' ? '+' : '-'}{tx.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </p>
                                        <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-center text-sm text-muted-foreground p-4">
                           You have no recent activity.
                        </p>
                     )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
