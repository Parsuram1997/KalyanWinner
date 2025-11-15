
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
import { MinusCircle, PlusCircle, QrCode } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


const initialTransactions = [
    {
    id: "txn15",
    date: "2024-07-25",
    description: "Win on Jodi 23 (Kalyan Night)",
    type: "Credit",
    amount: 4750.0,
    status: "Won",
  },
  {
    id: "txn14",
    date: "2024-07-25",
    description: "Bet on Jodi 23 (Kalyan Night)",
    type: "Debit",
    amount: -50.0,
    status: "Placed",
  },
  {
    id: "txn13",
    date: "2024-07-24",
    description: "Wallet Deposit via Card",
    type: "Credit",
    amount: 2000.0,
    status: "Completed",
  },
  {
    id: "txn12",
    date: "2024-07-23",
    description: "Bet on Open Panna 112 (Kalyan Day)",
    type: "Debit",
    amount: -100.0,
    status: "Lost",
  },
  {
    id: "txn11",
    date: "2024-07-23",
    description: "Bet on Close Single 8 (Kalyan Night)",
    type: "Debit",
    amount: -200.0,
    status: "Lost",
  },
  {
    id: "txn10",
    date: "2024-07-22",
    description: "Win on Close Panna 789 (Kalyan Day)",
    type: "Credit",
    amount: 1400.0,
    status: "Won",
  },
  {
    id: "txn9",
    date: "2024-07-22",
    description: "Bet on Close Panna 789 (Kalyan Day)",
    type: "Debit",
    amount: -10.0,
    status: "Placed",
  },
  {
    id: "txn8",
    date: "2024-07-21",
    description: "Withdrawal to Bank Account",
    type: "Debit",
    amount: -2000.0,
    status: "Pending",
  },
  {
    id: "txn7",
    date: "2024-07-21",
    description: "Bet on Jodi 99 (Kalyan Night)",
    type: "Debit",
    amount: -25.0,
    status: "Lost",
  },
  {
    id: "txn6",
    date: "2024-07-20",
    description: "Wallet Deposit via Netbanking",
    type: "Credit",
    amount: 300.0,
    status: "Completed",
  },
  {
    id: "txn1",
    date: "2024-07-20",
    description: "Bet on Jodi 45 (Kalyan Night)",
    type: "Debit",
    amount: -100.0,
    status: "Lost",
  },
  {
    id: "txn2",
    date: "2024-07-19",
    description: "Wallet Deposit via UPI",
    type: "Credit",
    amount: 500.0,
    status: "Completed",
  },
  {
    id: "txn3",
    date: "2024-07-18",
    description: "Win on Single 8 (Kalyan Day)",
    type: "Credit",
    amount: 950.0,
    status: "Won",
  },
  {
    id: "txn4",
    date: "2024-07-18",
    description: "Bet on Panel 128 (Kalyan Day)",
    type: "Debit",
    amount: -50.0,
    status: "Placed",
  },
  {
    id: "txn5",
    date: "2024-07-17",
    description: "Withdrawal to Bank Account",
    type: "Debit",
    amount: -1000.0,
    status: "Completed",
  },
];

const TRANSACTIONS_PER_PAGE = 10;

export default function WalletPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState(1245.50);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [addAmount, setAddAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("2000");
  const [isAddFundsOpen, setAddFundsOpen] = useState(false);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const [addMethod, setAddMethod] = useState("upi");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [utr, setUtr] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
    const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage]);


  const handleAddFunds = () => {
    const amount = parseInt(addAmount, 10);
    if (isNaN(amount) || amount < 500) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₹500.",
      });
      return;
    }
    if (!utr) {
      toast({
        variant: "destructive",
        title: "UTR Number Required",
        description: "Please enter the transaction UTR number.",
      });
      return;
    }
    
    toast({
      title: "Deposit Request Submitted",
      description: `Your request to add ₹${amount} with UTR ${utr} has been received and is being verified.`,
    });

    const newTransaction = {
      id: `txn${transactions.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      description: `Wallet Deposit via ${addMethod.toUpperCase()}`,
      type: "Credit" as "Credit",
      amount: amount,
      status: "Pending"
    };

    setBalance(balance + amount);
    setTransactions([newTransaction, ...transactions]);

    setUtr("");
    setAddFundsOpen(false);
  };

  const handleWithdraw = () => {
    const today = new Date();
    if (today.getDay() !== 0) {
      toast({
        variant: "destructive",
        title: "Withdrawal Not Allowed",
        description: "Withdrawals are only processed on Sundays.",
      });
      return;
    }

    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < 2000) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹2000.",
      });
      return;
    }
     if (amount > balance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You cannot withdraw more than your available balance of ₹${balance.toFixed(2)}.`,
      });
      return;
    }
    
    toast({
      title: "Withdrawal Requested",
      description: `Your request to withdraw ₹${amount} is being processed. Funds will be transferred within 24 hours.`,
    });
    setWithdrawOpen(false);
  };
  

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Wallet
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your funds and view transaction history.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/20 to-accent/20">
          <CardHeader>
            <CardTitle className="text-lg">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">
              {balance.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your available funds to play.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-bl from-secondary/20 to-accent/10">
          <CardHeader>
            <CardTitle className="text-lg">Manage Funds</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Dialog open={isAddFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Funds to Wallet</DialogTitle>
                  <DialogDescription>
                    Minimum deposit is ₹500. After payment, enter the UTR number and submit.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="col-span-3"
                      type="number"
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <RadioGroup defaultValue={addMethod} onValueChange={setAddMethod} className="grid grid-cols-2 gap-4 my-2">
                    <div>
                      <RadioGroupItem value="upi" id="add-upi" className="peer sr-only" />
                      <Label
                        htmlFor="add-upi"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        UPI
                      </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="bank" id="add-bank" className="peer sr-only" />
                      <Label
                        htmlFor="add-bank"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Bank Transfer
                      </Label>
                    </div>
                  </RadioGroup>

                  {addMethod === 'upi' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="bg-white p-2 rounded-md border">
                        <QrCode className="h-32 w-32" />
                      </div>
                      <p className="text-sm text-muted-foreground">Scan the QR or use the UPI ID below.</p>
                      <Input
                        readOnly
                        value="your-upi-id@okhdfcbank"
                        className="text-center font-mono"
                      />
                       <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("your-upi-id@okhdfcbank")}>Copy UPI ID</Button>
                    </div>
                  )}

                  {addMethod === "bank" && (
                     <div className="space-y-4 rounded-md border p-4 text-sm">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">Kalyan Winner Pvt Ltd</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Account:</span>
                          <span className="font-medium">123456789012</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">IFSC:</span>
                           <span className="font-medium">HDFC0001234</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">Current Account</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4 pt-4">
                    <Label htmlFor="utr" className="text-right">
                      UTR Number
                    </Label>
                    <Input
                      id="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      className="col-span-3"
                      placeholder="Transaction Reference ID"
                    />
                  </div>

                </div>
                <DialogFooter>
                  <Button onClick={handleAddFunds} className="w-full">
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isWithdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MinusCircle className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Minimum withdrawal is ₹2000 (Sundays only). Funds will be transferred within 24 hours.
                  </DialogDescription>
                </DialogHeader>
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
                  <RadioGroup defaultValue={withdrawMethod} onValueChange={setWithdrawMethod} className="grid grid-cols-2 gap-4 my-4">
                    <div>
                      <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                      <Label
                        htmlFor="bank"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Bank Transfer
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                      <Label
                        htmlFor="upi"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        UPI
                      </Label>
                    </div>
                  </RadioGroup>
                  {withdrawMethod === "bank" && (
                    <div className="space-y-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account-holder" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="account-holder"
                          className="col-span-3"
                          placeholder="Account Holder Name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account-number" className="text-right">
                          Account No.
                        </Label>
                        <Input
                          id="account-number"
                          className="col-span-3"
                          placeholder="Bank Account Number"
                        />
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="ifsc-code" className="text-right">
                          IFSC
                        </Label>
                        <Input
                          id="ifsc-code"
                          className="col-span-3"
                          placeholder="IFSC Code"
                        />
                      </div>
                    </div>
                  )}
                  {withdrawMethod === "upi" && (
                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="upi-id" className="text-right">
                        UPI ID
                      </Label>
                      <Input
                        id="upi-id"
                        className="col-span-3"
                        placeholder="upi id / mobile number"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} className="w-full">
                    Request Withdrawal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground text-center w-full">
              Secure payments powered by Stripe & Razorpay.
            </p>
          </CardFooter>
        </Card>
      </div>

      <Card className="bg-gradient-to-tr from-card to-secondary/10">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A record of your recent wallet activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          txn.type === "Credit"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          txn.status === "Won" || txn.status === "Completed"
                            ? "secondary"
                            : txn.status === "Pending"
                            ? "default"
                            : "outline"
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        txn.type === "Credit" ? "text-green-600" : ""
                      }`}
                    >
                      {txn.amount.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile List */}
          <div className="grid gap-4 md:hidden">
            {paginatedTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-start justify-between gap-4 p-3 -m-3 rounded-lg hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <div className="mt-1">
                     <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          txn.type === "Credit"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {txn.type}
                      </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold text-sm ${
                      txn.type === "Credit" ? "text-green-600" : ""
                    }`}
                  >
                    {txn.amount.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                    })}
                  </p>
                  <Badge
                     variant={
                        txn.status === "Won" || txn.status === "Completed"
                          ? "secondary"
                          : txn.status === "Pending"
                          ? "default"
                          : "outline"
                      }
                      className="mt-1"
                  >
                    {txn.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    