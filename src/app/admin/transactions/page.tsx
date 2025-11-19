
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
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { updateTransactionStatus } from "@/app/actions/transaction-actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
    id: string;
    userId: string;
    userName: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    status: "Pending" | "Approved" | "Rejected" | "Completed";
    date: string;
    utr?: string;
}

const TransactionTable = ({ items, isLoading, onAction }: { items: Transaction[], isLoading: boolean, onAction: () => void }) => {
    const { toast } = useToast();

    const handleAction = async (txnId: string, userId: string, amount: number, newStatus: 'Approved' | 'Rejected') => {
        try {
            await updateTransactionStatus({ txnId, userId, amount, status: newStatus });
            toast({
                title: "Transaction Updated",
                description: `Transaction has been ${newStatus.toLowerCase()}.`,
            });
            onAction(); // This will trigger a re-fetch in the parent if needed, although Firestore listener should handle it.
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
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }
    
    if (items.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No transactions found.</p>
    }

  return (
    <div>
        {/* Desktop Table */}
        <div className="hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>UTR/Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((txn) => (
                        <TableRow key={txn.id}>
                            <TableCell>
                                <div>{txn.userName}</div>
                                <div className="text-xs text-muted-foreground">{txn.userId}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={txn.type === "Deposit" ? "secondary" : "outline"}>
                                    {txn.type}
                                </Badge>
                            </TableCell>
                            <TableCell>₹{txn.amount.toFixed(2)}</TableCell>
                            <TableCell>{new Date(txn.date).toLocaleString()}</TableCell>
                            <TableCell>{txn.utr || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={txn.status === "Approved" || txn.status === "Completed" ? "default" : txn.status === "Pending" ? "secondary" : "destructive"}>
                                    {txn.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-2">
                                {txn.status === "Pending" && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => handleAction(txn.id, txn.userId, txn.amount, 'Approved')}>Approve</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleAction(txn.id, txn.userId, txn.amount, 'Rejected')}>Reject</Button>
                                    </>
                                )}
                                {txn.status !== "Pending" && (
                                    <Button variant="ghost" size="sm" disabled>Processed</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-4 md:hidden">
            {items.map((txn) => (
                <Card key={txn.id} className="p-4">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{txn.userName}</p>
                            <p className="text-xs text-muted-foreground">{txn.id} - {new Date(txn.date).toLocaleDateString()}</p>
                        </div>
                         <Badge variant={txn.status === "Approved" || txn.status === "Completed" ? "default" : txn.status === "Pending" ? "secondary" : "destructive"}>
                            {txn.status}
                        </Badge>
                    </div>
                     <div className="mt-4 space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant={txn.type === "Deposit" ? "secondary" : "outline"} className="font-medium">
                                {txn.type}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">₹{txn.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">UTR:</span>
                            <span className="font-mono text-xs">{txn.utr || 'N/A'}</span>
                        </div>
                    </div>

                    {txn.status === "Pending" && (
                        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                            <Button variant="outline" size="sm" onClick={() => handleAction(txn.id, txn.userId, txn.amount, 'Approved')}>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleAction(txn.id, txn.userId, txn.amount, 'Rejected')}>Reject</Button>
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

  const transactionsQuery = useMemoFirebase(
    () => firestore 
            ? query(collection(firestore, 'transactions'), orderBy('date', 'desc')) 
            : null,
    [firestore]
  );
  const { data: transactions, isLoading, error } = useCollection<Transaction>(transactionsQuery);

  const pendingDeposits = useMemo(() => transactions?.filter(t => t.type === 'Deposit' && t.status === 'Pending') || [], [transactions]);
  const pendingWithdrawals = useMemo(() => transactions?.filter(t => t.type === 'Withdrawal' && t.status === 'Pending') || [], [transactions]);
  const processedTransactions = useMemo(() => transactions?.filter(t => t.status !== 'Pending') || [], [transactions]);

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Approve or reject user deposits and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending-deposits">
                <div className="border rounded-lg p-2 mb-4">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-transparent p-0">
                      <TabsTrigger value="pending-deposits">Deposits ({pendingDeposits.length})</TabsTrigger>
                      <TabsTrigger value="pending-withdrawals">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
                      <TabsTrigger value="processed">Processed ({processedTransactions.length})</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="pending-deposits">
                    <TransactionTable items={pendingDeposits} isLoading={isLoading} onAction={() => {}} />
                </TabsContent>
                <TabsContent value="pending-withdrawals">
                    <TransactionTable items={pendingWithdrawals} isLoading={isLoading} onAction={() => {}} />
                </TabsContent>
                <TabsContent value="processed">
                    <TransactionTable items={processedTransactions} isLoading={isLoading} onAction={() => {}} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
