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
import { collection, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval, parse } from "date-fns";
import { toZonedTime } from 'date-fns-tz';

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

const ITEMS_PER_PAGE = 50;

// Helper to parse date string and validate it
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;
    const date = parse(dateStr, 'dd/MM/yyyy', new Date());
    if (isNaN(date.getTime())) return null;
    return date;
}

export default function BetLedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  const [dateInput, setDateInput] = useState<string>('');
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Query to get all bets for the current user.
  const betsQuery = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return query(collection(firestore, 'kalyan_bets'), where('userId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: rawBets, isLoading, error } = useCollection<Bet>(betsQuery);

  // Filter and sort bets on the client-side.
  const bets = useMemo(() => {
    if (!rawBets) return [];

    let filtered = rawBets;

    if (date) {
      const timeZone = 'Asia/Kolkata';
      const zonedDate = toZonedTime(date, timeZone);
      const startOfSelectedDay = startOfDay(zonedDate);
      const endOfSelectedDay = endOfDay(zonedDate);
      
      filtered = rawBets.filter(bet => {
        const betDate = bet.createdAt.toDate();
        const betZonedDate = toZonedTime(betDate, timeZone);
        return isWithinInterval(betZonedDate, { start: startOfSelectedDay, end: endOfSelectedDay });
      });
    }

    return [...filtered].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [rawBets, date]);

  useEffect(() => {
    setCurrentPage(1);
  }, [date]);

  const totalPages = Math.ceil((bets?.length || 0) / ITEMS_PER_PAGE);
  const paginatedBets = useMemo(() => {
    if (!bets) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return bets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [bets, currentPage]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching bets:", error);
    }
  }, [error]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';
    if (rawValue.length > 0) {
        formattedValue = rawValue.slice(0, 2);
    }
    if (rawValue.length > 2) {
        formattedValue += '/' + rawValue.slice(2, 4);
    }
    if (rawValue.length > 4) {
        formattedValue += '/' + rawValue.slice(4, 8);
    }
    setDateInput(formattedValue);
  };

  const handleFilter = () => {
    const newDate = parseDateString(dateInput);
    if (newDate) {
        setDate(newDate);
        setPopoverOpen(false);
    } else if (dateInput) {
        toast({
            variant: "destructive",
            title: "Invalid Date",
            description: "Please enter a date in DD/MM/YYYY format.",
        });
    } else {
        handleClear();
    }
  }

  const handleClear = () => {
    setDate(undefined);
    setDateInput('');
    setPopoverOpen(false);
  }

  const isPageLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full">
                <CardTitle>My Bet Ledger</CardTitle>
                <CardDescription className="text-white/80">
                    A complete history of all your bets.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                {date && (
                    <div className="text-xs font-semibold pr-2">Filtered to: {format(date, "dd/MM/yyyy")}</div>
                )}
                 <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                         <Button variant="outline" className="w-full sm:w-auto bg-transparent text-white hover:bg-white/10">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter by Date
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-screen max-w-xs sm:w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Select Date</h4>
                                <p className="text-sm text-muted-foreground">
                                Enter a date in DD/MM/YYYY format.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date-filter">Date</Label>
                                    <Input
                                        id="date-filter"
                                        placeholder="DD/MM/YYYY"
                                        value={dateInput}
                                        onChange={handleDateInputChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Button onClick={handleFilter} className="w-full">Go</Button>
                                    <Button onClick={handleClear} variant="secondary" className="w-full">Clear</Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
            {isPageLoading ? (
                <div className="space-y-4 p-4">
                    <Skeleton className="h-20 w-full bg-white/20" />
                    <Skeleton className="h-20 w-full bg-white/20" />
                    <Skeleton className="h-20 w-full bg-white/20" />
                </div>
            ) : error ? (
                <div className="text-center py-16 text-red-400">
                    <p>Error loading bets. Please try again later.</p>
                    <p className="text-xs text-white/50">{error.message}</p>
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
                                            {bet.status === 'Won' ? '+₹' + (bet.winningAmount?.toLocaleString() || 0) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="grid gap-4 md:hidden px-4 pb-4">
                        {paginatedBets.map((bet) => (
                            <Card key={bet.id} className="p-4 bg-black/20 border-white/20 text-xs text-white">
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
                                        <span className="font-mono font-bold text-lg">{bet.number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/80">Bet:</span>
                                        <span className="font-mono font-semibold text-red-300">-₹{bet.amount.toLocaleString()}</span>
                                    </div>
                                     <div className="flex justify-between">
                                        <span className="text-white/80">Winnings:</span>
                                        <span className="font-mono font-semibold text-green-300">
                                            {bet.status === 'Won' ? '+₹' + (bet.winningAmount?.toLocaleString() || 0) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                 <div className="text-center py-16 text-white/80">
                    <p>You haven't placed any bets {date ? "on this date" : "yet"}.</p>
                </div>
            )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between pt-6">
                <Button
                    variant="outline"
                    className="bg-transparent text-white hover:bg-white/10"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="text-sm font-semibold">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    className="bg-transparent text-white hover:bg-white/10"
                    onClick={() => setCurrentPage(p => p + 1)}
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
