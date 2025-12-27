
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

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

const months = [
  { value: "0", label: "January" }, { value: "1", label: "February" }, { value: "2", label: "March" },
  { value: "3", label: "April" }, { value: "4", label: "May" }, { value: "5", label: "June" },
  { value: "6", label: "July" }, { value: "7", label: "August" }, { value: "8", label: "September" },
  { value: "9", label: "October" }, { value: "10", label: "November" }, { value: "11", label: "December" },
];

const years = [
  new Date().getFullYear().toString(),
  (new Date().getFullYear() - 1).toString(),
];

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());


export default function BetLedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [day, setDay] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<string | undefined>(undefined);
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const betsQuery = useMemoFirebase(
    () => (firestore && user ? query(
        collection(firestore, "kalyan_bets"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
    ) : null),
    [firestore, user]
  );
  
  const { data: bets, isLoading } = useCollection<Bet>(betsQuery);

  const handleFilter = () => {
    if (day && month && year) {
        const newDate = new Date(parseInt(year), parseInt(month), parseInt(day));
        setDate(newDate);
    }
    setPopoverOpen(false);
  }

  const handleClear = () => {
    setDate(undefined);
    setDay(undefined);
    setMonth(undefined);
    setYear(undefined);
    setPopoverOpen(false);
  }

  const filteredBets = useMemo(() => {
    if (!bets) return [];
    if (!date) return bets;

    const timeZone = 'Asia/Kolkata';
    const zonedDate = toZonedTime(date, timeZone);
    
    const startOfSelectedDay = startOfDay(zonedDate);
    const endOfSelectedDay = endOfDay(zonedDate);

    return bets.filter(bet => {
        const betDate = bet.createdAt.toDate();
        const betZonedDate = toZonedTime(betDate, timeZone);
        return isWithinInterval(betZonedDate, { start: startOfSelectedDay, end: endOfSelectedDay });
    });
  }, [bets, date]);

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
                                Select a day, month, and year to filter bets.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-2">
                                    <Select onValueChange={setDay} value={day}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Day" /></SelectTrigger>
                                        <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select onValueChange={setMonth} value={month}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Month" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select onValueChange={setYear} value={year}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
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
            ) : filteredBets && filteredBets.length > 0 ? (
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
                                {filteredBets.map((bet) => (
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
                    <div className="grid gap-4 md:hidden px-4">
                        {filteredBets.map((bet) => (
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
      </Card>
    </div>
  );
}
