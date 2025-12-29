
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, Phone, MapPin, Map, Lock, Unlock, CalendarDays, TrendingUp, TrendingDown, CreditCard, PiggyBank, ArrowRightLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { updateUserStatus } from "@/app/actions/user-actions";
import { manualDeposit, manualWithdrawal, grantCredit } from "@/app/actions/transaction-actions";
import { getPaymentSettings } from "@/app/actions/payment-settings-actions";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator";


const ITEMS_PER_PAGE = 50;

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Completed': case 'Approved': return 'secondary';
        case 'Pending': return 'default';
        case 'Rejected': return 'warning';
        case 'Won': return 'success';
        case 'Lost': return 'destructive';
        default: return 'outline';
    }
};

const safeToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  if (timestamp.seconds && typeof timestamp.seconds === 'number') return new Date(timestamp.seconds * 1000);
  return null;
};


function ManualTransactionDialog({ 
    userId, 
    userName, 
    action, 
    withdrawalFeePercentage,
    children 
} : {
    userId: string,
    userName: string,
    action: 'deposit' | 'withdraw' | 'credit',
    withdrawalFeePercentage: number,
    children: React.ReactNode
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPending, startTransition] = useTransition();
  
  const numericAmount = parseFloat(amount) || 0;
  const fee = action === 'withdraw' ? (numericAmount * withdrawalFeePercentage) / 100 : 0;
  const netAmount = numericAmount - fee;


  const handleAction = async () => {
    if (!userId || !amount) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive number." });
        return;
    }

    const finalRemarks = remarks || `Admin ${action} for ${userName}`;

    startTransition(async () => {
        try {
            let result;
            if (action === 'deposit') {
                result = await manualDeposit(userId, numericAmount, finalRemarks);
            } else if (action === 'withdraw') {
                result = await manualWithdrawal(userId, numericAmount, finalRemarks);
            } else if (action === 'credit') {
                result = await grantCredit(userId, numericAmount, finalRemarks);
            }

            if (result?.success) {
                 toast({
                    title: `Transaction Successful`,
                    description: result.message || `Successfully processed ${action} of ₹${numericAmount} for ${userName}.`,
                });
                setOpen(false);
                setAmount("");
                setRemarks("");
            } else {
                throw new Error(result?.message || "Transaction failed.");
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
                description: error.message || `Could not process ${action}.`,
            });
        }
    });
  };

  const title = action === 'deposit' ? "Manual Deposit" : action === 'withdraw' ? "Manual Withdrawal" : "Give Credit";
  const description = `Manually ${action} funds for ${userName}. This will be recorded as an admin-initiated transaction.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-gray-950 border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription className="text-white/70">{description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Amount</Label>
                    <Input 
                        id="amount" 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="col-span-3 bg-gray-900 border-white/20" 
                        placeholder="Enter amount in ₹"
                    />
                </div>
                {action === 'withdraw' && numericAmount > 0 && (
                  <Card className="col-span-4 bg-gray-800 border-gray-700 p-3 text-xs space-y-2">
                      <div className="flex justify-between">
                          <span className="text-white/70">Withdrawal Fee ({withdrawalFeePercentage}%):</span>
                          <span>- ₹{fee.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-white/20"/>
                      <div className="flex justify-between font-bold">
                          <span>Net Payable to User:</span>
                          <span className="text-green-400">₹{netAmount.toFixed(2)}</span>
                      </div>
                  </Card>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="remarks" className="text-right">Remarks</Label>
                    <Input 
                        id="remarks" 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)} 
                        className="col-span-3 bg-gray-900 border-white/20" 
                        placeholder="Optional notes"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleAction} disabled={isPending || !amount} className="bg-green-600 hover:bg-green-700">
                    {isPending ? "Processing..." : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}


export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.userId as string; 
  const firestore = useFirestore();
  const [isStatusPending, startStatusTransition] = useTransition();
  const [betCurrentPage, setBetCurrentPage] = useState(1);
  const [txnCurrentPage, setTxnCurrentPage] = useState(1);
  const [paymentSettings, setPaymentSettings] = useState({ withdrawalFeePercentage: 0 });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const userQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users'), where('customId', '==', userId));
  }, [firestore, userId]);
  
  const { data: users, isLoading: isUserQueryLoading } = useCollection<any>(userQuery);

  const user = users?.[0];
  const userDocId = user?.id;

  useEffect(() => {
      const fetchSettings = async () => {
          setIsLoadingSettings(true);
          try {
              const settings = await getPaymentSettings();
              setPaymentSettings({
                  withdrawalFeePercentage: settings?.withdrawalFeePercentage || 0,
              });
          } catch (e) {
              toast({ variant: "destructive", title: "Could not load settings." });
          } finally {
              setIsLoadingSettings(false);
          }
      };
      fetchSettings();
  }, []);

  const betsQuery = useMemoFirebase(() => {
      if (!firestore || !userDocId) return null;
      return query(collection(firestore, "kalyan_bets"), where("userId", "==", userDocId));
  }, [firestore, userDocId]);
  
  const { data: userBets, isLoading: areBetsLoading } = useCollection<any>(betsQuery);

  const txnsQuery = useMemoFirebase(() => {
    if (!firestore || !userDocId) return null;
    return query(
      collection(firestore, "transactions"), 
      where("userId", "==", userDocId),
      where('type', 'in', ['Deposit', 'Withdrawal', 'Credit', 'Credit Repayment']),
      orderBy("date", "desc")
    );
  }, [firestore, userDocId]);

  const { data: userTxns, isLoading: areTxnsLoading } = useCollection<any>(txnsQuery);

  const sortedBets = useMemo(() => {
    if (!userBets) return [];
    return [...userBets].sort((a, b) => {
        const dateA = safeToDate(a.createdAt);
        const dateB = safeToDate(b.createdAt);
        if (dateA && dateB) return dateB.getTime() - dateA.getTime();
        return 0;
    });
  }, [userBets]);

  const { paginatedBets, totalBetPages } = useMemo(() => {
    if (!sortedBets) return { paginatedBets: [], totalBetPages: 0 };
    const totalPages = Math.ceil(sortedBets.length / ITEMS_PER_PAGE);
    const startIndex = (betCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { paginatedBets: sortedBets.slice(startIndex, endIndex), totalBetPages: totalPages };
  }, [sortedBets, betCurrentPage]);

  const { paginatedTxns, totalTxnPages } = useMemo(() => {
    if (!userTxns) return { paginatedTxns: [], totalTxnPages: 0 };
    const totalPages = Math.ceil(userTxns.length / ITEMS_PER_PAGE);
    const startIndex = (txnCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { paginatedTxns: userTxns.slice(startIndex, endIndex), totalTxnPages: totalPages };
  }, [userTxns, txnCurrentPage]);
  
  const netProfitLoss = useMemo(() => {
    if (!userBets) return 0;
    
    const totalWinnings = userBets
      .filter(bet => bet.status === 'Won')
      .reduce((sum, bet) => sum + (bet.winningAmount || 0), 0);

    const totalBetAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);

    return totalWinnings - totalBetAmount;
  }, [userBets]);


  const isLoading = isUserQueryLoading || areBetsLoading || areTxnsLoading || isLoadingSettings;
  
  const handleStatusChange = () => {
    if (!userDocId || !user) return;
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    startStatusTransition(async () => {
        try {
            await updateUserStatus(userDocId, newStatus);
            toast({
                title: "Status Updated",
                description: `${user.name}'s status has been changed to ${newStatus}.`,
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update user status.",
            });
        }
    });
  };

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Card className="bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900 border-0">
                <CardHeader>
                    <Skeleton className="h-8 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-64 mt-2 bg-white/10" />
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/10" />)}
                </CardContent>
                 <CardFooter className="border-t border-white/10 pt-4">
                    <Skeleton className="h-10 w-36 bg-white/10" />
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!user) {
    return <div className="text-white">User not found</div>;
  }
  
  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0);
  const isInactive = user.status === 'Inactive';
  const joinedDate = safeToDate(user.createdAt);

  return (
    <div className="flex flex-col gap-6 text-white">
      <Card className="bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900 border-white/10">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-6 w-6" />
              <span className="text-white">{user.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-white/70">User ID: {user.customId}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Mobile</p></div>
                <p className="font-medium text-white">{user.mobile}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">State</p></div>
                <p className="font-medium text-white">{user.state}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Map className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">District</p></div>
                <p className="font-medium text-white">{user.district}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Joined On</p></div>
                <p className="font-medium text-white">{joinedDate ? joinedDate.toLocaleDateString('en-GB') : 'N/A'}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Total Playable Balance</p></div>
                <p className="font-medium text-white">₹{totalBalance.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Deposit Balance</p></div>
                <p className="font-medium text-white">₹{(user.depositBalance || 0).toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Winning Balance</p></div>
                <p className="font-medium text-white">₹{(user.winningBalance || 0).toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-red-400/90" /><p className="text-sm text-red-400/90">Credit Balance</p></div>
                <p className="font-medium text-red-400">₹{(user.creditBalance || 0).toFixed(2)}</p>
            </div>
            {netProfitLoss >= 0 ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Total Profit</p></div>
                    <p className="font-medium text-green-400">₹{netProfitLoss.toFixed(2)}</p>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-white/70" /><p className="text-sm text-white/70">Total Loss</p></div>
                    <p className="font-medium text-red-400">-₹{Math.abs(netProfitLoss).toFixed(2)}</p>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-4 h-4"></div><p className="text-sm text-white/70">Status</p></div>
                <Badge variant={user.status === "Active" ? "secondary" : "outline"}>
                    {user.status}
                </Badge>
            </div>
        </CardContent>
        <CardFooter className="border-t border-white/20 flex items-center justify-between pt-6">
            <div className="flex gap-2">
                 {userDocId && (
                    <>
                        <ManualTransactionDialog userId={userDocId} userName={user.name} action="deposit" withdrawalFeePercentage={0}>
                            <Button variant="secondary" size="sm" className="px-3 md:px-4">
                                <PiggyBank className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Deposit</span>
                            </Button>
                        </ManualTransactionDialog>
                        <ManualTransactionDialog userId={userDocId} userName={user.name} action="credit" withdrawalFeePercentage={0}>
                             <Button variant="secondary" size="sm" className="px-3 md:px-4">
                                <CreditCard className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Credit</span>
                            </Button>
                        </ManualTransactionDialog>
                        <ManualTransactionDialog userId={userDocId} userName={user.name} action="withdraw" withdrawalFeePercentage={paymentSettings.withdrawalFeePercentage}>
                            <Button variant="destructive" size="sm" className="px-3 md:px-4">
                                <ArrowRightLeft className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Manual Withdraw</span>
                            </Button>
                        </ManualTransactionDialog>
                    </>
                 )}
            </div>
            <Button 
                onClick={handleStatusChange}
                disabled={isStatusPending}
                variant={isInactive ? "secondary" : "destructive"} 
                size="sm"
                className="px-3 md:px-4"
            >
                {isInactive ? <Unlock className="h-4 w-4 md:mr-2" /> : <Lock className="h-4 w-4 md:mr-2" />}
                <span className="hidden md:inline">
                    {isStatusPending ? 'Updating...' : isInactive ? 'Mark as Active' : 'Mark as Inactive'}
                </span>
            </Button>
        </CardFooter>
      </Card>

       <Card className="bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900 border-white/10">
        <Tabs defaultValue="bets">
            <CardHeader>
                 <TabsList className="grid w-full grid-cols-2 bg-black/30 text-white border-white/20">
                    <TabsTrigger value="bets">Bet History</TabsTrigger>
                    <TabsTrigger value="transactions">Passbook</TabsTrigger>
                </TabsList>
            </CardHeader>
            <TabsContent value="bets">
                 <CardContent>
                    <div className="hidden md:block rounded-md border border-white/20">
                        <Table>
                        <TableHeader>
                            <TableRow className="border-white/20">
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Description</TableHead>
                            <TableHead className="text-white">Market</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-right text-white">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => {
                              const betDate = safeToDate(bet.createdAt);
                              return (
                                <TableRow key={bet.id} className="border-white/20">
                                    <TableCell className="py-2 text-white/80">{betDate ? betDate.toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                                    <TableCell className="py-2 text-white">{`${bet.gameType} (${bet.number})`}</TableCell>
                                    <TableCell className="py-2 text-white">{bet.market}</TableCell>
                                    <TableCell className="py-2">
                                    <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-2 text-white">-₹{bet.amount.toFixed(2)}</TableCell>
                                </TableRow>
                              );
                            }) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-white/70">No bets placed by this user yet.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {!areBetsLoading && paginatedBets && paginatedBets.length > 0 ? paginatedBets.map((bet) => {
                           const betDate = safeToDate(bet.createdAt);
                           return (
                            <Card key={bet.id} className="p-4 text-xs bg-black/30 border-white/20 text-white">
                                <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-white">{`${bet.gameType} (${bet.number})`}</p>
                                    <p className="text-white/70">{betDate ? betDate.toLocaleString('en-GB') : 'N/A'}</p>
                                </div>
                                <Badge variant={getStatusVariant(bet.status)}>{bet.status}</Badge>
                                </div>
                                <div className="space-y-1 border-t border-white/20 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-white/70">Market:</span>
                                    <span className="font-medium text-white">{bet.market}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/70">Amount:</span>
                                    <span className="font-medium text-white">-₹{bet.amount.toFixed(2)}</span>
                                </div>
                                </div>
                            </Card>
                           );
                        }) : (
                        <p className="text-center text-white/70 py-8">No bets placed by this user yet.</p>
                        )}
                    </div>
                </CardContent>
                 {totalBetPages > 1 && (
                    <CardFooter className="flex justify-end items-center gap-4 border-t border-white/20 pt-4">
                        <span className="text-sm text-white/70">Page {betCurrentPage} of {totalBetPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setBetCurrentPage(p => Math.max(p - 1, 1))} disabled={betCurrentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setBetCurrentPage(p => Math.min(p + 1, totalBetPages))} disabled={betCurrentPage === totalBetPages}>Next</Button>
                    </CardFooter>
                )}
            </TabsContent>

            <TabsContent value="transactions">
                 <CardContent>
                    <div className="hidden md:block rounded-md border border-white/20">
                        <Table>
                        <TableHeader>
                            <TableRow className="border-white/20">
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">UTR/Details</TableHead>
                            <TableHead className="text-right text-white">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTxns && paginatedTxns.length > 0 ? paginatedTxns.map((txn) => {
                              const txnDate = safeToDate(txn.date);
                              return (
                                <TableRow key={txn.id} className="border-white/20">
                                    <TableCell className="py-2 text-white/80">{txnDate ? txnDate.toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                                    <TableCell className="py-2"><Badge variant={txn.type === 'Deposit' || txn.type === 'Credit' ? 'default' : 'outline'}>{txn.type}</Badge></TableCell>
                                    <TableCell className="py-2"><Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge></TableCell>
                                    <TableCell className="text-xs py-2 text-white/80">{txn.utr || txn.description || 'N/A'}</TableCell>
                                    <TableCell className={cn("text-right font-mono py-2", txn.type.includes('Repay') || txn.type === 'Withdrawal' ? 'text-red-400' : 'text-green-400')}>
                                        {txn.type.includes('Repay') || txn.type === 'Withdrawal' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                              );
                            }) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-white/70">No transactions found for this user.</TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {!areTxnsLoading && paginatedTxns && paginatedTxns.length > 0 ? paginatedTxns.map((txn) => {
                          const txnDate = safeToDate(txn.date);
                          return (
                            <Card key={txn.id} className="p-4 text-xs bg-black/30 border-white/20 text-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold text-white">{txn.type}</p>
                                        <p className="text-white/70">{txnDate ? txnDate.toLocaleString('en-GB') : 'N/A'}</p>
                                    </div>
                                    <Badge variant={getStatusVariant(txn.status)}>{txn.status}</Badge>
                                </div>
                                <div className="space-y-1 border-t border-white/20 pt-2">
                                <div className="flex justify-between">
                                        <span className="text-white/70">Amount:</span>
                                        <span className={cn("font-mono font-medium", txn.type.includes('Repay') || txn.type === 'Withdrawal' ? 'text-red-400' : 'text-green-400')}>
                                            {txn.type.includes('Repay') || txn.type === 'Withdrawal' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/70">Details:</span>
                                        <span className="text-xs truncate">{txn.utr || txn.description || 'N/A'}</span>
                                    </div>
                                </div>
                            </Card>
                          );
                        }) : (
                        <p className="text-center text-white/70 py-8">No transactions found for this user.</p>
                        )}
                    </div>
                </CardContent>
                 {totalTxnPages > 1 && (
                    <CardFooter className="flex justify-end items-center gap-4 border-t border-white/20 pt-4">
                        <span className="text-sm text-white/70">Page {txnCurrentPage} of {totalTxnPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setTxnCurrentPage(p => Math.max(p - 1, 1))} disabled={txnCurrentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setTxnCurrentPage(p => Math.min(p + 1, totalTxnPages))} disabled={txnCurrentPage === totalTxnPages}>Next</Button>
                    </CardFooter>
                )}
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
