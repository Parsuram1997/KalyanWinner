
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
    rank: number;
}

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    return query(
      collection(firestore, "transactions"),
      where("type", "==", "Win"),
      where("status", "==", "Completed")
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

    const today = new Date();
    const todayDateString = today.toDateString(); // e.g., "Thu May 23 2024"

    const todaysTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.toDateString() === todayDateString;
    });

    const winnerMap: { [userId: string]: { userId: string, userName: string, customId?:string, totalWinnings: number } } = {};

    todaysTransactions.forEach(txn => {
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

    const sortedWinners = Object.values(winnerMap).sort((a, b) => b.totalWinnings - a.totalWinnings);

    let lastAmount = -1;
    let currentRank = 0;

    return sortedWinners.map((winner, index) => {
        if (winner.totalWinnings !== lastAmount) {
            currentRank = index + 1;
            lastAmount = winner.totalWinnings;
        }
        return {
            ...winner,
            rank: currentRank,
        };
    });

  }, [transactions]);


  return (
    <div className="flex flex-col gap-6">
      <Card className="w-full bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="text-center items-center">
          <div className="mx-auto bg-white/10 p-3 rounded-full">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-white">Today's Winners</CardTitle>
          <CardDescription className="text-white/80">
            Top winners for today across all markets.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border border-white/20">
            <Table>
              <TableHeader className="border-b-white/20">
                <TableRow className="border-b-0">
                  <TableHead className="text-center w-20 text-white">Rank</TableHead>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">User ID</TableHead>
                  <TableHead className="text-right text-white">Total Winnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-0">
                      <TableCell className="text-center py-3">
                        <Skeleton className="h-5 w-5 rounded-full mx-auto bg-white/20" />
                      </TableCell>
                       <TableCell className="py-3">
                        <Skeleton className="h-5 w-24 bg-white/20" />
                      </TableCell>
                       <TableCell className="py-3">
                        <Skeleton className="h-5 w-20 bg-white/20" />
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Skeleton className="h-5 w-24 ml-auto bg-white/20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rankedWinners && rankedWinners.length > 0 ? (
                  rankedWinners.map((winner) => (
                    <TableRow key={winner.userId} className="border-0">
                      <TableCell className="text-center font-medium py-3 text-white/90">
                        {winner.rank}
                      </TableCell>
                      <TableCell className="py-3 text-white">{winner.userName}</TableCell>
                      <TableCell className="text-xs text-white/70 py-3">{winner.customId || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold font-mono text-green-300 py-3">
                        ₹{winner.totalWinnings.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-0">
                    <TableCell
                      colSpan={4}
                      className="text-center text-white/70 h-24"
                    >
                      No winnings recorded yet for today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden px-4">
             {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="p-4 bg-black/20 border-white/20">
                        <Skeleton className="h-12 w-full bg-white/20" />
                      </Card>
                  ))
             ) : rankedWinners && rankedWinners.length > 0 ? (
                rankedWinners.map((winner) => (
                    <Card key={winner.userId} className="p-4 bg-black/20 border-white/20">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-bold text-white">
                                    {winner.rank}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{winner.userName}</p>
                                    <p className="text-xs text-white/70">{winner.customId || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-mono font-bold text-green-300">₹{winner.totalWinnings.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-white/70">Winnings</p>
                            </div>
                        </div>
                    </Card>
                ))
             ) : (
                <div className="text-center text-white/70 h-24 flex items-center justify-center">
                    No winnings recorded yet for today.
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
