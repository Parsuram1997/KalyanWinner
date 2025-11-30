
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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";


type Transaction = {
    id: string;
    userId: string;
    userName: string;
    customId?: string;
    type: "Deposit" | "Withdrawal" | "Bet" | "Win" | "Referral Bonus";
    amount: number;
    status: "Pending" | "Approved" | "Rejected" | "Completed" | "Placed" | "Won" | "Lost";
    date: string;
    description?: string;
};

type LedgerEntry = {
    id: string;
    date: string;
    description: string;
    deposit: number;
    withdrawal: number;
    balance: number;
    userName: string;
};

const ITEMS_PER_PAGE = 50;

export default function CashLedgerPage() {
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  const [date, setDate] = useState<Date>(new Date());

  // Query 1: Get all completed deposits
  const depositsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'transactions'), 
                where('type', '==', 'Deposit'),
                where('status', '==', 'Completed')
              )
            : null,
    [firestore]
  );
  const { data: deposits, isLoading: depositsLoading } = useCollection<Transaction>(depositsQuery, { skip: !firestore });

  // Query 2: Get all completed withdrawals
  const withdrawalsQuery = useMemoFirebase(
    () => firestore 
            ? query(
                collection(firestore, 'transactions'), 
                where('type', '==', 'Withdrawal'),
                where('status', '==', 'Completed')
              )
            : null,
    [firestore]
  );
  const { data: withdrawals, isLoading: withdrawalsLoading } = useCollection<Transaction>(withdrawalsQuery, { skip: !firestore });

  const isLoading = depositsLoading || withdrawalsLoading;
  
  const ledgerData = useMemo(() => {
    // Combine all transactions first
    const allTransactions = [...(deposits || []), ...(withdrawals || [])];

    if (allTransactions.length === 0) return [];
    
    // Sort all transactions by date ascending to calculate running balance correctly
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter by the selected date on the client side
    const interval = { start: startOfDay(date), end: endOfDay(date) };
    const transactionsForSelectedDate = allTransactions.filter(txn => 
        isWithinInterval(new Date(txn.date), interval)
    );

    let runningBalance = 0;
    // Calculate the starting balance for the selected day
    const transactionsBeforeSelectedDate = allTransactions.filter(txn => new Date(txn.date) < startOfDay(date));
    transactionsBeforeSelectedDate.forEach(txn => {
        runningBalance += (txn.type === 'Deposit' ? txn.amount : -txn.amount);
    });
    
    const entries = transactionsForSelectedDate.map(txn => {
        const deposit = txn.type === 'Deposit' ? txn.amount : 0;
        const withdrawal = txn.type === 'Withdrawal' ? txn.amount : 0; 
        runningBalance = runningBalance + deposit - withdrawal;

        return {
            id: txn.id,
            date: txn.date,
            description: txn.description || `${txn.type} by ${txn.userName}`,
            deposit,
            withdrawal,
            balance: runningBalance,
            userName: txn.userName
        };
    });
    
    // Reverse the final array to show newest first in the UI for that day
    return entries.reverse();
  }, [deposits, withdrawals, date]);


  const totalPages = Math.ceil((ledgerData?.length || 0) / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    if (!ledgerData) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return ledgerData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [ledgerData, currentPage]);


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Cash Ledger</CardTitle>
            <CardDescription>A complete ledger of all completed deposits and withdrawals for the selected date.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(day) => setDate(day || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User & Description</TableHead>
                    <TableHead className="text-right">Deposit</TableHead>
                    <TableHead className="text-right">Withdrawal</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5} className="py-2"><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && paginatedData.map((entry) => (
                    <TableRow key={entry.id}>
                        <TableCell className="text-xs py-2">{new Date(entry.date).toLocaleString('en-GB')}</TableCell>
                        <TableCell className="py-2">
                            <div className="font-medium text-sm">{entry.userName}</div>
                            <div className="text-xs text-muted-foreground">{entry.description}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600 py-2">
                            {entry.deposit > 0 ? `+${entry.deposit.toLocaleString('en-IN')}` : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600 py-2">
                             {entry.withdrawal > 0 ? `-${entry.withdrawal.toLocaleString('en-IN')}` : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold py-2">
                            ₹{entry.balance.toLocaleString('en-IN')}
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
             {/* Mobile Cards */}
            <div className="grid gap-4 md:hidden">
            {isLoading && <p className="text-center text-muted-foreground">Loading ledger...</p>}
            {!isLoading && paginatedData.map((entry) => (
                <Card key={entry.id} className="p-3 text-sm">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="font-semibold">{entry.userName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono font-bold">₹{entry.balance.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                </div>
                <div className="space-y-2 border-t pt-3 text-xs">
                     <p className="text-muted-foreground">{entry.description}</p>
                     {entry.deposit > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                            <span>Deposit:</span>
                            <span className="font-mono font-semibold">+₹{entry.deposit.toLocaleString()}</span>
                        </div>
                     )}
                     {entry.withdrawal > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                            <span>Withdrawal:</span>
                            <span className="font-mono font-semibold">-₹{entry.withdrawal.toLocaleString()}</span>
                        </div>
                     )}
                </div>
                </Card>
            ))}
            </div>
             {!isLoading && ledgerData.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No completed transactions found for the selected date.</p>
            )}
        </CardContent>
         {totalPages > 1 && (
             <CardFooter className="flex justify-end items-center gap-4 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </CardFooter>
          )}
      </Card>
    </div>
  );
}

    