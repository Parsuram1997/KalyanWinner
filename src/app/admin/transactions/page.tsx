
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, getDocs, DocumentData } from "firebase/firestore";
import { useMemo, useState, useEffect, useCallback } from "react";
import { approveDeposit, approveWithdrawal, rejectTransaction } from "@/app/actions/transaction-actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Define clear types for our data structures
type User = {
    id: string;
    name: string;
    customId: string;
}

type Transaction = {
    id: string;
    userId: string;
    type: "Deposit" | "Withdrawal"; // Simplified from previous version
    amount: number;
    status: "Pending" | "Completed" | "Failed";
    date: string;
    utr?: string;
    description?: string;
    failureReason?: string; // For displaying why a transaction failed
    userName?: string; 
    customId?: string; 
}

const TransactionTable = ({ items, isLoading, onAction }: { items: Transaction[], isLoading: boolean, onAction: () => void }) => {
    const { toast } = useToast();

    const handleAction = async (transaction: Transaction, action: 'approve' | 'reject') => {
        try {
            let result;
            if (action === 'approve') {
                if (transaction.type === 'Deposit') {
                    result = await approveDeposit(transaction.id, transaction.userId, transaction.amount);
                } else if (transaction.type === 'Withdrawal') {
                    result = await approveWithdrawal(transaction.id, transaction.userId, transaction.amount);
                } else {
                    toast({ variant: "destructive", title: "Unsupported Action", description: `Approving ${transaction.type} is not supported.`});
                    return;
                }
            } else { 
                result = await rejectTransaction(transaction.id);
            }

            if (result?.success) {
                 toast({
                    title: `Transaction ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                    description: result.message,
                });
                onAction(); 
            } else {
                throw new Error(result?.message || "An unknown error occurred.");
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update the transaction.",
            });
        }
    }
    
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
        )
    }
    
    if (items.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No transactions in this category.</p>
    }

  return (
    <div>
        <div className="hidden md:block border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount & Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((txn) => (
                        <TableRow key={txn.id}>
                            <TableCell className="py-2 font-medium">
                                <div>{txn.userName || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">{txn.customId || txn.userId}</div>
                            </TableCell>
                             <TableCell className="py-2">
                                <div className="font-mono">₹{txn.amount.toLocaleString('en-IN')}</div>
                                <Badge variant={txn.type === "Deposit" ? "default" : "outline"} className="text-xs">
                                    {txn.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-xs">{new Date(txn.date).toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-xs max-w-[150px] truncate" title={txn.utr || txn.description}>
                                {txn.utr || txn.description ||'N/A'}
                            </TableCell>
                           <TableCell className="py-2">
                                <Badge variant={txn.status === "Completed" ? "success" : txn.status === "Pending" ? "secondary" : "destructive"} title={txn.failureReason}>
                                    {txn.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-2 py-2">
                                {txn.status === "Pending" && (
                                    <>
                                        <Button variant="outline" size="xs" onClick={() => handleAction(txn, 'approve')}>Approve</Button>
                                        <Button variant="destructive" size="xs" onClick={() => handleAction(txn, 'reject')}>Reject</Button>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <div className="grid gap-4 md:hidden">
            {items.map((txn) => (
                <Card key={txn.id} className="p-4">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{txn.userName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{txn.customId || txn.userId}</p>
                             <p className="text-xs text-muted-foreground mt-1">{new Date(txn.date).toLocaleString()}</p>
                        </div>
                         <Badge variant={txn.status === "Completed" ? "success" : txn.status === "Pending" ? "secondary" : "destructive"} title={txn.failureReason}>
                            {txn.status}
                        </Badge>
                    </div>
                     <div className="mt-4 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant={txn.type === "Deposit" ? "default" : "outline"} className="font-medium">
                                {txn.type}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium font-mono">₹{txn.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Details:</span>
                            <span className="font-mono text-xs truncate" title={txn.utr || txn.description}>{txn.utr || txn.description || 'N/A'}</span>
                        </div>
                    </div>

                    {txn.status === "Pending" && (
                        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                            <Button variant="outline" size="sm" onClick={() => handleAction(txn, 'approve')}>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAction(txn, 'reject')}>Reject</Button>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    </div>
)
}

export default function TransactionsPage() {
  const firestore = useFirestore();
  const [key, setKey] = useState(0);

  const transactionsQuery = useMemoFirebase(
    () => firestore 
            ? query(collection(firestore, 'transactions'), orderBy('date', 'desc')) 
            : null,
    [firestore, key]
  );
  const { data: baseTransactions, isLoading: isTxnsLoading, error } = useCollection<Transaction>(transactionsQuery);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);

  useEffect(() => {
    const enrichTransactions = async () => {
        if (!baseTransactions || !firestore) {
            if (!isTxnsLoading) setIsEnriching(false);
            return;
        }

        setIsEnriching(true);
        const userIds = [...new Set(baseTransactions.map(t => t.userId))];
        
        if (userIds.length === 0) {
            setTransactions(baseTransactions);
            setIsEnriching(false);
            return;
        }

        const usersMap = new Map<string, { name: string, customId: string }>();
        const batches = [];
        for (let i = 0; i < userIds.length; i += 30) {
            batches.push(userIds.slice(i, i + 30));
        }

        try {
            await Promise.all(batches.map(async (batch) => {
                const usersQuery = query(collection(firestore, 'users'), where('id', 'in', batch));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => {
                    const user = doc.data() as User;
                    if(user.id && user.name) {
                       usersMap.set(user.id, { name: user.name, customId: user.customId });
                    }
                });
            }));
        } catch (e) {
            console.error("Failed to fetch user details:", e);
        }

        const enriched = baseTransactions.map(t => ({
            ...t,
            userName: usersMap.get(t.userId)?.name,
            customId: usersMap.get(t.userId)?.customId,
        }));

        setTransactions(enriched);
        setIsEnriching(false);
    };

    enrichTransactions();
  }, [baseTransactions, firestore, isTxnsLoading]);
  
  const forceRefresh = useCallback(() => setKey(prev => prev + 1), []);

  const pendingDeposits = useMemo(() => transactions?.filter(t => t.type === 'Deposit' && t.status === 'Pending') || [], [transactions]);
  const pendingWithdrawals = useMemo(() => transactions?.filter(t => t.type === 'Withdrawal' && t.status === 'Pending') || [], [transactions]);
  const processedTransactions = useMemo(() => transactions?.filter(t => t.status !== 'Pending') || [], [transactions]);

  const isLoading = isTxnsLoading || isEnriching;

  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Transactions</CardTitle>
          <CardDescription>Approve or reject deposits and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending-deposits">
                <div className="mb-4 rounded-lg border bg-background p-1 sm:p-2">
                  <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
                      <TabsTrigger value="pending-deposits">Deposits ({pendingDeposits.length})</TabsTrigger>
                      <TabsTrigger value="pending-withdrawals">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
                      <TabsTrigger value="processed">Processed ({processedTransactions.length})</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="pending-deposits">
                    <TransactionTable items={pendingDeposits} isLoading={isLoading} onAction={forceRefresh} />
                </TabsContent>
                <TabsContent value="pending-withdrawals">
                    <TransactionTable items={pendingWithdrawals} isLoading={isLoading} onAction={forceRefresh} />
                </TabsContent>
                <TabsContent value="processed">
                    <TransactionTable items={processedTransactions} isLoading={isLoading} onAction={forceRefresh} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
