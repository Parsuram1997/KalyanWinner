
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Type for a single transaction
type Transaction = {
    id: string;
    amount: number;
    type: 'Referral Bonus';
    status: 'Completed';
    description: string;
    date: string; // Date is stored as an ISO string
}

export default function EnrollerWalletPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollerDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: enrollerData, isLoading: isEnrollerLoading } = useDoc<any>(enrollerDocRef);

  const bonusTransactionsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, "transactions"),
            where("userId", "==", user.uid),
            where("type", "==", "Referral Bonus"),
            orderBy("date", "desc")
          )
        : null,
    [firestore, user]
  );

  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(bonusTransactionsQuery, { skip: !firestore || !user });

  const isLoading = isUserLoading || isEnrollerLoading || areTransactionsLoading;
  const commissionBalance = enrollerData?.commissionBalance || 0;
  
  const recentTransactions = useMemo(() => transactions?.slice(0, 20) || [], [transactions]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-6 w-6" />My Referral Bonus</CardTitle>
                <CardDescription>View your referral bonus earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-gradient-to-br from-green-500/10 to-accent/10">
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm font-medium">Available Bonus</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         {isLoading ? (
                            <Skeleton className="h-10 w-48" />
                        ) : (
                            <div className="text-3xl font-bold font-mono text-green-600">₹{commissionBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        )}
                    </CardContent>
                </Card>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Withdrawal Information</AlertTitle>
                    <AlertDescription>
                        The ability to withdraw your bonus is coming soon! We are working on setting up a secure and easy withdrawal process for our enrollers.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Recent Bonus Activity</h3>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
                 {isLoading ? (
                     <div className="space-y-2 p-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                     </div>
                 ) : recentTransactions.length > 0 ? (
                    <div className="border-t sm:border rounded-md">
                        {recentTransactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> 
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-medium">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.date).toLocaleString()} 
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className={`font-mono text-sm font-semibold text-green-600`}>
                                        +₹{tx.amount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-sm text-muted-foreground p-8">
                       You have no recent bonus activity.
                    </p>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}
