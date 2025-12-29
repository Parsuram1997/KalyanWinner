
"use client";

import { useMemo, useState, useEffect } from "react";
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
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { getPaymentSettings } from "@/app/actions/payment-settings-actions";
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
import { cn } from "@/lib/utils";

type Transaction = {
    id: string;
    userId: string;
    userName: string;
    customId?: string;
    type: "Deposit" | "Withdrawal" | "Win" | "Credit" | "Credit Repayment" | "Bet";
    amount: number;
    status: "Pending" | "Approved" | "Rejected" | "Completed" | "Placed";
    date: string;
    utr?: string;
    description?: string;
    fee?: number;
    netAmount?: number;
}

type User = {
    id: string;
    customId: string;
    name: string;
    phoneNumber?: string;
    mobile?: string; // Added for compatibility
    paymentMethod?: 'bank' | 'upi';
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
}

const getStatusClasses = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed':
        case 'Approved':
        case 'Placed':
            return 'bg-green-400/20 text-green-300 border border-green-400';
        case 'Pending':
            return 'bg-blue-400/20 text-blue-300 border border-blue-400';
        case 'Rejected':
            return 'bg-yellow-400/20 text-yellow-300 border border-yellow-400';
        default:
            return 'bg-red-400/20 text-red-300 border border-red-400';
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
    onConfirmAction: (details: { txnId: string, newStatus: 'Completed' | 'Rejected', type: Transaction['type'] }) => void,
    onDelete: (txn: Transaction) => void
}) => {
    if (isLoading) {
        return (
            <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full bg-white/20" />
                <Skeleton className="h-12 w-full bg-white/20" />
                <Skeleton className="h-12 w-full bg-white/20" />
            </div>
        )
    }
    
    if (items.length === 0) {
        return <p className="text-center text-white/80 p-8">No transactions found in this category.</p>
    }
    
    const getCustomId = (txn: Transaction) => {
        return txn.customId || userIdToCustomIdMap[txn.userId] || txn.userId;
    }

  return (
    <div>
        {/* Desktop View */}
        <div className="hidden md:block border border-white/20 rounded-md">
            <Table>
                <TableHeader className="border-b border-white/20">
                    <TableRow>
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Type & Amount</TableHead>
                        <TableHead className="text-white">Date &amp; Details</TableHead>
                        <TableHead className="text-center text-white">Status</TableHead>
                        <TableHead className="text-center text-white">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((txn) => (
                        <TableRow key={txn.id} className="border-white/20">
                            <TableCell className="py-2 font-medium">
                                <div>{txn.userName || 'N/A'}</div>
                                <div className="text-xs text-white/80">{getCustomId(txn)}</div>
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                                <div className="font-mono">
                                    <Badge variant={txn.type === "Deposit" || txn.type === "Win" || txn.type === "Credit" ? "secondary" : "destructive"}>{txn.type}</Badge>
                                    <div className="mt-1">Amount: <span className="font-semibold text-white">₹{Math.abs(txn.amount).toLocaleString('en-IN')}</span></div>
                                    {txn.fee !== undefined && <div>Fee: <span className="font-semibold text-white">₹{txn.fee.toLocaleString('en-IN')}</span></div>}
                                    {txn.netAmount !== undefined && <div className="text-green-300">Net: <span className="font-bold">₹{txn.netAmount.toLocaleString('en-IN')}</span></div>}
                                </div>
                            </TableCell>
                            <TableCell className="py-2 text-xs max-w-[200px]">
                                <div className="text-white">{new Date(txn.date).toLocaleString()}</div>
                                {txn.type === 'Withdrawal' ? (
                                     <Button variant="link" size="xs" className="text-blue-400 p-0 h-auto" onClick={() => onShowDetails(txn.userId)}>
                                        View Bank Details
                                    </Button>
                                ) : (
                                    <div className="text-white/70 truncate" title={txn.utr || txn.description}>
                                        {txn.utr || txn.description || 'N/A'}
                                    </div>
                                )}
                            </TableCell>
                           <TableCell className="py-2 text-center">
                                <Badge className={cn('text-xs', getStatusClasses(txn.status))}>
                                    {txn.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-center">
                                <div className="flex gap-2 justify-center">
                                {txn.status === "Pending" && (
                                    <>
                                        <Button variant="outline" size="xs" className="bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Completed', type: txn.type })}>Approve</Button>
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
                                            <AlertDialogDescription>This will permanently delete this transaction. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(txn)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="grid gap-4 md:hidden">
            {items.map((txn) => (
                <Card key={txn.id} className="bg-black/20 border-white/20 text-white">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm">{txn.userName || 'N/A'}</p>
                                <p className="text-xs text-white/80">{getCustomId(txn)}</p>
                                <p className="text-xs text-white/80 mt-1">{new Date(txn.date).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                               <Badge variant={txn.type === "Deposit" || txn.type === "Win" || txn.type === "Credit" ? "secondary" : "destructive"} className="font-medium text-xs">
                                    {txn.type}
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                            <div className="text-xs font-mono">
                                <div className="flex justify-between"><span>Amount:</span><span className="font-semibold">₹{Math.abs(txn.amount).toLocaleString('en-IN')}</span></div>
                                {txn.fee !== undefined && <div className="flex justify-between"><span>Fee:</span><span className="font-semibold">₹{txn.fee.toLocaleString('en-IN')}</span></div>}
                                {txn.netAmount !== undefined && <div className="flex justify-between text-green-300"><span>Net:</span><span className="font-bold">₹{txn.netAmount.toLocaleString('en-IN')}</span></div>}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/80 mr-2">Details:</span>
                                {txn.type === 'Withdrawal' ? (
                                    <Button variant="link" size="xs" className="p-0 h-auto text-blue-400" onClick={() => onShowDetails(txn.userId)}>
                                        View Details <Eye className="ml-1 h-3 w-3" />
                                    </Button>
                                ) : (
                                    <span className="font-mono text-xs text-right truncate" title={txn.utr || txn.description}>
                                        {txn.utr || txn.description || 'N/A'}
                                    </span>
                                )}
                            </div>
                             <div className="flex justify-between items-center text-xs">
                                <span className="text-white/80">Status:</span>
                                <Badge className={cn('text-xs', getStatusClasses(txn.status))}>
                                    {txn.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-2 p-4 pt-2 border-t border-white/20">
                       {txn.status === "Pending" && (
                            <>
                                <Button variant="outline" size="sm" className="bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => onConfirmAction({ txnId: txn.id, newStatus: 'Completed', type: txn.type })}>Approve</Button>
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
                                    <AlertDialogDescription>This will permanently delete this transaction. This action cannot be undone.</AlertDialogDescription>
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
  const [confirmation, setConfirmation] = useState<{ txnId: string, newStatus: 'Completed' | 'Rejected', type: Transaction['type'] } | null>(null);
  const [utr, setUtr] = useState("");

  const transactionsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'transactions'), 
                where('type', 'in', ['Deposit', 'Withdrawal', 'Win', 'Credit', 'Credit Repayment', 'Bet']),
                orderBy('date', 'desc')
              )
            : null,
    [firestore, key]
  );
  const { data: transactions, isLoading: isTransactionsLoading, error: transactionsError } = useCollection<Transaction>(transactionsQuery);
  
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: isUsersLoading, error: usersError } = useCollection<User>(usersQuery);
  
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

  const handleAction = async (txnId: string, newStatus: 'Completed' | 'Rejected', utrValue?: string) => {
    try {
        const result = await updateTransactionStatus(txnId, newStatus);
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
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle>Manage Transactions</CardTitle>
          <CardDescription className="text-white/80">Approve or reject deposits and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending-deposits">
                <div className="mb-4">
                  <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3 bg-black/20 p-1 sm:p-2">
                      <TabsTrigger value="pending-deposits" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-primary">Deposits ({pendingDeposits.length})</TabsTrigger>
                      <TabsTrigger value="pending-withdrawals" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-primary">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
                      <TabsTrigger value="processed" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-primary">Processed ({processedTransactions.length})</TabsTrigger>
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
                                <span className="text-muted-foreground">Mobile</span>
                                <span className="font-medium">
                                    {paymentDetails.mobile ? (
                                        <a href={`tel:${paymentDetails.mobile}`} className="text-blue-600 hover:underline">
                                            {paymentDetails.mobile}
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
                {confirmation?.newStatus === 'Completed' && confirmation?.type === 'Withdrawal' && (
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
                                const utrValue = confirmation.newStatus === 'Completed' && confirmation.type === 'Withdrawal' ? utr : undefined;
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

    