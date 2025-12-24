
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type Bet = {
    id: string;
    market: string;
    gameType: string;
    number: string;
    amount: number;
    status: 'Placed' | 'Won' | 'Lost';
    createdAt: Timestamp;
    winningAmount?: number;
};

const BETS_PER_PAGE = 25;

const getStatusClasses = (status: Bet['status']) => {
    switch (status) {
        case 'Won':
            return 'bg-green-400/20 text-green-300 border border-green-400/80';
        case 'Lost':
            return 'bg-red-400/20 text-red-300 border border-red-400/80';
        case 'Placed':
            return 'bg-blue-400/20 text-blue-300 border border-blue-400/80';
        default:
            return 'bg-white/20 text-white';
    }
};

export default function BetLedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);

  const betsQuery = useMemoFirebase(
    () => (firestore && user ? query(
        collection(firestore, "kalyan_bets"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
    ) : null),
    [firestore, user]
  );
  
  const { data: bets, isLoading } = useCollection<Bet>(betsQuery, { skip: !firestore || !user });

  const totalPages = Math.ceil((bets?.length || 0) / BETS_PER_PAGE);

  const paginatedBets = useMemo(() => {
    if (!bets) return [];
    const startIndex = (currentPage - 1) * BETS_PER_PAGE;
    const endIndex = startIndex + BETS_PER_PAGE;
    return bets.slice(startIndex, endIndex);
  }, [bets, currentPage]);
  
  const isPageLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader>
          <CardTitle>My Bet Ledger</CardTitle>
          <CardDescription className="text-white/80">
            A complete history of all your bets.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
            {isPageLoading ? (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-20 w-full bg-white/20" />
                    <Skeleton className="h-20 w-full bg-white/20" />
                    <Skeleton className="h-20 w-full bg-white/20" />
                </div>
            ) : paginatedBets && paginatedBets.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-md border border-white/20">
                        <Table>
                            <TableHeader className="border-b-white/20">
                                <TableRow>
                                    <TableHead className="text-white">Date</TableHead>
                                    <TableHead className="text-white">Market & Game</TableHead>
                                    <TableHead className="text-white">Number</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-right text-white">Bet Amount</TableHead>
                                    <TableHead className="text-right text-white">Winning Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBets.map((bet) => (
                                    <TableRow key={bet.id} className="border-white/20">
                                        <TableCell className="py-2 text-xs">{new Date(bet.createdAt.toDate()).toLocaleString('en-GB')}</TableCell>
                                        <TableCell className="py-2">
                                            <div className="font-medium">{bet.market}</div>
                                            <div className="text-xs text-white/80">{bet.gameType}</div>
                                        </TableCell>
                                        <TableCell className="font-mono py-2">{bet.number}</TableCell>
                                        <TableCell className="py-2">
                                            <Badge className={cn('text-xs', getStatusClasses(bet.status))}>{bet.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold py-2 text-red-300">-₹{bet.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold py-2 text-green-300">
                                            {bet.status === 'Won' ? `+₹${bet.winningAmount?.toLocaleString() || 0}` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="grid gap-4 md:hidden px-4">
                        {paginatedBets.map((bet) => (
                            <Card key={bet.id} className="p-4 bg-black/20 border-white/20 text-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{bet.market}</p>
                                        <p className="text-white/80">{new Date(bet.createdAt.toDate()).toLocaleString('en-GB')}</p>
                                    </div>
                                    <Badge className={cn('text-xs', getStatusClasses(bet.status))}>{bet.status}</Badge>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-white/80">Game:</span>
                                        <span className="font-medium">{bet.gameType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/80">Number:</span>
                                        <span className="font-mono font-bold text-base">{bet.number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/80">Bet:</span>
                                        <span className="font-mono font-semibold text-red-300">-₹{bet.amount.toLocaleString()}</span>
                                    </div>
                                     <div className="flex justify-between">
                                        <span className="text-white/80">Winnings:</span>
                                        <span className="font-mono font-semibold text-green-300">
                                            {bet.status === 'Won' ? `+₹${bet.winningAmount?.toLocaleString() || 0}` : '-'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                 <div className="text-center py-16 text-white/80">
                    <p>You haven't placed any bets yet.</p>
                </div>
            )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex justify-end items-center gap-4 border-t border-white/20 pt-4 px-4 sm:px-6">
                <span className="text-sm text-white/80">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-white hover:bg-white/10"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent text-white hover:bg-white/10"
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
