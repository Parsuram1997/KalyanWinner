
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
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const withdrawalHistory = [
  { id: 1, date: "2024-07-20", amount: 1500, status: "Completed" },
  { id: 2, date: "2024-07-13", amount: 1000, status: "Completed" },
  { id: 3, date: "2024-07-06", amount: 2000, status: "Rejected" },
];

export default function EnrollerWalletPage() {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw.",
      });
      return;
    }
     // Assuming available balance is 2275 for this example
    if (amount > 2275) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You cannot withdraw more than your available balance.`,
      });
      return;
    }
    
    toast({
      title: "Withdrawal Requested",
      description: `Your request to withdraw ₹${amount} is being processed.`,
    });
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
                <div className="text-2xl font-bold">₹2,275.00</div>
                 <p className="text-xs text-muted-foreground">Funds you can withdraw.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹5,775.00</div>
                 <p className="text-xs text-muted-foreground">All-time commission earned.</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹3,500.00</div>
                 <p className="text-xs text-muted-foreground">All-time withdrawals.</p>
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
            <Dialog>
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
                    <Input
                      id="account-holder"
                      className="col-span-3"
                      placeholder="Account Holder Name"
                      defaultValue="Sanjay Verma"
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
                      IFSC Code
                    </Label>
                    <Input
                      id="ifsc-code"
                      className="col-span-3"
                      placeholder="IFSC Code"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleWithdraw} className="w-full">
                    <Landmark className="mr-2 h-4 w-4" />
                    Submit Request
                  </Button>
                </DialogFooter>
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
              {withdrawalHistory.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.date}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
