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

const transactions = [
  { id: "TXN001", user: "Ravi Kumar", type: "Deposit", amount: 1000, status: "Pending", date: "2024-07-26" },
  { id: "TXN002", user: "Sunita Sharma", type: "Withdrawal", amount: 500, status: "Approved", date: "2024-07-25" },
  { id: "TXN003", user: "Amit Patel", type: "Deposit", amount: 2000, status: "Rejected", date: "2024-07-25" },
  { id: "TXN004", user: "Priya Singh", type: "Withdrawal", amount: 10000, status: "Pending", date: "2024-07-26" },
];

const TransactionTable = ({ items }: { items: typeof transactions }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {items.map((txn) => (
                <TableRow key={txn.id}>
                    <TableCell>{txn.id}</TableCell>
                    <TableCell>{txn.user}</TableCell>
                    <TableCell>
                        <Badge variant={txn.type === "Deposit" ? "secondary" : "outline"}>
                            {txn.type}
                        </Badge>
                    </TableCell>
                    <TableCell>₹{txn.amount.toFixed(2)}</TableCell>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>
                        <Badge variant={txn.status === "Approved" ? "default" : txn.status === "Pending" ? "secondary" : "destructive"}>
                            {txn.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                        {txn.status === "Pending" && (
                            <>
                                <Button variant="outline" size="sm">Approve</Button>
                                <Button variant="destructive" size="sm">Reject</Button>
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
)

export default function TransactionsPage() {
  const pendingDeposits = transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'Withdrawal' && t.status === 'Pending');
  const processedTransactions = transactions.filter(t => t.status !== 'Pending');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Approve or reject user deposits and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="pending-deposits">
                <TabsList>
                    <TabsTrigger value="pending-deposits">Pending Deposits ({pendingDeposits.length})</TabsTrigger>
                    <TabsTrigger value="pending-withdrawals">Pending Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
                    <TabsTrigger value="processed">Processed ({processedTransactions.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending-deposits">
                    <TransactionTable items={pendingDeposits} />
                </TabsContent>
                <TabsContent value="pending-withdrawals">
                    <TransactionTable items={pendingWithdrawals} />
                </TabsContent>
                <TabsContent value="processed">
                    <TransactionTable items={processedTransactions} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
