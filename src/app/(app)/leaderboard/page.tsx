
"use client";

import {
  Card,
  CardContent,
  CardDescription,
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
import { Trophy } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

type WinTransaction = {
  id: string;
  userId: string;
  userName: string;
  customId?: string;
  amount: number;
  date: string; // ISO String
};

type AggregatedWinner = {
    userId: string;
    userName: string;
    customId?: string;
    totalWinnings: number;
}

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    const today = new Date();
    const startDate = startOfDay(today).toISOString();
    const endDate = endOfDay(today).toISOString();

    return query(
      collection(firestore, "transactions"),
      where("type", "==", "Win"),
      where("status", "==", "Completed"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
  }, [firestore]);

  const { data: transactions, isLoading } = useCollection<WinTransaction>(
    leaderboardQuery,
    { skip: !firestore }
  );

  const rankedWinners = useMemo(() => {
    if (!transactions || transactions.length === 0) {
        return [];
    }

    const winnerMap: { [userId: string]: AggregatedWinner } = {};

    transactions.forEach(txn => {
        if (!winnerMap[txn.userId]) {
            winnerMap[txn.userId] = {
                userId: txn.userId,
                userName: txn.userName,
                customId: txn.customId,
                totalWinnings: 0,
            };
        }
        winnerMap[txn.userId].totalWinnings += txn.amount;
    });

    return Object.values(winnerMap).sort((a, b) => b.totalWinnings - a.totalWinnings);
  }, [transactions]);


  return (
    <div className="flex flex-col gap-6">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Today's Winners</CardTitle>
          <CardDescription>
            Top winners for today across all markets.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Sr. No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Total Winnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-5 rounded-full mx-auto" />
                      </TableCell>
                       <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                       <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-24 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rankedWinners && rankedWinners.length > 0 ? (
                  rankedWinners.map((winner, index) => (
                    <TableRow key={winner.userId}>
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{winner.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{winner.customId || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold font-mono text-green-600">
                        ₹{winner.totalWinnings.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground h-24"
                    >
                      No winnings recorded yet for today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
