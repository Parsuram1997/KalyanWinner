
"use client";

import { useMemo, useState } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { updateTransactionStatus, deleteTransaction } from "@/app/actions/transaction-actions";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Transaction = {
    id: string;
    userId: string;
    userName: string;
    customId?: string;
    type: "Deposit" | "Withdrawal";
    amount: number;
    status: "Pending" | "Approved" | "Rejected" | "Completed";
    date: string;
    utr?: string;
    description?: string;
}

type User = {
    id: string;
    customId: string;
    name: string;
    phoneNumber?: string;
    paymentMethod?: 'bank' | 'upi';
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
}

const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed':
        case 'Approved':
            return 'secondary';
        case 'Pending':
            return 'default';
        case 'Rejected':
            return 'warning';
        default:
            return 'destructive';
    }
}


const TransactionTable = ({ 
    items, 
    isLoading, 
    userIdToCustomIdMap, 
    onShowDetails,
    onConfirmAction,
    onDelete
}: { 
    items: Transaction[], 
    isLoading: boolean, 
    userIdToCustomIdMap: { [key: string]: string },
    onShowDetails: (userId: string) => void,
    onConfirmAction: (details: { txnId: string, newStatus: 'Approved' | 'Rejected', type: 'Deposit' | 'Withdrawal' }) => void,
    onDelete: (txn: Transaction) => void
}) => {
    if (isLoading) {
        return (
            <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }
    
    if (items.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No transactions found in this category.</p>
    }
    
    const getCustomId = (txn: Transaction) => {
        return txn.customId || userIdToCustomIdMap[txn.userId] || txn.userId;
    }

  return (
    <div>
        {/* Desktop View */}
        <div className="hidden md:block border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount & Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Details (UTR)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((txn) => (
                        <TableRow key={txn.id}>
                            <TableCell className="py-2 font-medium">
                                <div>{txn.userName || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">{getCustomId(txn)}</div>
                            </TableCell>
                             <TableCell className="py-2">
                                <div className={`font-mono ${txn.status === 'Rejected' ? 'text-yellow-600' : ''}`}>₹{txn.amount.toLocaleString('en-IN')}</div>
                                <Badge variant={txn.type === "Deposit" ? "default" : "outline"} className="text-xs">
                                    {txn.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-xs">{new Date(txn.date).toLocaleString()}</TableCell>
                            <TableCell className="py-2 text-xs max-w-[150px]">
                                {txn.type === 'Withdrawal' ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowDetails(txn.userId)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <span className="truncate" title={txn.utr || txn.description}>
                                        {txn.utr || txn.description || 'N/A'}
                                    </span>
                                )}
                            </TableCell>
                           <TableCell className="py-2">
                                <Badge variant={getStatusVariant(txn.status)}>
                                    {txn.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-2 py-2">
                                {txn.status === "Pending" && (
                                    <>
                                        <Button variant="outline" size="xs" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Approved', type: txn.type })}>Approve</Button>
                                        <Button variant="destructive" size="xs" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Rejected', type: txn.type })}>Reject</Button>
                                    </>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete this transaction and revert any associated balance changes if it was completed. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(txn)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="grid gap-4 md:hidden">
            {items.map((txn) => (
                <Card key={txn.id}>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm">{txn.userName || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{getCustomId(txn)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(txn.date).toLocaleString()}</p>
                            </div>
                            <Badge variant={getStatusVariant(txn.status)}>
                                {txn.status}
                            </Badge>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Type:</span>
                                <Badge variant={txn.type === "Deposit" ? "default" : "outline"} className="font-medium text-xs">
                                    {txn.type}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className={`font-medium font-mono ${txn.status === 'Rejected' ? 'text-yellow-600' : ''}`}>₹{txn.amount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Details:</span>
                                {txn.type === 'Withdrawal' ? (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowDetails(txn.userId)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <span className="font-mono text-xs truncate" title={txn.utr || txn.description}>
                                        {txn.utr || txn.description || 'N/A'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-2 p-4 pt-2 border-t">
                       {txn.status === "Pending" && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Approved', type: txn.type })}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Rejected', type: txn.type })}>Reject</Button>
                            </>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete this transaction and revert any associated balance changes if it was completed. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(txn)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
)}


export default function TransactionsPage() {
  const firestore = useFirestore();
  const [key, setKey] = useState(0); 
  const [paymentDetails, setPaymentDetails] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState<{ txnId: string, newStatus: 'Approved' | 'Rejected', type: 'Deposit' | 'Withdrawal' } | null>(null);
  const [utr, setUtr] = useState("");

  const transactionsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'transactions'), 
                where('type', 'in', ['Deposit', 'Withdrawal']),
                orderBy('date', 'desc')
              )
            : null,
    [firestore, key]
  );
  const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = useCollection<Transaction>(transactionsQuery, { skip: !firestore });
  
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: isUsersLoading, error: usersError } = useCollection<User>(usersQuery, { skip: !firestore });
  
  const userIdToCustomIdMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
        if (user && user.id && user.customId) {
            acc[user.id] = user.customId;
        }
        return acc;
    }, {} as { [key: string]: string });
  }, [users]);

  const forceRefresh = () => setKey(prev => prev + 1);

  const handleShowDetails = (userId: string) => {
      const user = users?.find(u => u.id === userId);
      if (user) {
          setPaymentDetails(user);
      }
  };

  const handleAction = async (txnId: string, newStatus: 'Approved' | 'Rejected', utrValue?: string) => {
    try {
        const result = await updateTransactionStatus({ txnId, status: newStatus, utr: utrValue });
        if (result && result.success) {
            toast({
                title: "Transaction Updated",
                description: `Transaction has been ${newStatus.toLowerCase()}.`,
            });
        } else {
            throw new Error(result?.message || "An unknown error occurred.");
        }
        forceRefresh();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not update the transaction.",
        });
    }
}

  const handleDelete = async (txn: Transaction) => {
      try {
          const result = await deleteTransaction(txn.id);
          if (result && result.success) {
              toast({
                  title: "Transaction Deleted",
                  description: result.message || "The transaction has been successfully deleted.",
              });
          } else {
              throw new Error(result?.message || "An unknown error occurred during deletion.");
          }
          forceRefresh();
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Deletion Failed",
              description: error.message || "Could not delete the transaction.",
          });
      }
  };


  const pendingDeposits = useMemo(() => transactions?.filter(t => t.type === 'Deposit' && t.status === 'Pending') || [], [transactions]);
  const pendingWithdrawals = useMemo(() => transactions?.filter(t => t.type === 'Withdrawal' && t.status === 'Pending') || [], [transactions]);
  const processedTransactions = useMemo(() => transactions?.filter(t => t.status !== 'Pending') || [], [transactions]);

  const isLoading = isTransactionsLoading || isUsersLoading;
  const error = transactionsError || usersError;

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
                <TabsContent value="pending-deposits" className="mt-0">
                    <TransactionTable items={pendingDeposits} isLoading={isLoading} userIdToCustomIdMap={userIdToCustomIdMap} onShowDetails={handleShowDetails} onConfirmAction={setConfirmation} onDelete={handleDelete} />
                </TabsContent>
                <TabsContent value="pending-withdrawals" className="mt-0">
                    <TransactionTable items={pendingWithdrawals} isLoading={isLoading} userIdToCustomIdMap={userIdToCustomIdMap} onShowDetails={handleShowDetails} onConfirmAction={setConfirmation} onDelete={handleDelete} />
                </TabsContent>
                <TabsContent value="processed" className="mt-0">
                    <TransactionTable items={processedTransactions} isLoading={isLoading} userIdToCustomIdMap={userIdToCustomIdMap} onShowDetails={handleShowDetails} onConfirmAction={setConfirmation} onDelete={handleDelete} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

        <Dialog open={!!paymentDetails} onOpenChange={() => setPaymentDetails(null)}>
            <DialogContent className="sm:max-w-[425px]">
                {paymentDetails && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Payment Details for {paymentDetails.name}</DialogTitle>
                            <DialogDescription>
                                User Custom ID: {paymentDetails.customId}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 text-sm">
                            <div className="grid grid-cols-2 items-center gap-4">
                                <span className="text-muted-foreground">Contact</span>
                                <span className="font-medium">
                                    {paymentDetails.phoneNumber ? (
                                        <a href={`tel:${paymentDetails.phoneNumber}`} className="text-blue-600 hover:underline">
                                            {paymentDetails.phoneNumber}
                                        </a>
                                    ) : (
                                        'Not Available'
                                    )}
                                </span>
                            </div>
                            {paymentDetails.paymentMethod === 'bank' && (
                                <>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-muted-foreground">Account Name</span>
                                        <span className="font-medium">{paymentDetails.accountHolderName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-muted-foreground">Account Number</span>
                                        <span className="font-medium">{paymentDetails.accountNumber}</span>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-muted-foreground">Bank Name</span>
                                        <span className="font-medium">{paymentDetails.bankName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-muted-foreground">IFSC Code</span>
                                        <span className="font-medium">{paymentDetails.ifscCode}</span>
                                    </div>
                                </>
                            )}
                            {paymentDetails.paymentMethod === 'upi' && (
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <span className="text-muted-foreground">UPI ID</span>
                                    <span className="font-medium">{paymentDetails.upiId}</span>
                                </div>
                            )}
                            {!paymentDetails.paymentMethod && (
                                <p className="col-span-2">No payment method details found for this user.</p>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogDescription>
                        {`Are you sure you want to ${confirmation?.newStatus.toLowerCase()} this transaction? This action cannot be undone.`}
                    </DialogDescription>
                </DialogHeader>
                {confirmation?.newStatus === 'Approved' && confirmation?.type === 'Withdrawal' && (
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="utr">UTR Number</Label>
                        <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter UTR number" />
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmation(null)}>Cancel</Button>
                    <Button
                        variant={confirmation?.newStatus === 'Rejected' ? "destructive" : "default"}
                        onClick={() => {
                            if (confirmation) {
                                const utrValue = confirmation.newStatus === 'Approved' && confirmation.type === 'Withdrawal' ? utr : undefined;
                                handleAction(confirmation.txnId, confirmation.newStatus, utrValue);
                                setConfirmation(null);
                                setUtr("");
                            }
                        }}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
