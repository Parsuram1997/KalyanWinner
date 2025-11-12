import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
            <CardDescription>Your available funds to play.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">₹1,245.50</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>
                Add money to your wallet instantly.
              </CardDescription>
            </div>
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
                      defaultValue="1000"
                      className="col-span-3"
                      type="number"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Proceed to Payment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>Secure payments powered by Stripe & Razorpay.</p>
          </CardContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell className="font-medium">{txn.description}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
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
        </CardContent>
      </Card>
    </div>
  );
}
