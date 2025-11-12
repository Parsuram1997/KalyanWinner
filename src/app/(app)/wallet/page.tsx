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
import { MinusCircle, PlusCircle } from "lucide-react";
import { useState } from "react";

const transactions = [
    {
    id: "txn15",
    date: "2024-07-25",
    description: "Win on Jodi 23 (Kalyan Night)",
    type: "Credit",
    amount: 4750.0,
  },
  {
    id: "txn14",
    date: "2024-07-25",
    description: "Bet on Jodi 23 (Kalyan Night)",
    type: "Debit",
    amount: -50.0,
  },
  {
    id: "txn13",
    date: "2024-07-24",
    description: "Wallet Deposit via Card",
    type: "Credit",
    amount: 2000.0,
  },
  {
    id: "txn12",
    date: "2024-07-23",
    description: "Bet on Open Panna 112 (Kalyan Day)",
    type: "Debit",
    amount: -100.0,
  },
  {
    id: "txn11",
    date: "2024-07-23",
    description: "Bet on Close Single 8 (Kalyan Night)",
    type: "Debit",
    amount: -200.0,
  },
  {
    id: "txn10",
    date: "2024-07-22",
    description: "Win on Close Panna 789 (Kalyan Day)",
    type: "Credit",
    amount: 1400.0,
  },
  {
    id: "txn9",
    date: "2024-07-22",
    description: "Bet on Close Panna 789 (Kalyan Day)",
    type: "Debit",
    amount: -10.0,
  },
  {
    id: "txn8",
    date: "2024-07-21",
    description: "Withdrawal to Bank Account",
    type: "Debit",
    amount: -2000.0,
  },
  {
    id: "txn7",
    date: "2024-07-21",
    description: "Bet on Jodi 99 (Kalyan Night)",
    type: "Debit",
    amount: -25.0,
  },
  {
    id: "txn6",
    date: "2024-07-20",
    description: "Wallet Deposit via Netbanking",
    type: "Credit",
    amount: 300.0,
  },
  {
    id: "txn1",
    date: "2024-07-20",
    description: "Bet on Jodi 45 (Kalyan Night)",
    type: "Debit",
    amount: -100.0,
  },
  {
    id: "txn2",
    date: "2024-07-19",
    description: "Wallet Deposit via UPI",
    type: "Credit",
    amount: 500.0,
  },
  {
    id: "txn3",
    date: "2024-07-18",
    description: "Win on Single 8 (Kalyan Day)",
    type: "Credit",
    amount: 950.0,
  },
  {
    id: "txn4",
    date: "2024-07-18",
    description: "Bet on Panel 128 (Kalyan Day)",
    type: "Debit",
    amount: -50.0,
  },
  {
    id: "txn5",
    date: "2024-07-17",
    description: "Withdrawal to Bank Account",
    type: "Debit",
    amount: -1000.0,
  },
];

const recentTransactions = transactions.slice(0, 15);

export default function WalletPage() {
  const [addAmount, setAddAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("500");

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">
              ₹1,245.50
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your available funds to play.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manage Funds</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Funds to Wallet</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to add. You will be redirected to
                    the payment gateway.
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
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    Proceed to Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MinusCircle className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Enter the amount and your bank details for withdrawal.
                    Funds will be transferred within 2-3 business days.
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
                      placeholder="e.g. 500"
                    />
                  </div>
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
                <DialogFooter>
                  <Button type="submit" className="w-full">
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

      <Card>
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
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{txn.date}</TableCell>
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
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-4 p-3 -m-3 rounded-lg hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">{txn.date}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
