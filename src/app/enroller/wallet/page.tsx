
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Wallet, DollarSign, ArrowUp, ArrowDown, Landmark } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, addDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { updateTransactionStatus } from "@/app/actions/transaction-actions";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: "Pending" | "Completed" | "Rejected";
  type: "Commission" | "Withdrawal";
};

export default function EnrollerWalletPage() {
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  // Fetch enroller's own data
  const enrollerRef = useMemoFirebase(() => authUser ? doc(firestore, "users", authUser.uid) : null, [authUser, firestore]);
  const { data: enrollerData, isLoading: isEnrollerLoading } = useDoc<any>(enrollerRef);
  
  // Fetch transactions related to the enroller
  const transactionsQuery = useMemoFirebase(() => authUser ? query(collection(firestore, "transactions"), where("userId", "==", authUser.uid)) : null, [authUser, firestore]);
  const { data: transactions, isLoading: areTxnsLoading } = useCollection<Transaction>(transactionsQuery);

  const { totalEarned, totalWithdrawn, withdrawalHistory } = useMemo(() => {
    if (!transactions) return { totalEarned: 0, totalWithdrawn: 0, withdrawalHistory: [] };

    const earned = transactions
      .filter(t => t.type === 'Commission' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawn = transactions
      .filter(t => t.type === 'Withdrawal' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const history = transactions
      .filter(t => t.type === 'Withdrawal')
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalEarned: earned, totalWithdrawn: withdrawn, withdrawalHistory: history };
  }, [transactions]);

  const isLoading = isUserLoading || isEnrollerLoading || areTxnsLoading;
  const availableBalance = enrollerData?.balance || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !authUser || !enrollerData) return;

    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount." });
      return;
    }
    if (amount > availableBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: `Cannot withdraw more than your balance of ₹${availableBalance.toFixed(2)}.` });
      return;
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const enrollerDocRef = doc(firestore, "users", authUser.uid);
            const enrollerDoc = await transaction.get(enrollerDocRef);
            
            if (!enrollerDoc.exists() || enrollerDoc.data().balance < amount) {
                throw new Error("Insufficient balance.");
            }

            // Decrement balance
            transaction.update(enrollerDocRef, { balance: enrollerDoc.data().balance - amount });
            
            // Create withdrawal transaction
            const transactionsCollection = collection(firestore, "transactions");
            transaction.set(doc(transactionsCollection), {
                userId: authUser.uid,
                userName: enrollerData.name,
                type: "Withdrawal",
                amount: amount,
                status: "Pending",
                date: new Date().toISOString(),
                description: `Enroller withdrawal request`,
                method: 'Bank',
            });
        });

      toast({ title: "Withdrawal Requested", description: `Your request to withdraw ₹${amount} is being processed.` });
      setWithdrawAmount("");
      setWithdrawDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Withdrawal Failed", description: error.message || "An unexpected error occurred." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Commission Wallet</h1>
        <p className="text-muted-foreground">
          Manage your commission earnings and withdrawals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{availableBalance.toFixed(2)}</div>}
                 <p className="text-xs text-muted-foreground">Funds you can withdraw.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{totalEarned.toFixed(2)}</div>}
                 <p className="text-xs text-muted-foreground">All-time commission earned.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{totalWithdrawn.toFixed(2)}</div>}
                 <p className="text-xs text-muted-foreground">All-time successful withdrawals.</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>
                    A record of your past withdrawal requests.
                </CardDescription>
            </div>
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Wallet className="mr-2 h-4 w-4" /> Request Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request Withdrawal</DialogTitle>
                  <DialogDescription>
                    Enter your bank details to withdraw your commission. Funds will be transferred within 24-48 hours.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw}>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="withdraw-amount" className="text-right">
                        Amount
                        </Label>
                        <Input
                        id="withdraw-amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="col-span-3"
                        type="number"
                        placeholder="e.g. 2000"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account-holder" className="text-right">
                        Name
                        </Label>
                        <Input id="account-holder" className="col-span-3" placeholder="Account Holder Name" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account-number" className="text-right">
                        Account No.
                        </Label>
                        <Input id="account-number" className="col-span-3" placeholder="Bank Account Number" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ifsc-code" className="text-right">
                        IFSC Code
                        </Label>
                        <Input id="ifsc-code" className="col-span-3" placeholder="IFSC Code" />
                    </div>
                    </div>
                    <DialogFooter>
                    <Button type="submit" className="w-full">
                        <Landmark className="mr-2 h-4 w-4" />
                        Submit Request
                    </Button>
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Loading history...</TableCell>
                </TableRow>
              ) : withdrawalHistory.length > 0 ? (
                withdrawalHistory.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{txn.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          txn.status === "Completed"
                            ? "secondary"
                            : txn.status === "Pending"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No withdrawal history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    