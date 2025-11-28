
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
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";

type Bid = {
  id: string;
  userName: string;
  number: string;
  amount: number;
  createdAt: Timestamp;
  session: 'Open' | 'Close' | 'Jodi';
};

const BidsTable = ({ bids, isLoading }: { bids: Bid[], isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div className="border rounded-md p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </div>
        );
    }

    if (bids.length === 0) {
        return <p className="text-center text-muted-foreground p-8">No bids for this session and game type on the selected date.</p>
    }

  return (
    <div className="border rounded-md">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="py-1">User Name</TableHead>
                <TableHead className="py-1">Number</TableHead>
                <TableHead className="text-right py-1">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {bids.map((bid) => (
                <TableRow key={bid.id}>
                <TableCell className="py-1">{bid.userName}</TableCell>
                <TableCell className="font-mono font-medium py-1">{bid.number}</TableCell>
                <TableCell className="text-right font-mono py-1">₹{bid.amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </div>
  );
};


export default function BiddingDetailsPage() {
    const params = useParams();
    const firestore = useFirestore();
    const [date, setDate] = useState<Date>(new Date());
    const marketSlug = params.market as string;
    const betTypeSlug = params.bettype as string;

    const marketName = marketSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Convert slug to the name stored in the database
    const betTypeName = useMemo(() => {
        const slugToNameMap: { [key: string]: string } = {
            'single-digit': 'Single Digit',
            'jodi': 'Jodi',
            'single-panna': 'Single Panna',
            'double-panna': 'Double Panna',
            'triple-panna': 'Triple Panna',
            'open-sangam': 'Open Sangam',
            'close-sangam': 'Close Sangam',
            'full-sangam': 'Full Sangam',
        };
        return slugToNameMap[betTypeSlug] || betTypeSlug.replace(/-/g, ' ');
    }, [betTypeSlug]);

    const betsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, "kalyan_bets"), 
            where("market", "==", marketName),
            where("gameType", "==", betTypeName),
            where("status", "==", "Placed")
        );
    }, [firestore, marketName, betTypeName]);

    const { data: allBets, isLoading } = useCollection<Bid>(betsQuery, { skip: !betsQuery });

    // Filter by date on the client-side
    const filteredBetsByDate = useMemo(() => {
        if (!allBets || !date) return [];
        const interval = { start: startOfDay(date), end: endOfDay(date) };
        return allBets.filter(bet => bet.createdAt && isWithinInterval(bet.createdAt.toDate(), interval));
    }, [allBets, date]);


    const openSessionBids = useMemo(() => filteredBetsByDate?.filter((bet: any) => bet.session === 'Open') || [], [filteredBetsByDate]);
    const closeSessionBids = useMemo(() => filteredBetsByDate?.filter((bet: any) => bet.session === 'Close') || [], [filteredBetsByDate]);
    const jodiBids = useMemo(() => {
        const jodiTypes = ['Jodi', 'Full Sangam', 'Open Sangam', 'Close Sangam'];
        if (jodiTypes.includes(betTypeName)) {
            return filteredBetsByDate || [];
        }
        return [];
    }, [filteredBetsByDate, betTypeName]);
    
    const showTabs = !['Jodi', 'Full Sangam', 'Open Sangam', 'Close Sangam'].includes(betTypeName);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{betTypeName} Bids for {marketName}</h1>
          <p className="text-muted-foreground">
            A summary of all '{betTypeName}' bids placed on this market.
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
            {showTabs ? (
                <Tabs defaultValue="open">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="open">Open Session</TabsTrigger>
                        <TabsTrigger value="close">Close Session</TabsTrigger>
                    </TabsList>
                    <TabsContent value="open" className="mt-4">
                        <BidsTable bids={openSessionBids} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="close" className="mt-4">
                        <BidsTable bids={closeSessionBids} isLoading={isLoading} />
                    </TabsContent>
                </Tabs>
            ) : (
                 <BidsTable bids={jodiBids} isLoading={isLoading} />
            )}
        </CardContent>
      </Card>

    </div>
  );
}
