
"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
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
            // Sort bids within each game type by number
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
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <div className="border rounded-md p-4 space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (sortedGameTypes.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No bids for this session on the selected date.</p>
    }

  return (
    <div className="space-y-6">
        {sortedGameTypes.map(gameType => (
            <div key={gameType}>
                <h3 className="font-semibold text-lg mb-2">{gameType}</h3>
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Number</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Total Bids</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {groupedBids[gameType].map((bid) => (
                        <TableRow key={`${gameType}-${bid.number}`}>
                        <TableCell className="font-mono font-medium">{bid.number}</TableCell>
                        <TableCell className="text-right font-mono">₹{bid.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-mono">{bid.totalBids}</TableCell>
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
    
    // Fetch all 'Placed' bets for the market, without a date filter in the query.
    const betsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, "kalyan_bets"), 
            where("market", "==", marketName),
            where("status", "==", "Placed")
        );
    }, [firestore, marketName]);

    const { data: allBets, isLoading } = useCollection<Bet>(betsQuery, { skip: !betsQuery });
    
    // Filter bets by the selected date on the client-side.
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
                 return { number: numberPart, ...data };
            })
            .sort((a, b) => b.totalAmount - a.totalAmount);
    };
    
    const openSessionBids = useMemo(() => {
        const openBets = filteredBetsByDate?.filter(bet => bet.session === 'Open' || bet.session === 'Jodi');
        return aggregateBids(openBets);
    }, [filteredBetsByDate]);
    
    const closeSessionBids = useMemo(() => {
        const closeBets = filteredBetsByDate?.filter(bet => bet.session === 'Close');
        return aggregateBids(closeBets);
    }, [filteredBetsByDate]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aggregated Bids for {marketName}</h1>
          <p className="text-muted-foreground">
            A combined summary of all bids placed on this market for the selected date.
          </p>
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
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="open">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="open">Open Session</TabsTrigger>
                    <TabsTrigger value="close">Close Session</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="mt-4">
                    <AggregatedBidsTable bids={openSessionBids} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="close" className="mt-4">
                    <AggregatedBidsTable bids={closeSessionBids} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}
