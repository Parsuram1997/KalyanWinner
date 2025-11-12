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
import { PlusCircle } from "lucide-react";
import { useState } from "react";

const transactions = [
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
    description: "Win on Single 8 (Kalyan Morning)",
    type: "Credit",
    amount: 950.0,
  },
  {
    id: "txn4",
    date: "2024-07-18",
    description: "Bet on Panel 128 (Kalyan Morning)",
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

export default function WalletPage() {
  const [amount, setAmount] = useState("1000");

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
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
          </CardContent>
          <CardFooter>
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
                {transactions.map((txn) => (
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
            {transactions.map((txn) => (
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
