
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Wallet, Ticket, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";

type Bet = {
    id: string;
    gameType: string;
    number: string;
    amount: number;
    session: 'Open' | 'Close' | 'Jodi';
    createdAt: Timestamp;
    status: 'Placed' | 'Won' | 'Lost';
}

type AggregatedBid = {
  gameType: string;
  number: string;
  totalAmount: number;
  totalBids: number;
};

const AggregatedBidsTable = ({ bids, isLoading }: { bids: AggregatedBid[], isLoading: boolean }) => {
    const groupedBids = useMemo(() => {
        return bids.reduce((acc, bid) => {
            if (!acc[bid.gameType]) {
                acc[bid.gameType] = [];
            }
            acc[bid.gameType].push(bid);
            acc[bid.gameType].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
            return acc;
        }, {} as Record<string, AggregatedBid[]>);
    }, [bids]);

    const sortedGameTypes = useMemo(() => {
        const order = ["Single Digit", "Jodi", "Single Panna", "Double Panna", "Triple Panna", "Open Sangam", "Close Sangam", "Full Sangam"];
        return Object.keys(groupedBids).sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [groupedBids]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-6 w-1/4 mb-2 bg-white/20" />
                        <div className="border rounded-md p-4 space-y-2 border-white/20">
                            <Skeleton className="h-5 w-full bg-white/20" />
                            <Skeleton className="h-5 w-full bg-white/20" />
                            <Skeleton className="h-5 w-full bg-white/20" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (sortedGameTypes.length === 0) {
        return <p className="text-center text-white/80 p-8">No bids for this session on the selected date.</p>
    }

  return (
    <div className="space-y-6">
        {sortedGameTypes.map(gameType => (
            <div key={gameType}>
                <h3 className="font-semibold text-lg mb-2 text-white">{gameType}</h3>
                <div className="border rounded-md border-white/20">
                <Table>
                    <TableHeader className="border-b border-white/20">
                    <TableRow>
                        <TableHead className="w-[100px] py-2 text-white">Number</TableHead>
                        <TableHead className="text-right py-2 text-white">Total Amount</TableHead>
                        <TableHead className="text-right py-2 text-white">Total Bids</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {groupedBids[gameType].map((bid) => (
                        <TableRow key={`${gameType}-${bid.number}`} className="border-t border-white/20">
                        <TableCell className="font-mono font-medium py-1">{bid.number}</TableCell>
                        <TableCell className="text-right font-mono py-1">₹{bid.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-mono py-1">{bid.totalBids}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            </div>
        ))}
    </div>
  );
};


export default function AggregatedBiddingDetailsPage() {
    const params = useParams();
    const firestore = useFirestore();
    const [date, setDate] = useState<Date>(new Date());
    const marketSlug = params.market as string;

    const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    const betsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, "kalyan_bets"), 
            where("market", "==", marketName),
            where("status", "in", ["Placed", "Won", "Lost"])
        );
    }, [firestore, marketName]);

    const { data: allBets, isLoading } = useCollection<Bet>(betsQuery, { skip: !betsQuery });
    
    const filteredBetsByDate = useMemo(() => {
        if (!allBets || !date) return [];
        const interval = { start: startOfDay(date), end: endOfDay(date) };
        return allBets.filter(bet => bet.createdAt && isWithinInterval(bet.createdAt.toDate(), interval));
    }, [allBets, date]);
    

    const aggregateBids = (betsForSession: Bet[] | undefined) => {
        if (!betsForSession) return [];
        const bidMap: Record<string, { gameType: string, totalAmount: number, totalBids: number }> = {};

        betsForSession.forEach((bet) => {
            const { gameType, number, amount } = bet;
            const key = `${gameType}-${number}`;
            if (!bidMap[key]) {
                bidMap[key] = { gameType, totalAmount: 0, totalBids: 0 };
            }
            bidMap[key].totalAmount += amount;
            bidMap[key].totalBids += 1;
        });

        return Object.entries(bidMap)
            .map(([key, data]) => {
                 const numberPart = key.substring(data.gameType.length + 1);
                 return {
                    number: numberPart,
                    gameType: data.gameType,
                    totalAmount: data.totalAmount,
                    totalBids: data.totalBids
                 };
            })
            .sort((a, b) => b.totalAmount - a.totalAmount);
    };

    const openSessionBets = useMemo(() => {
        const openSessionGameTypes = ['Single Digit', 'Jodi', 'Single Panna', 'Double Panna', 'Triple Panna', 'Open Sangam', 'Close Sangam', 'Full Sangam'];
        const openSessionSessions = ['Open', 'Jodi'];

        return filteredBetsByDate?.filter(bet => {
            if (openSessionGameTypes.includes(bet.gameType) && openSessionSessions.includes(bet.session)) {
                return true;
            }
            if (bet.gameType.includes('Sangam')) {
                return true;
            }
            return false;
        }) || [];
    }, [filteredBetsByDate]);
    
    const closeSessionBets = useMemo(() => {
        return filteredBetsByDate?.filter(bet => bet.session === 'Close') || [];
    }, [filteredBetsByDate]);

    const openSessionAggregated = useMemo(() => aggregateBids(openSessionBets), [openSessionBets]);
    const closeSessionAggregated = useMemo(() => aggregateBids(closeSessionBets), [closeSessionBets]);

    const calculateTotals = (aggregatedBids: AggregatedBid[]) => {
        return aggregatedBids.reduce((acc, bid) => {
            acc.totalAmount += bid.totalAmount;
            acc.totalBids += bid.totalBids;
            return acc;
        }, { totalAmount: 0, totalBids: 0 });
    };

    const openSessionTotals = useMemo(() => calculateTotals(openSessionAggregated), [openSessionAggregated]);
    const closeSessionTotals = useMemo(() => calculateTotals(closeSessionAggregated), [closeSessionAggregated]);

  return (
    <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white w-fit">
            <Link href="/admin/manage-bidding">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Markets
            </Link>
        </Button>
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
            <CardTitle className="tracking-tight">Aggregated Bids for {marketName}</CardTitle>
            <CardDescription className="text-white/80">
                A combined summary of all bids for the selected date.
            </CardDescription>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal bg-black/20 border-white/20 text-white hover:bg-black/30 hover:text-white",
                    !date && "text-white/70"
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
            <Tabs defaultValue="open">
                <TabsList className="grid w-full grid-cols-2 bg-black/20">
                    <TabsTrigger value="open" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Open Session</TabsTrigger>
                    <TabsTrigger value="close" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Close Session</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        <Card className="bg-black/20 border-white/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white">Total Open Amount</CardTitle>
                                <Wallet className="h-4 w-4 text-white/80" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : <div className="text-2xl font-bold font-mono">₹{openSessionTotals.totalAmount.toLocaleString('en-IN')}</div>}
                            </CardContent>
                        </Card>
                         <Card className="bg-black/20 border-white/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white">Total Open Bids</CardTitle>
                                <Ticket className="h-4 w-4 text-white/80" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-24 bg-white/20" /> : <div className="text-2xl font-bold font-mono">{openSessionTotals.totalBids.toLocaleString('en-IN')}</div>}
                            </CardContent>
                        </Card>
                    </div>
                    <AggregatedBidsTable bids={openSessionAggregated} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="close" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        <Card className="bg-black/20 border-white/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white">Total Close Amount</CardTitle>
                                <Wallet className="h-4 w-4 text-white/80" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : <div className="text-2xl font-bold font-mono">₹{closeSessionTotals.totalAmount.toLocaleString('en-IN')}</div>}
                            </CardContent>
                        </Card>
                         <Card className="bg-black/20 border-white/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white">Total Close Bids</CardTitle>
                                <Ticket className="h-4 w-4 text-white/80" />
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <Skeleton className="h-8 w-24 bg-white/20" /> : <div className="text-2xl font-mono font-bold">{closeSessionTotals.totalBids.toLocaleString('en-IN')}</div>}
                            </CardContent>
                        </Card>
                    </div>
                    <AggregatedBidsTable bids={closeSessionAggregated} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </CardContent>
        </Card>
    </div>
  );
}
