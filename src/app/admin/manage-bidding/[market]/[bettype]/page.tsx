
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";
import Link from "next/link";

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
            <div className="border rounded-md p-4 space-y-2 border-white/20">
                <Skeleton className="h-5 w-full bg-white/20" />
                <Skeleton className="h-5 w-full bg-white/20" />
                <Skeleton className="h-5 w-full bg-white/20" />
            </div>
        );
    }

    if (bids.length === 0) {
        return <p className="text-center text-white/80 p-8">No bids for this session and game type on the selected date.</p>
    }

  return (
    <div className="border rounded-md border-white/20">
        <Table>
            <TableHeader className="border-b border-white/20">
            <TableRow>
                <TableHead className="py-2 text-white">User Name</TableHead>
                <TableHead className="py-2 text-white">Number</TableHead>
                <TableHead className="text-right py-2 text-white">Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {bids.map((bid) => (
                <TableRow key={bid.id} className="border-t border-white/20">
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
    
    const { betTypeName, specificSession } = useMemo(() => {
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

        if (betTypeSlug === 'open') {
            return { betTypeName: 'Single Digit', specificSession: 'Open' as const };
        }
        if (betTypeSlug === 'close') {
            return { betTypeName: 'Single Digit', specificSession: 'Close' as const };
        }

        const resolvedName = slugToNameMap[betTypeSlug] || betTypeSlug.replace(/-/g, ' ');
        return { betTypeName: resolvedName, specificSession: null };
    }, [betTypeSlug]);

    const pageTitle = (betTypeSlug === 'open' || betTypeSlug === 'close') ? `${betTypeSlug.charAt(0).toUpperCase() + betTypeSlug.slice(1)} Digit` : betTypeName;

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
    
    const showTabs = !specificSession && !['Jodi', 'Full Sangam', 'Open Sangam', 'Close Sangam'].includes(betTypeName);

  return (
    <div className="flex flex-col gap-6">
       <Button asChild variant="ghost" className="text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 dark:hover:text-white w-fit">
            <Link href={`/admin/manage-bidding/${marketSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bet Types
            </Link>
        </Button>
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <CardTitle className="tracking-tight">{pageTitle} Bids for {marketName}</CardTitle>
                <CardDescription className="text-white/80">
                    All '{pageTitle}' bids for the selected date.
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
            {specificSession === 'Open' ? (
                <BidsTable bids={openSessionBids} isLoading={isLoading} />
            ) : specificSession === 'Close' ? (
                <BidsTable bids={closeSessionBids} isLoading={isLoading} />
            ) : showTabs ? (
                <Tabs defaultValue="open">
                    <TabsList className="grid w-full grid-cols-2 bg-black/20">
                        <TabsTrigger value="open" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Open Session</TabsTrigger>
                        <TabsTrigger value="close" className="text-white/80 data-[state=active]:bg-white data-[state=active]:text-black">Close Session</TabsTrigger>
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
