
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

type Bid = {
  id: string;
  userName: string;
  number: string;
  amount: number;
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
                <TableHead>User Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead className="text-right">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {bids.map((bid) => (
                <TableRow key={bid.id}>
                <TableCell>{bid.userName}</TableCell>
                <TableCell className="font-mono font-medium">{bid.number}</TableCell>
                <TableCell className="text-right font-mono">₹{bid.amount.toLocaleString('en-IN')}</TableCell>
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
    const betTypeName = betTypeSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    const betsQuery = useMemoFirebase(() => {
        if (!firestore || !date) return null;

        const start = startOfDay(date);
        const end = endOfDay(date);

        return query(
            collection(firestore, "kalyan_bets"), 
            where("market", "==", marketName),
            where("gameType", "==", betTypeName),
            where("createdAt", ">=", Timestamp.fromDate(start)),
            where("createdAt", "<=", Timestamp.fromDate(end)),
            orderBy("createdAt", "desc")
        );
    }, [firestore, marketName, betTypeName, date]);

    const { data: bets, isLoading } = useCollection<Bid>(betsQuery, { skip: !betsQuery });

    const openSessionBids = useMemo(() => bets?.filter((bet: any) => bet.session === 'Open') || [], [bets]);
    const closeSessionBids = useMemo(() => bets?.filter((bet: any) => bet.session === 'Close') || [], [bets]);
    const jodiBids = useMemo(() => {
        if (betTypeName === 'Jodi' || betTypeName === 'Full Sangam') {
            return bets || [];
        }
        return [];
    }, [bets, betTypeName]);
    
    const showTabs = betTypeName !== 'Jodi' && betTypeName !== 'Full Sangam';

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
